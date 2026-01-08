import * as vscode from 'vscode';
import { IService } from '../IService';
import { S3TreeDataProvider } from './s3/S3TreeDataProvider';
import { S3TreeItem, TreeItemType } from './s3/S3TreeItem';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import * as ui from './common/UI';
import * as api from './common/API';
import { S3Explorer } from './s3/S3Explorer';
import { S3Search } from './s3/S3Search';
import { Telemetry } from './common/Telemetry';
import { Session } from './common/Session';
import { CommandHistoryView } from './common/CommandHistoryView';
import { ServiceAccessView } from './common/ServiceAccessView';
import { isLicenseValid, promptForLicense } from "./common/License";

export class S3Service implements IService {
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
        S3Service.Instance = this;
        this.context = context;
        this.treeDataProvider = new S3TreeDataProvider();
        this.LoadState();
        this.Refresh();
    }

    registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider, treeView: vscode.TreeView<WorkbenchTreeItem>): void {
        const wrap = (node: any) => {
            if (node instanceof WorkbenchTreeItem) {
                return node.itemData as S3TreeItem;
            }
            return node as S3TreeItem;
        };

        context.subscriptions.push(
            vscode.commands.registerCommand('S3TreeView.Refresh', () => {
                this.Refresh();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.Filter', async () => {
                await this.Filter();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.ShowOnlyFavorite', async () => {
                await this.ShowOnlyFavorite();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.ShowHiddenNodes', async () => {
                await this.ShowHiddenNodes();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.AddToFav', (node: any) => {
                this.AddToFav(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.DeleteFromFav', (node: any) => {
                this.DeleteFromFav(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.HideNode', (node: any) => {
                this.HideNode(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.UnHideNode', (node: any) => {
                this.UnHideNode(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.ShowOnlyInThisProfile', (node: any) => {
                this.ShowOnlyInThisProfile(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.ShowInAnyProfile', (node: any) => {
                this.ShowInAnyProfile(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.AddBucket', async () => {
                await this.AddBucket();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.RemoveBucket', async (node: any) => {
                await this.RemoveBucket(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.Goto', async (node: any) => {
                await this.Goto(wrap(node));
            }),
            vscode.commands.registerCommand('S3TreeView.RemoveShortcut', async (node: any) => {
                await this.RemoveShortcut(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.AddShortcut', async (node: any) => {
                await this.AddShortcut(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.CopyShortcut', async (node: any) => {
                await this.CopyShortcut(wrap(node));
            }),
            vscode.commands.registerCommand('S3TreeView.ShowS3Explorer', (node: any) => {
                this.ShowS3Explorer(wrap(node));
            }),
            vscode.commands.registerCommand('S3TreeView.ShowS3Search', (node: any) => {
                this.ShowS3Search(wrap(node));
            }),
            vscode.commands.registerCommand('S3TreeView.SelectAwsProfile', async (node: any) => {
                await this.SelectAwsProfile(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.UpdateAwsEndPoint', async () => {
                await this.UpdateAwsEndPoint();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.SetAwsRegion', async () => {
                await this.SetAwsRegion();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.TestAwsConnection', () => {
                this.TestAwsConnection();
            }),
            vscode.commands.registerCommand('S3TreeView.ShowCommandHistory', () => {
                if (Session.Current) {
                    CommandHistoryView.Render(Session.Current.ExtensionUri);
                }
            }),
            vscode.commands.registerCommand('S3TreeView.OpenServiceAccessView', () => {
                if (Session.Current) {
                    ServiceAccessView.Render(Session.Current.ExtensionUri);
                }
            }),
            vscode.commands.registerCommand('S3TreeView.ActivatePro', () => {
                if (Session.Current?.IsProVersion) {
                    ui.showInfoMessage('You already have an active Pro license!');
                    return;
                }
                vscode.env.openExternal(vscode.Uri.parse('https://necatiarslan.lemonsqueezy.com/checkout/buy/dcdda46a-2137-44cc-a9d9-30dfc75070cf'));
            }),
            vscode.commands.registerCommand('S3TreeView.EnterLicenseKey', async () => {
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
        return buckets.map(b => this.mapToWorkbenchItem(b));
    }

    public mapToWorkbenchItem(n: any): WorkbenchTreeItem {
        return new WorkbenchTreeItem(
            typeof n.label === 'string' ? n.label : (n.label as any)?.label || '',
            n.collapsibleState || vscode.TreeItemCollapsibleState.None,
            this.serviceId,
            n.contextValue,
            n
        );
    }

    async getChildren(element?: WorkbenchTreeItem): Promise<WorkbenchTreeItem[]> {
        if (!element) {
            return this.getRootNodes();
        }

        const internalItem = element.itemData;
        if (!internalItem) return [];

        const children = await this.treeDataProvider.getChildren(internalItem);
        return (children || []).map((child: any) => this.mapToWorkbenchItem(child));
    }

    async getTreeItem(element: WorkbenchTreeItem): Promise<vscode.TreeItem> {
        return element.itemData as vscode.TreeItem;
    }

    async addResource(): Promise<WorkbenchTreeItem | undefined> {
        return await this.AddBucket();
    }

    // Logic moved from S3TreeView

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

    async AddToFav(node: S3TreeItem) {
        if (!node) return;
        ui.logToOutput('S3Service.AddToFav Started');
        node.IsFav = true;
        this.treeDataProvider.Refresh();
    }

    async HideNode(node: S3TreeItem) {
        if (!node) return;
        ui.logToOutput('S3Service.HideNode Started');
        node.IsHidden = true;
        this.treeDataProvider.Refresh();
    }

    async UnHideNode(node: S3TreeItem) {
        if (!node) return;
        ui.logToOutput('S3Service.UnHideNode Started');
        node.IsHidden = false;
        this.treeDataProvider.Refresh();
    }

    async ShowOnlyInThisProfile(node: S3TreeItem) {
        ui.logToOutput('S3Service.ShowOnlyInThisProfile Started');
        if (!node || node.TreeItemType !== TreeItemType.Bucket) { return; }
        if (!node.Bucket) { return; }
        if (this.AwsProfile) {
            node.ProfileToShow = this.AwsProfile;
            this.treeDataProvider.AddBucketProfile(node.Bucket, node.ProfileToShow);
            this.treeDataProvider.Refresh();
            this.SaveState();
        }
    }

    async ShowInAnyProfile(node: S3TreeItem) {
        ui.logToOutput('S3Service.ShowInAnyProfile Started');
        if (!node || node.TreeItemType !== TreeItemType.Bucket) { return; }
        if (!node.Bucket) { return; }
        node.ProfileToShow = "";
        this.treeDataProvider.RemoveBucketProfile(node.Bucket);
        this.treeDataProvider.Refresh();
        this.SaveState();
    }

    async DeleteFromFav(node: S3TreeItem) {
        if (!node) return;
        ui.logToOutput('S3Service.DeleteFromFav Started');
        node.IsFav = false;
        this.treeDataProvider.Refresh();
    }

    async Filter() {
        ui.logToOutput('S3Service.Filter Started');
        let filterStringTemp = await vscode.window.showInputBox({ value: this.FilterString, placeHolder: 'Enter Your Filter Text' });
        if (filterStringTemp === undefined) { return; }
        this.FilterString = filterStringTemp;
        this.treeDataProvider.Refresh();
        this.SaveState();
    }

    async ShowOnlyFavorite() {
        ui.logToOutput('S3Service.ShowOnlyFavorite Started');
        this.isShowOnlyFavorite = !this.isShowOnlyFavorite;
        this.treeDataProvider.Refresh();
        this.SaveState();
    }

    async ShowHiddenNodes() {
        ui.logToOutput('S3Service.ShowHiddenNodes Started');
        this.isShowHiddenNodes = !this.isShowHiddenNodes;
        this.treeDataProvider.Refresh();
        this.SaveState();
    }

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
        if (!node || node.TreeItemType !== TreeItemType.Bucket || !node.Bucket) { return; }
        Telemetry.Current?.send("S3Service.RemoveBucket");
        ui.logToOutput('S3Service.RemoveBucket Started');
        this.treeDataProvider.RemoveBucket(node.Bucket);
        this.SaveState();
    }

    async Goto(node: S3TreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.Bucket || !node.Bucket) { return; }
        ui.logToOutput('S3Service.Goto Started');
        let shortcut = await vscode.window.showInputBox({ placeHolder: 'Enter a Folder/File Key' });
        if (shortcut === undefined) { return; }
        S3Explorer.Render(this.context.extensionUri, node, shortcut);
    }

    async RemoveShortcut(node: S3TreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.Shortcut || !node.Bucket || !node.Shortcut) { return; }
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
        if (!node || node.TreeItemType !== TreeItemType.Shortcut || !node.Shortcut) { return; }
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
