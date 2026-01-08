"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const vscode = require("vscode");
const S3TreeDataProvider_1 = require("./S3TreeDataProvider");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const ui = require("../../common/UI");
const api = require("./API");
const S3Explorer_1 = require("./S3Explorer");
const S3Search_1 = require("./S3Search");
const Telemetry_1 = require("./Telemetry");
const Session_1 = require("./Session");
const License_1 = require("./License");
class S3Service {
    static Instance;
    serviceId = 's3';
    treeDataProvider;
    context;
    FilterString = "";
    isShowOnlyFavorite = false;
    isShowHiddenNodes = false;
    AwsProfile = "default";
    AwsEndPoint;
    AwsRegion;
    constructor(context) {
        S3Service.Instance = this;
        this.context = context;
        this.treeDataProvider = new S3TreeDataProvider_1.S3TreeDataProvider();
        this.LoadState();
        this.Refresh();
    }
    registerCommands(context, treeProvider, treeView) {
        const wrap = (node) => {
            if (node instanceof WorkbenchTreeItem_1.WorkbenchTreeItem) {
                return node.itemData;
            }
            return node;
        };
        context.subscriptions.push(vscode.commands.registerCommand('aws-workbench.s3.Refresh', () => {
            this.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.Filter', async () => {
            await this.Filter();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.ShowOnlyFavorite', async () => {
            await this.ShowOnlyFavorite();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.ShowHiddenNodes', async () => {
            await this.ShowHiddenNodes();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.AddToFav', (node) => {
            this.AddToFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.DeleteFromFav', (node) => {
            this.DeleteFromFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.HideNode', (node) => {
            this.HideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.UnHideNode', (node) => {
            this.UnHideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.ShowOnlyInThisProfile', (node) => {
            this.ShowOnlyInThisProfile(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.ShowInAnyProfile', (node) => {
            this.ShowInAnyProfile(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.AddBucket', async () => {
            await this.AddBucket();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.RemoveBucket', async (node) => {
            await this.RemoveBucket(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.Goto', async (node) => {
            await this.Goto(wrap(node));
        }), vscode.commands.registerCommand('aws-workbench.s3.RemoveShortcut', async (node) => {
            await this.RemoveShortcut(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.AddShortcut', async (node) => {
            await this.AddShortcut(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.CopyShortcut', async (node) => {
            await this.CopyShortcut(wrap(node));
        }), vscode.commands.registerCommand('aws-workbench.s3.ShowS3Explorer', (node) => {
            this.ShowS3Explorer(wrap(node));
        }), vscode.commands.registerCommand('aws-workbench.s3.ShowS3Search', (node) => {
            this.ShowS3Search(wrap(node));
        }), vscode.commands.registerCommand('aws-workbench.s3.SelectAwsProfile', async (node) => {
            await this.SelectAwsProfile(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.UpdateAwsEndPoint', async () => {
            await this.UpdateAwsEndPoint();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.SetAwsRegion', async () => {
            await this.SetAwsRegion();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.s3.TestAwsConnection', () => {
            this.TestAwsConnection();
        }), vscode.commands.registerCommand('aws-workbench.s3.ActivatePro', () => {
            if (Session_1.Session.Current?.IsProVersion) {
                ui.showInfoMessage('You already have an active Pro license!');
                return;
            }
            vscode.env.openExternal(vscode.Uri.parse('https://necatiarslan.lemonsqueezy.com/checkout/buy/dcdda46a-2137-44cc-a9d9-30dfc75070cf'));
        }), vscode.commands.registerCommand('aws-workbench.s3.EnterLicenseKey', async () => {
            if (Session_1.Session.Current?.IsProVersion) {
                ui.showInfoMessage('You already have an active Pro license!');
                return;
            }
            await (0, License_1.promptForLicense)(this.context);
            if (Session_1.Session.Current) {
                Session_1.Session.Current.IsProVersion = (0, License_1.isLicenseValid)();
            }
        }));
    }
    async getRootNodes() {
        const buckets = await this.treeDataProvider.GetBucketNodes();
        return buckets.map(b => this.mapToWorkbenchItem(b));
    }
    mapToWorkbenchItem(n) {
        return new WorkbenchTreeItem_1.WorkbenchTreeItem(typeof n.label === 'string' ? n.label : n.label?.label || '', n.collapsibleState || vscode.TreeItemCollapsibleState.None, this.serviceId, n.contextValue, n);
    }
    async getChildren(element) {
        if (!element) {
            return this.getRootNodes();
        }
        const internalItem = element.itemData;
        if (!internalItem)
            return [];
        const children = await this.treeDataProvider.getChildren(internalItem);
        return (children || []).map((child) => this.mapToWorkbenchItem(child));
    }
    async getTreeItem(element) {
        return element.itemData;
    }
    async addResource() {
        return await this.AddBucket();
    }
    // Logic moved from aws-workbench.s3
    async TestAwsConnection() {
        let response = await api.TestAwsCredentials();
        if (response.isSuccessful && response.result) {
            ui.logToOutput('Aws Credentials Found, Test Successfull');
            ui.showInfoMessage('Aws Credentials Found, Test Successfull');
        }
        else {
            ui.logToOutput('S3Service.TestAwsConnection Error !!!', response.error);
            ui.showErrorMessage('Aws Credentials Can Not Be Found !!!', response.error);
        }
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        response = await api.TestAwsConnection(selectedRegion);
        if (response.isSuccessful && response.result) {
            ui.logToOutput('Aws Connection Test Successfull');
            ui.showInfoMessage('Aws Connection Test Successfull');
        }
        else {
            ui.logToOutput('S3Service.TestAwsConnection Error !!!', response.error);
            ui.showErrorMessage('Aws Connection Test Error !!!', response.error);
        }
    }
    Refresh() {
        ui.logToOutput('S3Service.refresh Started');
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: "Aws S3: Loading...",
        }, (progress, token) => {
            progress.report({ increment: 0 });
            return new Promise(resolve => { resolve(); });
        });
    }
    async AddToFav(node) {
        if (!node)
            return;
        ui.logToOutput('S3Service.AddToFav Started');
        node.IsFav = true;
        this.treeDataProvider.Refresh();
    }
    async HideNode(node) {
        if (!node)
            return;
        ui.logToOutput('S3Service.HideNode Started');
        node.IsHidden = true;
        this.treeDataProvider.Refresh();
    }
    async UnHideNode(node) {
        if (!node)
            return;
        ui.logToOutput('S3Service.UnHideNode Started');
        node.IsHidden = false;
        this.treeDataProvider.Refresh();
    }
    async ShowOnlyInThisProfile(node) {
        ui.logToOutput('S3Service.ShowOnlyInThisProfile Started');
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.S3Bucket) {
            return;
        }
        if (!node.Bucket) {
            return;
        }
        if (this.AwsProfile) {
            node.ProfileToShow = this.AwsProfile;
            this.treeDataProvider.AddBucketProfile(node.Bucket, node.ProfileToShow);
            this.treeDataProvider.Refresh();
            this.SaveState();
        }
    }
    async ShowInAnyProfile(node) {
        ui.logToOutput('S3Service.ShowInAnyProfile Started');
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.S3Bucket) {
            return;
        }
        if (!node.Bucket) {
            return;
        }
        node.ProfileToShow = "";
        this.treeDataProvider.RemoveBucketProfile(node.Bucket);
        this.treeDataProvider.Refresh();
        this.SaveState();
    }
    async DeleteFromFav(node) {
        if (!node)
            return;
        ui.logToOutput('S3Service.DeleteFromFav Started');
        node.IsFav = false;
        this.treeDataProvider.Refresh();
    }
    async Filter() {
        ui.logToOutput('S3Service.Filter Started');
        let filterStringTemp = await vscode.window.showInputBox({ value: this.FilterString, placeHolder: 'Enter Your Filter Text' });
        if (filterStringTemp === undefined) {
            return;
        }
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
        }
        catch (error) {
            ui.logToOutput("S3Service.saveState Error !!!");
        }
    }
    LoadState() {
        ui.logToOutput('S3Service.loadState Started');
        try {
            let AwsProfileTemp = this.context.globalState.get('AwsProfile');
            if (AwsProfileTemp) {
                this.AwsProfile = AwsProfileTemp;
            }
            let filterStringTemp = this.context.globalState.get('FilterString');
            if (filterStringTemp) {
                this.FilterString = filterStringTemp;
            }
            let ShowOnlyFavoriteTemp = this.context.globalState.get('ShowOnlyFavorite');
            if (ShowOnlyFavoriteTemp) {
                this.isShowOnlyFavorite = ShowOnlyFavoriteTemp;
            }
            let ShowHiddenNodesTemp = this.context.globalState.get('ShowHiddenNodes');
            if (ShowHiddenNodesTemp) {
                this.isShowHiddenNodes = ShowHiddenNodesTemp;
            }
            let BucketProfileListTemp = this.context.globalState.get('BucketProfileList');
            if (BucketProfileListTemp) {
                this.treeDataProvider.BucketProfileList = BucketProfileListTemp;
            }
            let BucketListTemp = this.context.globalState.get('BucketList');
            if (BucketListTemp) {
                this.treeDataProvider.SetBucketList(BucketListTemp);
            }
            let ShortcutListTemp = this.context.globalState.get('ShortcutList');
            if (ShortcutListTemp) {
                this.treeDataProvider.SetShortcutList(ShortcutListTemp);
            }
            let ViewTypeTemp = this.context.globalState.get('ViewType');
            if (ViewTypeTemp) {
                this.treeDataProvider.ViewType = ViewTypeTemp;
            }
            this.AwsEndPoint = this.context.globalState.get('AwsEndPoint');
            this.AwsRegion = this.context.globalState.get('AwsRegion');
        }
        catch (error) {
            ui.logToOutput("S3Service.loadState Error !!!");
        }
    }
    async AddBucket() {
        Telemetry_1.Telemetry.Current?.send("S3Service.AddBucket");
        ui.logToOutput('S3Service.AddBucket Started');
        let selectedBucketName = await vscode.window.showInputBox({ placeHolder: 'Enter Bucket Name / Search Text' });
        if (selectedBucketName === undefined) {
            return;
        }
        var resultBucket = await api.GetBucketList(selectedBucketName);
        if (!resultBucket.isSuccessful) {
            return;
        }
        let selectedBucketList = await vscode.window.showQuickPick(resultBucket.result, { canPickMany: true, placeHolder: 'Select Bucket(s)' });
        if (!selectedBucketList || selectedBucketList.length === 0) {
            return;
        }
        let lastAddedItem;
        for (var selectedBucket of selectedBucketList) {
            lastAddedItem = this.treeDataProvider.AddBucket(selectedBucket);
        }
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }
    async RemoveBucket(node) {
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.S3Bucket || !node.Bucket) {
            return;
        }
        Telemetry_1.Telemetry.Current?.send("S3Service.RemoveBucket");
        ui.logToOutput('S3Service.RemoveBucket Started');
        this.treeDataProvider.RemoveBucket(node.Bucket);
        this.SaveState();
    }
    async Goto(node) {
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.S3Bucket || !node.Bucket) {
            return;
        }
        ui.logToOutput('S3Service.Goto Started');
        let shortcut = await vscode.window.showInputBox({ placeHolder: 'Enter a Folder/File Key' });
        if (shortcut === undefined) {
            return;
        }
        S3Explorer_1.S3Explorer.Render(this.context.extensionUri, node, shortcut);
    }
    async RemoveShortcut(node) {
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.S3Shortcut || !node.Bucket || !node.Shortcut) {
            return;
        }
        Telemetry_1.Telemetry.Current?.send("S3Service.RemoveShortcut");
        ui.logToOutput('S3Service.RemoveShortcut Started');
        this.treeDataProvider.RemoveShortcut(node.Bucket, node.Shortcut);
        this.SaveState();
    }
    async AddShortcut(node) {
        if (!node || !node.Bucket) {
            return;
        }
        Telemetry_1.Telemetry.Current?.send("S3Service.AddShortcut");
        ui.logToOutput('S3Service.AddShortcut Started');
        let shortcut = await vscode.window.showInputBox({ placeHolder: 'Enter a Folder/File Key' });
        if (shortcut === undefined) {
            return;
        }
        this.treeDataProvider.AddShortcut(node.Bucket, shortcut);
        this.SaveState();
    }
    async CopyShortcut(node) {
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.S3Shortcut || !node.Shortcut) {
            return;
        }
        ui.logToOutput('S3Service.CopyShortcut Started');
        vscode.env.clipboard.writeText(node.Shortcut);
    }
    ShowS3Explorer(node) {
        if (!node)
            return;
        Telemetry_1.Telemetry.Current?.send("S3Service.ShowS3Explorer");
        S3Explorer_1.S3Explorer.Render(this.context.extensionUri, node);
    }
    ShowS3Search(node) {
        if (!node)
            return;
        Telemetry_1.Telemetry.Current?.send("S3Service.ShowS3Search");
        S3Search_1.S3Search.Render(this.context.extensionUri, node);
    }
    async SelectAwsProfile(node) {
        Telemetry_1.Telemetry.Current?.send("S3Service.SelectAwsProfile");
        var result = await api.GetAwsProfileList();
        if (!result.isSuccessful) {
            return;
        }
        let selectedAwsProfile = await vscode.window.showQuickPick(result.result, { canPickMany: false, placeHolder: 'Select Aws Profile' });
        if (!selectedAwsProfile) {
            return;
        }
        this.AwsProfile = selectedAwsProfile;
        this.SaveState();
        this.treeDataProvider.Refresh();
    }
    async UpdateAwsEndPoint() {
        Telemetry_1.Telemetry.Current?.send("S3Service.UpdateAwsEndPoint");
        let awsEndPointUrl = await vscode.window.showInputBox({ placeHolder: 'Enter Aws End Point URL (Leave Empty To Return To Default)', value: this.AwsEndPoint });
        if (awsEndPointUrl === undefined) {
            return;
        }
        this.AwsEndPoint = awsEndPointUrl.length === 0 ? undefined : awsEndPointUrl;
        this.SaveState();
        ui.showInfoMessage('Aws End Point Updated');
    }
    async SetAwsRegion() {
        Telemetry_1.Telemetry.Current?.send("S3Service.SetAwsRegion");
        let awsRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Aws Region (Leave Empty To Return To Default)' });
        if (awsRegion === undefined) {
            return;
        }
        this.AwsRegion = awsRegion.length === 0 ? undefined : awsRegion;
        this.SaveState();
    }
    async AddOrRemoveShortcut(Bucket, Key) {
        if (!Bucket || !Key) {
            return;
        }
        if (this.treeDataProvider.DoesShortcutExists(Bucket, Key)) {
            this.treeDataProvider.RemoveShortcut(Bucket, Key);
        }
        else {
            this.treeDataProvider.AddShortcut(Bucket, Key);
        }
        this.SaveState();
    }
    async RemoveShortcutByKey(Bucket, Key) {
        if (!Bucket || !Key) {
            return;
        }
        if (this.treeDataProvider.DoesShortcutExists(Bucket, Key)) {
            this.treeDataProvider.RemoveShortcut(Bucket, Key);
            this.SaveState();
        }
    }
    DoesShortcutExists(Bucket, Key) {
        if (!Key) {
            return false;
        }
        return this.treeDataProvider.DoesShortcutExists(Bucket, Key);
    }
}
exports.S3Service = S3Service;
//# sourceMappingURL=S3Service.js.map