import * as vscode from 'vscode';
import { AbstractAwsService } from '../AbstractAwsService';
import { S3TreeDataProvider } from './S3TreeDataProvider';
import { S3TreeItem } from './S3TreeItem';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import * as ui from '../../common/UI';
import * as api from './API';
import { S3Explorer } from './S3Explorer';
import { S3Search } from './S3Search';
import { Telemetry } from '../../common/Telemetry';
import { isLicenseValid, promptForLicense } from "../../common/License";
import { Session } from '../../common/Session';

export class S3Service extends AbstractAwsService {
    public static Instance: S3Service;
    public serviceId = 's3';
    public treeDataProvider: S3TreeDataProvider;
    public context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        super();
        S3Service.Instance = this;
        this.context = context;
        // Load generic state (hidden/fav)
        this.loadBaseState();
        // Load custom resources
        this.loadCustomResources();

        this.treeDataProvider = new S3TreeDataProvider();
        this.Refresh();
    }

    public registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider, treeView: vscode.TreeView<WorkbenchTreeItem>): void {
        const wrap = (node: any) => {
            if (node instanceof WorkbenchTreeItem) {
                return node.itemData as S3TreeItem;
            }
            return node as S3TreeItem;
        };

        context.subscriptions.push(
            vscode.commands.registerCommand('aws-workbench.s3.Refresh', () => {
                this.Refresh();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.s3.AddBucket', async () => {
                await this.AddBucket();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.s3.RemoveBucket', async (node: any) => {
                await this.RemoveBucket(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.s3.Goto', async (node: any) => {
                await this.Goto(wrap(node));
            }),
            vscode.commands.registerCommand('aws-workbench.s3.RemoveShortcut', async (node: any) => {
                await this.RemoveShortcut(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.s3.AddShortcut', async (node: any) => {
                await this.AddShortcut(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.s3.CopyShortcut', async (node: any) => {
                await this.CopyShortcut(wrap(node));
            }),
            vscode.commands.registerCommand('aws-workbench.s3.ShowS3Explorer', (node: any) => {
                this.ShowS3Explorer(wrap(node));
            }),
            vscode.commands.registerCommand('aws-workbench.s3.ShowS3Search', (node: any) => {
                this.ShowS3Search(wrap(node));
            })        
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const buckets = await this.treeDataProvider.GetBucketNodes();
        const items = buckets.map(b => this.mapToWorkbenchItem(b));
        
        // Add ungrouped custom resources (not in any folder)
        const ungroupedCustomResources = this.getCustomResourcesByFolder(null);
        for (const resource of ungroupedCustomResources) {
            const customItem = new WorkbenchTreeItem(
                this.getDisplayName(resource),
                vscode.TreeItemCollapsibleState.Collapsed,
                this.serviceId,
                'customResource',
                resource.resourceData
            );
            customItem.isCustom = true;
            customItem.compositeKey = resource.compositeKey;
            customItem.displayName = resource.displayName;
            customItem.awsName = resource.awsName;
            items.push(customItem);
        }
        
        // Apply generic filters
        return this.processNodes(items);
    }

    public mapToWorkbenchItem(n: any): WorkbenchTreeItem {
        const item = new WorkbenchTreeItem(
            typeof n.label === 'string' ? n.label : (n.label as any)?.label || '',
            n.collapsibleState || vscode.TreeItemCollapsibleState.None,
            this.serviceId,
            n.contextValue,
            n
        );
        // Ensure we have an ID for tracking
        if (!item.id && n.Bucket) { item.id = n.Bucket; }
        
        // Proxy properties from inner item to wrapper
        if (n.iconPath) item.iconPath = n.iconPath;
        if (n.description) item.description = n.description;
        if (n.tooltip) item.tooltip = n.tooltip;
        if (n.command) item.command = n.command;
        if (n.resourceUri) item.resourceUri = n.resourceUri;
        
        return item;
    }

    async getChildren(element?: WorkbenchTreeItem): Promise<WorkbenchTreeItem[]> {
        if (!element) {
            return this.getRootNodes();
        }

        const internalItem = element.itemData;
        if (!internalItem) return [];

        const children = await this.treeDataProvider.getChildren(internalItem);
        const items = (children || []).map((child: any) => this.mapToWorkbenchItem(child));
        return this.processNodes(items);
    }

    async getTreeItem(element: WorkbenchTreeItem): Promise<vscode.TreeItem> {
        return element;
    }

    override async addResource(folderId?: string | null): Promise<WorkbenchTreeItem | undefined> {
        return await this.AddBucket(folderId);
    }

    // --- Helper to apply generic states (Hide/Fav) ---
    protected processNodes(nodes: WorkbenchTreeItem[]): WorkbenchTreeItem[] {
        // 1. Filter hidden
        const visible = Session.Current?.IsShowHiddenNodes ? nodes : nodes.filter(n => !this.isHidden(n));
        
        // 2. Mark Favs and add tags
        visible.forEach(n => {
            if (this.isFav(n)) {
                n.contextValue = (n.contextValue || '') + '#Fav#';
            } else {
                n.contextValue = (n.contextValue || '') + '#!Fav#';
            }

            // Tag as AwsResource to enable generic commands in package.json
            n.contextValue = (n.contextValue || '') + '#AwsResource#';
        });

        // 3. Filter "Show Only Fav" if enabled
        if (Session.Current?.IsShowOnlyFavorite) {
            return visible.filter(n => this.isFav(n));
        }

        return visible;
    }

    // --- Actions (Overriding AbstractAwsService where necessary or using S3 specific logic) ---

    // We can rely on AbstractAwsService for hide/fav/unhide/deleteFromFav
    // But S3Service originally had specific 'ShowOnlyInThisProfile'.
    public override showOnlyInProfile(node: WorkbenchTreeItem, profile: string) {
        // S3 logic updates the specific Bucket profile
        const s3Node = node.itemData as S3TreeItem;
        if (s3Node && s3Node.Bucket) {
             s3Node.ProfileToShow = profile;
             this.treeDataProvider.AddBucketProfile(s3Node.Bucket, profile);
             super.showOnlyInProfile(node, profile); // also save generic state if desired
             this.Refresh();
        }
    }

    public override showInAnyProfile(node: WorkbenchTreeItem) {
        const s3Node = node.itemData as S3TreeItem;
        if (s3Node && s3Node.Bucket) {
             s3Node.ProfileToShow = "";
             this.treeDataProvider.RemoveBucketProfile(s3Node.Bucket);
             super.showInAnyProfile(node);
             this.Refresh();
        }
    }
   
    // ... (Keep existing specific methods: AddBucket, RemoveBucket, etc.)

    async TestAwsConnection() {
        let response = await api.TestAwsCredentials();
        if (response.isSuccessful && response.result) {
            ui.logToOutput('Aws Credentials Found, Test Successfull');
            ui.showInfoMessage('Aws Credentials Found, Test Successfull');
        } else {
            ui.logToOutput('S3Service.TestAwsConnection Error !!!', response.error);
            ui.showErrorMessage('Aws Credentials Can Not Be Found !!!', response.error);
        }

        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) { return; }

        response = await api.TestAwsConnection(selectedRegion);
        if (response.isSuccessful && response.result) {
            ui.logToOutput('Aws Connection Test Successfull');
            ui.showInfoMessage('Aws Connection Test Successfull');
        } else {
            ui.logToOutput('S3Service.TestAwsConnection Error !!!', response.error);
            ui.showErrorMessage('Aws Connection Test Error !!!', response.error);
        }
    }

    Refresh(): void {
        ui.logToOutput('S3Service.refresh Started');
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: "Aws S3: Loading...",
        }, (progress, token) => {
            progress.report({ increment: 0 });
            return new Promise<void>(resolve => { resolve(); });
        });
    }

    // ... (Keep existing SaveState/LoadState but ensuring we don't conflict)
    

    async AddBucket(preselectedFolderId?: string | null): Promise<WorkbenchTreeItem | undefined> {
        Telemetry.Current?.send("S3Service.AddBucket");
        ui.logToOutput('S3Service.AddBucket Started');
        
        if (!Session.Current) {
            ui.showErrorMessage('Session not initialized', new Error('No session'));
            return;
        }
        
        // Step 1: Select folder for this bucket (skip if folder is preselected)
        let folderId: string | null | undefined = preselectedFolderId;
        if (preselectedFolderId === undefined) {
            const FolderManager = (await import('../../common/FolderManager')).FolderManager;
            folderId = await FolderManager.showFolderQuickPick(Session.Current, this.serviceId);
            if (folderId === undefined) { return; } // User cancelled
        }
        
        let selectedBucketName = await vscode.window.showInputBox({ placeHolder: 'Enter Bucket Name / Search Text' });
        if (selectedBucketName === undefined) { return; }
        var resultBucket = await api.GetBucketList(selectedBucketName);
        if (!resultBucket.isSuccessful) { return; }
        let selectedBucketList = await vscode.window.showQuickPick(resultBucket.result, { canPickMany: true, placeHolder: 'Select Bucket(s)' });
        if (!selectedBucketList || selectedBucketList.length === 0) { return; }
        
        let lastAddedItem: S3TreeItem | undefined;
        for (var selectedBucket of selectedBucketList) {
            lastAddedItem = this.treeDataProvider.AddBucket(selectedBucket);
            
            // Step 2: Capture custom display name (optional)
            const displayName = await vscode.window.showInputBox({
                prompt: 'Enter custom name for this bucket (optional)',
                placeHolder: 'Leave blank to use bucket name',
                value: '',
            });
            
            // Step 3: Save as custom resource
            const compositeKey = `${this.serviceId}:${selectedBucket}`;
            await this.addCustomResource(
                compositeKey,
                displayName || '',
                selectedBucket,
                { bucketName: selectedBucket },
                folderId || undefined
            );
        }
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }

    async RemoveBucket(node: S3TreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.S3Bucket || !node.Bucket) { return; }
        Telemetry.Current?.send("S3Service.RemoveBucket");
        ui.logToOutput('S3Service.RemoveBucket Started');
        this.treeDataProvider.RemoveBucket(node.Bucket);
        
        // Also remove from custom resources if it exists
        const compositeKey = `${this.serviceId}:${node.Bucket}`;
        await this.removeCustomResource(compositeKey);
    }

    async Goto(node: S3TreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.S3Bucket || !node.Bucket) { return; }
        ui.logToOutput('S3Service.Goto Started');
        let shortcut = await vscode.window.showInputBox({ placeHolder: 'Enter a Folder/File Key' });
        if (shortcut === undefined) { return; }
        S3Explorer.Render(this.context.extensionUri, node, shortcut);
    }

    async RemoveShortcut(node: S3TreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.S3Shortcut || !node.Bucket || !node.Shortcut) { return; }
        Telemetry.Current?.send("S3Service.RemoveShortcut");
        ui.logToOutput('S3Service.RemoveShortcut Started');
        this.treeDataProvider.RemoveShortcut(node.Bucket, node.Shortcut);
    }

    async AddShortcut(node: S3TreeItem) {
        if (!node || !node.Bucket) { return; }
        Telemetry.Current?.send("S3Service.AddShortcut");
        ui.logToOutput('S3Service.AddShortcut Started');
        let shortcut = await vscode.window.showInputBox({ placeHolder: 'Enter a Folder/File Key' });
        if (shortcut === undefined) { return; }
        this.treeDataProvider.AddShortcut(node.Bucket, shortcut);
    }

    async CopyShortcut(node: S3TreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.S3Shortcut || !node.Shortcut) { return; }
        ui.logToOutput('S3Service.CopyShortcut Started');
        vscode.env.clipboard.writeText(node.Shortcut);
    }

    ShowS3Explorer(node: S3TreeItem) {
        if (!node) return;
        Telemetry.Current?.send("S3Service.ShowS3Explorer");
        S3Explorer.Render(this.context.extensionUri, node);
    }

    ShowS3Search(node: S3TreeItem) {
        if (!node) return;
        Telemetry.Current?.send("S3Service.ShowS3Search");
        S3Search.Render(this.context.extensionUri, node);
    }

    async AddOrRemoveShortcut(Bucket: string, Key: string) {
        if (!Bucket || !Key) { return; }
        if (this.treeDataProvider.DoesShortcutExists(Bucket, Key)) {
            this.treeDataProvider.RemoveShortcut(Bucket, Key);
        } else {
            this.treeDataProvider.AddShortcut(Bucket, Key);
        }
    }

    async RemoveShortcutByKey(Bucket: string, Key: string) {
        if (!Bucket || !Key) { return; }
        if (this.treeDataProvider.DoesShortcutExists(Bucket, Key)) {
            this.treeDataProvider.RemoveShortcut(Bucket, Key);
        }
    }

    DoesShortcutExists(Bucket: string, Key: string | undefined): boolean {
        if (!Key) { return false; }
        return this.treeDataProvider.DoesShortcutExists(Bucket, Key);
    }
}
