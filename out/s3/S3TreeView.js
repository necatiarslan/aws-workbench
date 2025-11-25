"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3TreeView = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const S3TreeItem_1 = require("./S3TreeItem");
const S3TreeDataProvider_1 = require("./S3TreeDataProvider");
const ui = require("../common/UI");
const api = require("../common/API");
const ConfigManager_1 = require("../common/ConfigManager");
const S3Explorer_1 = require("./S3Explorer");
const S3Search_1 = require("./S3Search");
class S3TreeView {
    static Current;
    view;
    treeDataProvider;
    context;
    FilterString = "";
    isShowOnlyFavorite = false;
    isShowHiddenNodes = false;
    AwsProfile = "default";
    AwsEndPoint;
    AwsRegion;
    IsSharedIniFileCredentials = false;
    CredentialProviderName;
    constructor(context) {
        ui.logToOutput('TreeView.constructor Started');
        S3TreeView.Current = this;
        this.context = context;
        this.treeDataProvider = new S3TreeDataProvider_1.S3TreeDataProvider();
        this.LoadState();
        this.view = vscode.window.createTreeView('S3TreeView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
        this.Refresh();
        context.subscriptions.push(this.view);
        this.SetFilterMessage();
    }
    async TestAwsConnection() {
        let response = await api.TestAwsCredentials();
        if (response.isSuccessful && response.result) {
            ui.logToOutput('Aws Credentials Found, Test Successfull');
            ui.showInfoMessage('Aws Credentials Found, Test Successfull');
        }
        else {
            ui.logToOutput('S3TreeView.TestAwsConnection Error !!!', response.error);
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
            ui.logToOutput('S3TreeView.TestAwsConnection Error !!!', response.error);
            ui.showErrorMessage('Aws Connection Test Error !!!', response.error);
        }
    }
    Refresh() {
        ui.logToOutput('S3TreeView.refresh Started');
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: "Aws S3: Loading...",
        }, (progress, token) => {
            progress.report({ increment: 0 });
            this.LoadTreeItems();
            return new Promise(resolve => { resolve(); });
        });
    }
    LoadTreeItems() {
        ui.logToOutput('S3TreeView.loadTreeItems Started');
        //this.treeDataProvider.LoadRegionNodeList();
        //this.treeDataProvider.LoadLogGroupNodeList();
        //this.treeDataProvider.LoadLogStreamNodeList();
        //this.treeDataProvider.Refresh();
        this.SetViewTitle();
    }
    ResetView() {
        ui.logToOutput('S3TreeView.resetView Started');
        this.FilterString = '';
        this.treeDataProvider.Refresh();
        this.SetViewTitle();
        this.SaveState();
        this.Refresh();
    }
    async AddToFav(node) {
        ui.logToOutput('S3TreeView.AddToFav Started');
        node.IsFav = true;
        this.treeDataProvider.Refresh();
    }
    async HideNode(node) {
        ui.logToOutput('S3TreeView.HideNode Started');
        node.IsHidden = true;
        this.treeDataProvider.Refresh();
    }
    async UnHideNode(node) {
        ui.logToOutput('S3TreeView.UnHideNode Started');
        node.IsHidden = false;
        this.treeDataProvider.Refresh();
    }
    async ShowOnlyInThisProfile(node) {
        ui.logToOutput('S3TreeView.ShowOnlyInThisProfile Started');
        if (node.TreeItemType !== S3TreeItem_1.TreeItemType.Bucket) {
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
        ui.logToOutput('S3TreeView.ShowInAnyProfile Started');
        if (node.TreeItemType !== S3TreeItem_1.TreeItemType.Bucket) {
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
        ui.logToOutput('S3TreeView.DeleteFromFav Started');
        node.IsFav = false;
        this.treeDataProvider.Refresh();
    }
    async Filter() {
        ui.logToOutput('S3TreeView.Filter Started');
        let filterStringTemp = await vscode.window.showInputBox({ value: this.FilterString, placeHolder: 'Enter Your Filter Text' });
        if (filterStringTemp === undefined) {
            return;
        }
        this.FilterString = filterStringTemp;
        this.treeDataProvider.Refresh();
        this.SetFilterMessage();
        this.SaveState();
    }
    async ShowOnlyFavorite() {
        ui.logToOutput('S3TreeView.ShowOnlyFavorite Started');
        this.isShowOnlyFavorite = !this.isShowOnlyFavorite;
        this.treeDataProvider.Refresh();
        this.SetFilterMessage();
        this.SaveState();
    }
    async ShowHiddenNodes() {
        ui.logToOutput('S3TreeView.ShowHiddenNodes Started');
        this.isShowHiddenNodes = !this.isShowHiddenNodes;
        this.treeDataProvider.Refresh();
        this.SetFilterMessage();
        this.SaveState();
    }
    async SetViewTitle() {
        this.view.title = "";
    }
    SaveState() {
        ui.logToOutput('S3TreeView.saveState Started');
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
            ui.logToOutput("S3TreeView.saveState Successfull");
        }
        catch (error) {
            ui.logToOutput("S3TreeView.saveState Error !!!");
        }
    }
    LoadState() {
        ui.logToOutput('S3TreeView.loadState Started');
        try {
            // First, try to load from YAML config file
            const yamlConfig = ConfigManager_1.ConfigManager.loadConfig();
            if (yamlConfig) {
                ui.logToOutput('S3TreeView: Loading from YAML config file');
                if (yamlConfig.Tree && yamlConfig.Tree.length > 0) {
                    // Load from hierarchical structure
                    this.treeDataProvider.LoadFromTreeStructure(yamlConfig.Tree);
                    ui.logToOutput(`S3TreeView: Loaded tree structure from YAML config`);
                }
                else {
                    // Backward compatibility: Load from flat lists
                    if (yamlConfig.BucketList && Array.isArray(yamlConfig.BucketList)) {
                        this.treeDataProvider.SetBucketList(yamlConfig.BucketList);
                        ui.logToOutput(`S3TreeView: Loaded ${yamlConfig.BucketList.length} buckets from YAML config`);
                    }
                    // Load shortcut list from YAML
                    if (yamlConfig.ShortcutList && Array.isArray(yamlConfig.ShortcutList)) {
                        this.treeDataProvider.SetShortcutList(yamlConfig.ShortcutList);
                        ui.logToOutput(`S3TreeView: Loaded ${yamlConfig.ShortcutList.length} shortcuts from YAML config`);
                    }
                }
            }
            else {
                ui.logToOutput('S3TreeView: No YAML config found, loading from VSCode state');
            }
            // Load remaining state from VSCode globalState (these are not in YAML)
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
            // Only load from VSCode state if YAML config didn't provide these
            if (!yamlConfig) {
                let BucketListTemp = this.context.globalState.get('BucketList');
                if (BucketListTemp) {
                    this.treeDataProvider.SetBucketList(BucketListTemp);
                }
                let ShortcutListTemp;
                //TODO: Remove this legacy code after 1 year
                try {
                    let legacyShortcutListTemp;
                    legacyShortcutListTemp = this.context.globalState.get('ShortcutList');
                    if (legacyShortcutListTemp && Array.isArray(legacyShortcutListTemp) && legacyShortcutListTemp[0] && Array.isArray(legacyShortcutListTemp[0])) {
                        ShortcutListTemp = [];
                        for (let i = 0; i < legacyShortcutListTemp.length; i++) {
                            ShortcutListTemp.push({ Bucket: legacyShortcutListTemp[i][0], Shortcut: legacyShortcutListTemp[i][1] });
                        }
                    }
                }
                catch { }
                if (!ShortcutListTemp) {
                    ShortcutListTemp = this.context.globalState.get('ShortcutList');
                }
                if (ShortcutListTemp) {
                    this.treeDataProvider.SetShortcutList(ShortcutListTemp);
                }
            }
            let ViewTypeTemp = this.context.globalState.get('ViewType');
            if (ViewTypeTemp) {
                this.treeDataProvider.ViewType = ViewTypeTemp;
            }
            let AwsEndPointTemp = this.context.globalState.get('AwsEndPoint');
            this.AwsEndPoint = AwsEndPointTemp;
            let AwsRegionTemp = this.context.globalState.get('AwsRegion');
            this.AwsRegion = AwsRegionTemp;
            ui.logToOutput("S3TreeView.loadState Successfull");
        }
        catch (error) {
            ui.logToOutput("S3TreeView.loadState Error !!!");
        }
    }
    async SetFilterMessage() {
        if (this.treeDataProvider.BucketList.length > 0) {
            this.view.message =
                await this.GetFilterProfilePrompt()
                    + this.GetBoolenSign(this.isShowOnlyFavorite) + "Fav, "
                    + this.GetBoolenSign(this.isShowHiddenNodes) + "Hidden, "
                    + this.FilterString;
        }
        else {
            this.view.message = undefined;
        }
    }
    async GetFilterProfilePrompt() {
        return "Profile:" + this.AwsProfile + " ";
    }
    GetBoolenSign(variable) {
        return variable ? "✓" : "𐄂";
    }
    async AddResource(parentNode) {
        ui.logToOutput('S3TreeView.AddResource Started');
        // Import resource type options
        const { RESOURCE_TYPE_OPTIONS } = await Promise.resolve().then(() => require('./S3TreeItem'));
        // Show resource type selection
        const selectedType = await vscode.window.showQuickPick(RESOURCE_TYPE_OPTIONS.map(opt => ({
            label: `$(${opt.icon}) ${opt.label}`,
            description: opt.description,
            type: opt.type
        })), {
            placeHolder: 'Select resource type to add'
        });
        if (!selectedType) {
            return;
        }
        // Route to appropriate handler based on type
        switch (selectedType.type) {
            case (await Promise.resolve().then(() => require('./S3TreeItem'))).TreeItemType.Folder:
                await this.AddFolder(parentNode);
                break;
            case (await Promise.resolve().then(() => require('./S3TreeItem'))).TreeItemType.Bucket:
                await this.AddS3Bucket(parentNode);
                break;
            case (await Promise.resolve().then(() => require('./S3TreeItem'))).TreeItemType.LambdaFunction:
                await this.AddLambdaFunction(parentNode);
                break;
            case (await Promise.resolve().then(() => require('./S3TreeItem'))).TreeItemType.CloudWatchLogGroup:
                await this.AddCloudWatchLogGroup(parentNode);
                break;
            case (await Promise.resolve().then(() => require('./S3TreeItem'))).TreeItemType.SNSTopic:
                await this.AddSNSTopic(parentNode);
                break;
            case (await Promise.resolve().then(() => require('./S3TreeItem'))).TreeItemType.DynamoDBTable:
                await this.AddDynamoDBTable(parentNode);
                break;
            case (await Promise.resolve().then(() => require('./S3TreeItem'))).TreeItemType.SQSQueue:
                await this.AddSQSQueue(parentNode);
                break;
            case (await Promise.resolve().then(() => require('./S3TreeItem'))).TreeItemType.StepFunction:
                await this.AddStepFunction(parentNode);
                break;
            case (await Promise.resolve().then(() => require('./S3TreeItem'))).TreeItemType.IAMRole:
                await this.AddIAMRole(parentNode);
                break;
        }
    }
    async AddFolder(parentNode) {
        ui.logToOutput('S3TreeView.AddFolder Started');
        const folderName = await vscode.window.showInputBox({
            placeHolder: 'Enter folder name',
            prompt: 'Folder name for organizing resources'
        });
        if (!folderName) {
            return;
        }
        // Create folder path
        let folderPath = folderName;
        if (parentNode && parentNode.FolderPath) {
            folderPath = `${parentNode.FolderPath}/${folderName}`;
        }
        this.treeDataProvider.AddFolder(folderName, folderPath, parentNode);
        this.SaveState();
        ui.showInfoMessage(`Folder "${folderName}" created`);
    }
    async RenameFolder(node) {
        ui.logToOutput('S3TreeView.RenameFolder Started');
        const { TreeItemType } = await Promise.resolve().then(() => require('./S3TreeItem'));
        if (node.TreeItemType !== TreeItemType.Folder) {
            return;
        }
        const newName = await vscode.window.showInputBox({
            placeHolder: 'Enter new folder name',
            value: node.Text
        });
        if (!newName || newName === node.Text) {
            return;
        }
        this.treeDataProvider.RenameFolder(node, newName);
        this.SaveState();
        ui.showInfoMessage(`Folder renamed to "${newName}"`);
    }
    async RemoveFolder(node) {
        ui.logToOutput('S3TreeView.RemoveFolder Started');
        const { TreeItemType } = await Promise.resolve().then(() => require('./S3TreeItem'));
        if (node.TreeItemType !== TreeItemType.Folder) {
            return;
        }
        const hasChildren = node.Children && node.Children.length > 0;
        const message = hasChildren
            ? `Delete folder "${node.Text}" and all its contents?`
            : `Delete folder "${node.Text}"?`;
        const confirmed = await vscode.window.showWarningMessage(message, { modal: true }, 'Delete');
        if (confirmed !== 'Delete') {
            return;
        }
        this.treeDataProvider.RemoveFolder(node);
        this.SaveState();
        ui.showInfoMessage(`Folder "${node.Text}" deleted`);
    }
    // S3 Bucket handler (existing logic)
    async AddS3Bucket(parentNode) {
        ui.logToOutput('S3TreeView.AddS3Bucket Started');
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
        for (var selectedBucket of selectedBucketList) {
            this.treeDataProvider.AddBucket(selectedBucket, parentNode);
            this.SetFilterMessage();
        }
        this.SaveState();
    }
    // Keep old AddBucket for backward compatibility
    async AddBucket() {
        return this.AddS3Bucket();
    }
    // Resource type handlers (stubs for now - can be implemented later)
    async AddLambdaFunction(parentNode) {
        ui.showInfoMessage('Lambda Function support coming soon!');
        // TODO: Implement Lambda function addition
    }
    async AddCloudWatchLogGroup(parentNode) {
        ui.showInfoMessage('CloudWatch Log Group support coming soon!');
        // TODO: Implement CloudWatch log group addition
    }
    async AddSNSTopic(parentNode) {
        ui.showInfoMessage('SNS Topic support coming soon!');
        // TODO: Implement SNS topic addition
    }
    async AddDynamoDBTable(parentNode) {
        ui.showInfoMessage('DynamoDB Table support coming soon!');
        // TODO: Implement DynamoDB table addition
    }
    async AddSQSQueue(parentNode) {
        ui.showInfoMessage('SQS Queue support coming soon!');
        // TODO: Implement SQS queue addition
    }
    async AddStepFunction(parentNode) {
        ui.showInfoMessage('Step Function support coming soon!');
        // TODO: Implement Step Function addition
    }
    async AddIAMRole(parentNode) {
        ui.showInfoMessage('IAM Role support coming soon!');
        // TODO: Implement IAM role addition
    }
    async RemoveBucket(node) {
        ui.logToOutput('S3TreeView.RemoveBucket Started');
        if (node.TreeItemType !== S3TreeItem_1.TreeItemType.Bucket) {
            return;
        }
        if (!node.Bucket) {
            return;
        }
        this.treeDataProvider.RemoveBucket(node.Bucket);
        this.SetFilterMessage();
        this.SaveState();
    }
    async Goto(node) {
        ui.logToOutput('S3TreeView.Goto Started');
        if (node.TreeItemType !== S3TreeItem_1.TreeItemType.Bucket) {
            return;
        }
        if (!node.Bucket) {
            return;
        }
        let shortcut = await vscode.window.showInputBox({ placeHolder: 'Enter a Folder/File Key' });
        if (shortcut === undefined) {
            return;
        }
        S3Explorer_1.S3Explorer.Render(this.context.extensionUri, node, shortcut);
    }
    async AddOrRemoveShortcut(Bucket, Key) {
        ui.logToOutput('S3TreeView.AddOrRemoveShortcut Started');
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
        ui.logToOutput('S3TreeView.RemoveShortcutByKey Started');
        if (!Bucket || !Key) {
            return;
        }
        if (this.treeDataProvider.DoesShortcutExists(Bucket, Key)) {
            this.treeDataProvider.RemoveShortcut(Bucket, Key);
            this.SaveState();
        }
    }
    async UpdateShortcutByKey(Bucket, Key, NewKey) {
        ui.logToOutput('S3TreeView.RemoveShortcutByKey Started');
        if (!Bucket || !Key) {
            return;
        }
        if (this.treeDataProvider.DoesShortcutExists(Bucket, Key)) {
            this.treeDataProvider.UpdateShortcut(Bucket, Key, NewKey);
            this.SaveState();
        }
    }
    DoesShortcutExists(Bucket, Key) {
        if (!Key) {
            return false;
        }
        return this.treeDataProvider.DoesShortcutExists(Bucket, Key);
    }
    async RemoveShortcut(node) {
        ui.logToOutput('S3TreeView.RemoveShortcut Started');
        if (node.TreeItemType !== S3TreeItem_1.TreeItemType.Shortcut) {
            return;
        }
        if (!node.Bucket || !node.Shortcut) {
            return;
        }
        this.treeDataProvider.RemoveShortcut(node.Bucket, node.Shortcut);
        S3Explorer_1.S3Explorer.Current?.RenderHtml(); //to update shortcut icon
        this.SaveState();
    }
    async CopyShortcut(node) {
        ui.logToOutput('S3TreeView.CopyShortcut Started');
        if (node.TreeItemType !== S3TreeItem_1.TreeItemType.Shortcut) {
            return;
        }
        if (!node.Bucket || !node.Shortcut) {
            return;
        }
        vscode.env.clipboard.writeText(node.Shortcut);
    }
    async AddShortcut(node) {
        ui.logToOutput('S3TreeView.AddShortcut Started');
        if (!node.Bucket) {
            return;
        }
        let bucket = node.Bucket;
        let shortcut = await vscode.window.showInputBox({ placeHolder: 'Enter a Folder/File Key' });
        if (shortcut === undefined) {
            return;
        }
        this.AddOrRemoveShortcut(bucket, shortcut);
    }
    async ShowS3Explorer(node) {
        ui.logToOutput('S3TreeView.ShowS3Explorer Started');
        S3Explorer_1.S3Explorer.Render(this.context.extensionUri, node);
    }
    async ShowS3Search(node) {
        ui.logToOutput('S3TreeView.ShowS3Search Started');
        S3Search_1.S3Search.Render(this.context.extensionUri, node);
    }
    async SelectAwsProfile(node) {
        ui.logToOutput('S3TreeView.SelectAwsProfile Started');
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
        this.SetFilterMessage();
        this.treeDataProvider.Refresh();
    }
    async UpdateAwsEndPoint() {
        ui.logToOutput('S3TreeView.UpdateAwsEndPoint Started');
        let awsEndPointUrl = await vscode.window.showInputBox({ placeHolder: 'Enter Aws End Point URL (Leave Empty To Return To Default)', value: this.AwsEndPoint });
        if (awsEndPointUrl === undefined) {
            return;
        }
        if (awsEndPointUrl.length === 0) {
            this.AwsEndPoint = undefined;
        }
        else {
            this.AwsEndPoint = awsEndPointUrl;
        }
        this.SaveState();
        ui.showInfoMessage('Aws End Point Updated');
    }
    async SetAwsRegion() {
        ui.logToOutput('S3TreeView.UpdateAwsRegion Started');
        let awsRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Aws Region (Leave Empty To Return To Default)' });
        if (awsRegion === undefined) {
            return;
        }
        if (awsRegion.length === 0) {
            this.AwsRegion = undefined;
        }
        else {
            this.AwsRegion = awsRegion;
        }
        this.SaveState();
    }
    async ExportToYaml() {
        ui.logToOutput('S3TreeView.ExportToYaml Started');
        const treeStructure = this.treeDataProvider.GetTreeStructure();
        if (treeStructure.length === 0) {
            ui.showWarningMessage('No resources to export');
            return;
        }
        await ConfigManager_1.ConfigManager.exportToConfig(treeStructure);
    }
}
exports.S3TreeView = S3TreeView;
//# sourceMappingURL=S3TreeView.js.map