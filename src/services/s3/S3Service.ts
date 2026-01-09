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
import { Telemetry } from './Telemetry';
import { Session } from './Session';
import { isLicenseValid, promptForLicense } from "./License";

export class S3Service extends AbstractAwsService {
    public static Instance: S3Service;
    public serviceId = 's3';
    public treeDataProvider: S3TreeDataProvider;
    public context: vscode.ExtensionContext;
    
    public FilterString: string = "";
    public isShowOnlyFavorite: boolean = false;
    public isShowHiddenNodes: boolean = false;
    public AwsProfile: string = "default";	
    public AwsEndPoint: string | undefined;
    public AwsRegion: string | undefined;

    constructor(context: vscode.ExtensionContext) {
        super();
        S3Service.Instance = this;
        this.context = context;
        // Load generic state (hidden/fav)
        this.loadBaseState();

        this.treeDataProvider = new S3TreeDataProvider();
        this.LoadState(); // Load S3 specific state
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
            vscode.commands.registerCommand('aws-workbench.s3.Filter', async () => {
                await this.Filter();
                treeProvider.refresh();
            }),
            // Deprecated/Legacy Commands - keeping them but delegating or removing from UI
            // The extension.ts registers generic commands that call methods on this service
            // We keep specific ones for backward compatibility if needed, or remove them from package.json menus
            
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
            }),
            vscode.commands.registerCommand('aws-workbench.s3.SelectAwsProfile', async (node: any) => {
                await this.SelectAwsProfile(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.s3.UpdateAwsEndPoint', async () => {
                await this.UpdateAwsEndPoint();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.s3.SetAwsRegion', async () => {
                await this.SetAwsRegion();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.s3.TestAwsConnection', () => {
                this.TestAwsConnection();
            }),
            vscode.commands.registerCommand('aws-workbench.s3.ActivatePro', () => {
                if (Session.Current?.IsProVersion) {
                    ui.showInfoMessage('You already have an active Pro license!');
                    return;
                }
                vscode.env.openExternal(vscode.Uri.parse('https://necatiarslan.lemonsqueezy.com/checkout/buy/dcdda46a-2137-44cc-a9d9-30dfc75070cf'));
            }),
            vscode.commands.registerCommand('aws-workbench.s3.EnterLicenseKey', async () => {
                if (Session.Current?.IsProVersion) {
                    ui.showInfoMessage('You already have an active Pro license!');
                    return;
                }
                await promptForLicense(this.context);
                if (Session.Current) {
                    Session.Current.IsProVersion = isLicenseValid();
                }
            })
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const buckets = await this.treeDataProvider.GetBucketNodes();
        const items = buckets.map(b => this.mapToWorkbenchItem(b));
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

    override async addResource(): Promise<WorkbenchTreeItem | undefined> {
        return await this.AddBucket();
    }

    // --- Helper to apply generic states (Hide/Fav) ---
    protected processNodes(nodes: WorkbenchTreeItem[]): WorkbenchTreeItem[] {
        // 1. Filter hidden
        const visible = this.isShowHiddenNodes ? nodes : nodes.filter(n => !this.isHidden(n));
        
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
        if (this.isShowOnlyFavorite) {
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
             this.SaveState();
             this.Refresh();
        }
    }

    public override showInAnyProfile(node: WorkbenchTreeItem) {
        const s3Node = node.itemData as S3TreeItem;
        if (s3Node && s3Node.Bucket) {
             s3Node.ProfileToShow = "";
             this.treeDataProvider.RemoveBucketProfile(s3Node.Bucket);
             super.showInAnyProfile(node);
             this.SaveState();
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

    async Filter() {
        ui.logToOutput('S3Service.Filter Started');
        let filterStringTemp = await vscode.window.showInputBox({ value: this.FilterString, placeHolder: 'Enter Your Filter Text' });
        if (filterStringTemp === undefined) { return; }
        this.FilterString = filterStringTemp;
        this.SaveState();
    }

    // Deprecated methods that were previously used by direct commands.
    // We keep them if internal logic relies on them, but they are largely replaced by AbstractAwsService.
    async AddToFav(node: S3TreeItem) { super.addToFav(this.mapToWorkbenchItem(node)); }
    async DeleteFromFav(node: S3TreeItem) { super.deleteFromFav(this.mapToWorkbenchItem(node)); }
    async HideNode(node: S3TreeItem) { super.hideResource(this.mapToWorkbenchItem(node)); }
    async UnHideNode(node: S3TreeItem) { super.unhideResource(this.mapToWorkbenchItem(node)); }
    
    // ... (Keep existing SaveState/LoadState but ensuring we don't conflict)
    
    SaveState() {
        ui.logToOutput('S3Service.saveState Started');
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('BucketList', this.treeDataProvider.GetBucketList());
            this.context.globalState.update('ShortcutList', this.treeDataProvider.GetShortcutList());
            this.context.globalState.update('ViewType', this.treeDataProvider.ViewType);
            this.context.globalState.update('AwsEndPoint', this.AwsEndPoint);
            this.context.globalState.update('AwsRegion', this.AwsRegion);
            this.context.globalState.update('BucketProfileList', this.treeDataProvider.BucketProfileList);
            
            // Also save base state
            this.saveBaseState();
        } catch (error) {
            ui.logToOutput("S3Service.saveState Error !!!");
        }
    }

    LoadState() {
        ui.logToOutput('S3Service.loadState Started');
        try {
            let AwsProfileTemp: string | undefined = this.context.globalState.get('AwsProfile');
            if (AwsProfileTemp) { this.AwsProfile = AwsProfileTemp; }
            let filterStringTemp: string | undefined = this.context.globalState.get('FilterString');
            if (filterStringTemp) { this.FilterString = filterStringTemp; }
            let ShowOnlyFavoriteTemp: boolean | undefined = this.context.globalState.get('ShowOnlyFavorite');
            if (ShowOnlyFavoriteTemp) { this.isShowOnlyFavorite = ShowOnlyFavoriteTemp; }
            let ShowHiddenNodesTemp: boolean | undefined = this.context.globalState.get('ShowHiddenNodes');
            if (ShowHiddenNodesTemp) { this.isShowHiddenNodes = ShowHiddenNodesTemp; }
            let BucketProfileListTemp: any[] | undefined = this.context.globalState.get('BucketProfileList');
            if (BucketProfileListTemp) { this.treeDataProvider.BucketProfileList = BucketProfileListTemp; }
            let BucketListTemp: string[] | undefined = this.context.globalState.get('BucketList');
            if (BucketListTemp) { this.treeDataProvider.SetBucketList(BucketListTemp); }
            let ShortcutListTemp: any[] | undefined = this.context.globalState.get('ShortcutList');
            if (ShortcutListTemp) { this.treeDataProvider.SetShortcutList(ShortcutListTemp); }
            let ViewTypeTemp: number | undefined = this.context.globalState.get('ViewType');
            if (ViewTypeTemp) { this.treeDataProvider.ViewType = ViewTypeTemp; }
            this.AwsEndPoint = this.context.globalState.get('AwsEndPoint');
            this.AwsRegion = this.context.globalState.get('AwsRegion');
        } catch (error) {
            ui.logToOutput("S3Service.loadState Error !!!");
        }
    }

    async AddBucket(): Promise<WorkbenchTreeItem | undefined> {
        Telemetry.Current?.send("S3Service.AddBucket");
        ui.logToOutput('S3Service.AddBucket Started');
        let selectedBucketName = await vscode.window.showInputBox({ placeHolder: 'Enter Bucket Name / Search Text' });
        if (selectedBucketName === undefined) { return; }
        var resultBucket = await api.GetBucketList(selectedBucketName);
        if (!resultBucket.isSuccessful) { return; }
        let selectedBucketList = await vscode.window.showQuickPick(resultBucket.result, { canPickMany: true, placeHolder: 'Select Bucket(s)' });
        if (!selectedBucketList || selectedBucketList.length === 0) { return; }
        
        let lastAddedItem: S3TreeItem | undefined;
        for (var selectedBucket of selectedBucketList) {
            lastAddedItem = this.treeDataProvider.AddBucket(selectedBucket);
        }
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }

    async RemoveBucket(node: S3TreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.S3Bucket || !node.Bucket) { return; }
        Telemetry.Current?.send("S3Service.RemoveBucket");
        ui.logToOutput('S3Service.RemoveBucket Started');
        this.treeDataProvider.RemoveBucket(node.Bucket);
        this.SaveState();
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
        this.SaveState();
    }

    async AddShortcut(node: S3TreeItem) {
        if (!node || !node.Bucket) { return; }
        Telemetry.Current?.send("S3Service.AddShortcut");
        ui.logToOutput('S3Service.AddShortcut Started');
        let shortcut = await vscode.window.showInputBox({ placeHolder: 'Enter a Folder/File Key' });
        if (shortcut === undefined) { return; }
        this.treeDataProvider.AddShortcut(node.Bucket, shortcut);
        this.SaveState();
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

    async SelectAwsProfile(node: S3TreeItem) {
        Telemetry.Current?.send("S3Service.SelectAwsProfile");
        var result = await api.GetAwsProfileList();
        if (!result.isSuccessful) { return; }
        let selectedAwsProfile = await vscode.window.showQuickPick(result.result, { canPickMany: false, placeHolder: 'Select Aws Profile' });
        if (!selectedAwsProfile) { return; }
        this.AwsProfile = selectedAwsProfile;
        this.SaveState();
        this.treeDataProvider.Refresh();
    }

    async UpdateAwsEndPoint() {
        Telemetry.Current?.send("S3Service.UpdateAwsEndPoint");
        let awsEndPointUrl = await vscode.window.showInputBox({ placeHolder: 'Enter Aws End Point URL (Leave Empty To Return To Default)', value: this.AwsEndPoint });
        if (awsEndPointUrl === undefined) { return; }
        this.AwsEndPoint = awsEndPointUrl.length === 0 ? undefined : awsEndPointUrl;
        this.SaveState();
        ui.showInfoMessage('Aws End Point Updated');
    }

    async SetAwsRegion() {
        Telemetry.Current?.send("S3Service.SetAwsRegion");
        let awsRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Aws Region (Leave Empty To Return To Default)' });
        if (awsRegion === undefined) { return; }
        this.AwsRegion = awsRegion.length === 0 ? undefined : awsRegion;
        this.SaveState();
    }

    async AddOrRemoveShortcut(Bucket: string, Key: string) {
        if (!Bucket || !Key) { return; }
        if (this.treeDataProvider.DoesShortcutExists(Bucket, Key)) {
            this.treeDataProvider.RemoveShortcut(Bucket, Key);
        } else {
            this.treeDataProvider.AddShortcut(Bucket, Key);
        }
        this.SaveState();
    }

    async RemoveShortcutByKey(Bucket: string, Key: string) {
        if (!Bucket || !Key) { return; }
        if (this.treeDataProvider.DoesShortcutExists(Bucket, Key)) {
            this.treeDataProvider.RemoveShortcut(Bucket, Key);
            this.SaveState();
        }
    }

    DoesShortcutExists(Bucket: string, Key: string | undefined): boolean {
        if (!Key) { return false; }
        return this.treeDataProvider.DoesShortcutExists(Bucket, Key);
    }
}
