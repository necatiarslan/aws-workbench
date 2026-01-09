"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const vscode = require("vscode");
const AbstractAwsService_1 = require("../AbstractAwsService");
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
class S3Service extends AbstractAwsService_1.AbstractAwsService {
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
        super();
        S3Service.Instance = this;
        this.context = context;
        // Load generic state (hidden/fav)
        this.loadBaseState();
        this.treeDataProvider = new S3TreeDataProvider_1.S3TreeDataProvider();
        this.LoadState(); // Load S3 specific state
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
        }), 
        // Deprecated/Legacy Commands - keeping them but delegating or removing from UI
        // The extension.ts registers generic commands that call methods on this service
        // We keep specific ones for backward compatibility if needed, or remove them from package.json menus
        vscode.commands.registerCommand('aws-workbench.s3.AddBucket', async () => {
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
        const items = buckets.map(b => this.mapToWorkbenchItem(b));
        // Apply generic filters
        return this.processNodes(items);
    }
    mapToWorkbenchItem(n) {
        const item = new WorkbenchTreeItem_1.WorkbenchTreeItem(typeof n.label === 'string' ? n.label : n.label?.label || '', n.collapsibleState || vscode.TreeItemCollapsibleState.None, this.serviceId, n.contextValue, n);
        // Ensure we have an ID for tracking
        if (!item.id && n.Bucket) {
            item.id = n.Bucket;
        }
        // Proxy properties from inner item to wrapper
        if (n.iconPath)
            item.iconPath = n.iconPath;
        if (n.description)
            item.description = n.description;
        if (n.tooltip)
            item.tooltip = n.tooltip;
        if (n.command)
            item.command = n.command;
        if (n.resourceUri)
            item.resourceUri = n.resourceUri;
        return item;
    }
    async getChildren(element) {
        if (!element) {
            return this.getRootNodes();
        }
        const internalItem = element.itemData;
        if (!internalItem)
            return [];
        const children = await this.treeDataProvider.getChildren(internalItem);
        const items = (children || []).map((child) => this.mapToWorkbenchItem(child));
        return this.processNodes(items);
    }
    async getTreeItem(element) {
        return element;
    }
    async addResource() {
        return await this.AddBucket();
    }
    // --- Helper to apply generic states (Hide/Fav) ---
    processNodes(nodes) {
        // 1. Filter hidden
        const visible = this.isShowHiddenNodes ? nodes : nodes.filter(n => !this.isHidden(n));
        // 2. Mark Favs and add tags
        visible.forEach(n => {
            if (this.isFav(n)) {
                n.contextValue = (n.contextValue || '') + '#Fav#';
            }
            else {
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
    showOnlyInProfile(node, profile) {
        // S3 logic updates the specific Bucket profile
        const s3Node = node.itemData;
        if (s3Node && s3Node.Bucket) {
            s3Node.ProfileToShow = profile;
            this.treeDataProvider.AddBucketProfile(s3Node.Bucket, profile);
            super.showOnlyInProfile(node, profile); // also save generic state if desired
            this.SaveState();
            this.Refresh();
        }
    }
    showInAnyProfile(node) {
        const s3Node = node.itemData;
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
    async Filter() {
        ui.logToOutput('S3Service.Filter Started');
        let filterStringTemp = await vscode.window.showInputBox({ value: this.FilterString, placeHolder: 'Enter Your Filter Text' });
        if (filterStringTemp === undefined) {
            return;
        }
        this.FilterString = filterStringTemp;
        this.SaveState();
    }
    // Deprecated methods that were previously used by direct commands.
    // We keep them if internal logic relies on them, but they are largely replaced by AbstractAwsService.
    async AddToFav(node) { super.addToFav(this.mapToWorkbenchItem(node)); }
    async DeleteFromFav(node) { super.deleteFromFav(this.mapToWorkbenchItem(node)); }
    async HideNode(node) { super.hideResource(this.mapToWorkbenchItem(node)); }
    async UnHideNode(node) { super.unhideResource(this.mapToWorkbenchItem(node)); }
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