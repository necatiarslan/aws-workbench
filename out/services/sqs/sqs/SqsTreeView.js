"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqsTreeView = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const SqsTreeItem_1 = require("./SqsTreeItem");
const SqsTreeDataProvider_1 = require("./SqsTreeDataProvider");
const ui = require("../common/UI");
const api = require("../common/API");
class SqsTreeView {
    static Current;
    view;
    treeDataProvider;
    context;
    FilterString = "";
    isShowOnlyFavorite = false;
    isShowHiddenNodes = false;
    AwsProfile = "default";
    AwsEndPoint;
    QueueList = [];
    MessageFilePathList = [];
    constructor(context) {
        ui.logToOutput('TreeView.constructor Started');
        SqsTreeView.Current = this;
        this.context = context;
        this.LoadState();
        this.treeDataProvider = new SqsTreeDataProvider_1.SqsTreeDataProvider();
        this.view = vscode.window.createTreeView('SqsTreeView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
        this.Refresh();
        context.subscriptions.push(this.view);
        this.SetFilterMessage();
    }
    async TestAwsConnection() {
        let response = await api.TestAwsCredentials();
        if (response.isSuccessful && response.result) {
            ui.logToOutput('Aws Credentials Test Successfull');
            ui.showInfoMessage('Aws Credentials Test Successfull');
        }
        else {
            ui.logToOutput('SqsTreeView.TestAwsCredentials Error !!!', response.error);
            ui.showErrorMessage('Aws Credentials Test Error !!!', response.error);
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
            ui.logToOutput('SqsTreeView.TestAwsConnection Error !!!', response.error);
            ui.showErrorMessage('Aws Connection Test Error !!!', response.error);
        }
    }
    BugAndNewFeature() {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/necatiarslan/aws-sqs-vscode-extension/issues/new'));
    }
    Donate() {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/sponsors/necatiarslan'));
    }
    Refresh() {
        ui.logToOutput('SqsTreeView.refresh Started');
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: "Aws Sqs: Loading...",
        }, (progress, token) => {
            progress.report({ increment: 0 });
            this.LoadTreeItems();
            return new Promise(resolve => { resolve(); });
        });
    }
    LoadTreeItems() {
        ui.logToOutput('SqsTreeView.loadTreeItems Started');
        this.treeDataProvider.Refresh();
        this.SetViewTitle();
    }
    ResetView() {
        ui.logToOutput('SqsTreeView.resetView Started');
        this.FilterString = '';
        this.treeDataProvider.Refresh();
        this.SetViewTitle();
        this.SaveState();
        this.Refresh();
    }
    async AddToFav(node) {
        ui.logToOutput('SqsTreeView.AddToFav Started');
        node.IsFav = true;
        node.refreshUI();
    }
    async HideNode(node) {
        ui.logToOutput('SqsTreeView.HideNode Started');
        node.IsHidden = true;
        this.treeDataProvider.Refresh();
    }
    async UnHideNode(node) {
        ui.logToOutput('SqsTreeView.UnHideNode Started');
        node.IsHidden = false;
    }
    async DeleteFromFav(node) {
        ui.logToOutput('SqsTreeView.DeleteFromFav Started');
        node.IsFav = false;
        node.refreshUI();
    }
    async Filter() {
        ui.logToOutput('SqsTreeView.Filter Started');
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
        ui.logToOutput('SqsTreeView.ShowOnlyFavorite Started');
        this.isShowOnlyFavorite = !this.isShowOnlyFavorite;
        this.treeDataProvider.Refresh();
        this.SetFilterMessage();
        this.SaveState();
    }
    async ShowHiddenNodes() {
        ui.logToOutput('SqsTreeView.ShowHiddenNodes Started');
        this.isShowHiddenNodes = !this.isShowHiddenNodes;
        this.treeDataProvider.Refresh();
        this.SetFilterMessage();
        this.SaveState();
    }
    async SetViewTitle() {
        this.view.title = "Aws Sqs";
    }
    SaveState() {
        ui.logToOutput('SqsTreeView.saveState Started');
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('QueueList', this.QueueList);
            this.context.globalState.update('MessageFilePathList', this.MessageFilePathList);
            this.context.globalState.update('AwsEndPoint', this.AwsEndPoint);
            ui.logToOutput("SqsTreeView.saveState Successfull");
        }
        catch (error) {
            ui.logToOutput("SqsTreeView.saveState Error !!!");
        }
    }
    LoadState() {
        ui.logToOutput('SqsTreeView.loadState Started');
        try {
            let AwsEndPointTemp = this.context.globalState.get('AwsEndPoint');
            if (AwsEndPointTemp) {
                this.AwsEndPoint = AwsEndPointTemp;
            }
        }
        catch (error) {
            ui.logToOutput("SqsTreeView.loadState AwsEndPoint Error !!!", error);
            ui.showErrorMessage("Aws Sqs Load State AwsEndPoint Error !!!", error);
        }
        try {
            let AwsProfileTemp = this.context.globalState.get('AwsProfile');
            if (AwsProfileTemp) {
                this.AwsProfile = AwsProfileTemp;
            }
        }
        catch (error) {
            ui.logToOutput("SqsTreeView.loadState AwsProfile Error !!!", error);
            ui.showErrorMessage("Aws Sqs Load State AwsProfile Error !!!", error);
        }
        try {
            let filterStringTemp = this.context.globalState.get('FilterString');
            if (filterStringTemp) {
                this.FilterString = filterStringTemp;
            }
        }
        catch (error) {
            ui.logToOutput("SqsTreeView.loadState FilterString Error !!!", error);
            ui.showErrorMessage("Aws Sqs Load State FilterString Error !!!", error);
        }
        try {
            let ShowOnlyFavoriteTemp = this.context.globalState.get('ShowOnlyFavorite');
            if (ShowOnlyFavoriteTemp) {
                this.isShowOnlyFavorite = ShowOnlyFavoriteTemp;
            }
        }
        catch (error) {
            ui.logToOutput("SqsTreeView.loadState Error !!!", error);
            ui.showErrorMessage("Aws Sqs Load State Error !!!", error);
        }
        try {
            let ShowHiddenNodesTemp = this.context.globalState.get('ShowHiddenNodes');
            if (ShowHiddenNodesTemp) {
                this.isShowHiddenNodes = ShowHiddenNodesTemp;
            }
        }
        catch (error) {
            ui.logToOutput("SqsTreeView.loadState isShowHiddenNodes Error !!!", error);
            ui.showErrorMessage("Aws Sqs Load State isShowHiddenNodes Error !!!", error);
        }
        try {
            let QueuListTemp = this.context.globalState.get('QueueList');
            if (QueuListTemp) {
                this.QueueList = QueuListTemp;
            }
            let MessageFilePathListTemp = this.context.globalState.get('MessageFilePathList');
            if (MessageFilePathListTemp) {
                this.MessageFilePathList = MessageFilePathListTemp;
            }
        }
        catch (error) {
            ui.logToOutput("SqsTreeView.loadState SqsList Error !!!", error);
            ui.showErrorMessage("Aws Sqs Load State SqsList Error !!!", error);
        }
    }
    async SetFilterMessage() {
        if (this.QueueList.length > 0) {
            this.view.message =
                await this.GetFilterProfilePrompt()
                    + this.GetBoolenSign(this.isShowOnlyFavorite) + "Fav, "
                    + this.GetBoolenSign(this.isShowHiddenNodes) + "Hidden, "
                    + this.FilterString;
        }
    }
    async GetFilterProfilePrompt() {
        return "Profile:" + this.AwsProfile + " ";
    }
    GetBoolenSign(variable) {
        return variable ? "✓" : "𐄂";
    }
    async AddQueue() {
        ui.logToOutput('SqsTreeView.AddQueue Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        let selectedQueueName = await vscode.window.showInputBox({ placeHolder: 'Enter Queue Name / Search Text' });
        if (selectedQueueName === undefined) {
            return;
        }
        var resultQueue = await api.GetSqsQueueList(selectedRegion, selectedQueueName);
        if (!resultQueue.isSuccessful) {
            return;
        }
        let selectedQueuList = await vscode.window.showQuickPick(resultQueue.result, { canPickMany: true, placeHolder: 'Select Queue(s)' });
        if (!selectedQueuList || selectedQueuList.length === 0) {
            return;
        }
        for (var selectedQueue of selectedQueuList) {
            this.treeDataProvider.AddQueue(selectedRegion, selectedQueue);
        }
        this.SaveState();
    }
    async RemoveQueue(node) {
        ui.logToOutput('SqsTreeView.RemoveQueue Started');
        if (node.TreeItemType !== SqsTreeItem_1.TreeItemType.Queue) {
            return;
        }
        this.treeDataProvider.RemoveQueue(node.Region, node.QueueArn);
        this.SaveState();
    }
    async Goto(node) {
        ui.logToOutput('SqsTreeView.Goto Started');
        if (node.TreeItemType !== SqsTreeItem_1.TreeItemType.Queue) {
            return;
        }
        ui.showInfoMessage("Work In Progress");
    }
    async SqsView(node) {
        ui.logToOutput('SqsTreeView.SqsView Started');
        if (node.TreeItemType !== SqsTreeItem_1.TreeItemType.Queue) {
            return;
        }
        ui.showInfoMessage('Work In Progress');
    }
    async PreviewPolicy(node) {
        ui.logToOutput('SqsTreeView.PreviewPolicy Started');
        if (node.TreeItemType !== SqsTreeItem_1.TreeItemType.Policy) {
            return;
        }
        //call api.GetQueuePolicy
        let result = await api.GetQueuePolicy(node.Region, node.QueueArn);
        if (!result.isSuccessful) {
            ui.logToOutput("api.GetQueuePolicy Error !!!", result.error);
            ui.showErrorMessage('Preview Policy Error !!!', result.error);
            return;
        }
        if (result.result) {
            ui.logToOutput("api.GetQueuePolicy Success !!!");
            ui.ShowTextDocument(result.result);
        }
        else {
            ui.logToOutput("api.GetQueuePolicy No Policy Found !!!");
            ui.showInfoMessage('No Policy Found');
            return;
        }
    }
    async SendMessage(node) {
        ui.logToOutput('SqsTreeView.SendMessage Started');
        if (node.IsRunning) {
            return;
        }
        this.SetNodeRunning(node, true);
        let message = "";
        if (node.TreeItemType === SqsTreeItem_1.TreeItemType.PublishFile) {
            if (!node.MessageFilePath) {
                ui.showWarningMessage('Message Path is not set');
                this.SetNodeRunning(node, false);
                return;
            }
            let file = await vscode.workspace.openTextDocument(node.MessageFilePath);
            if (file === undefined) {
                ui.showWarningMessage('File not found: ' + node.MessageFilePath);
                this.SetNodeRunning(node, false);
                return;
            }
            message = file.getText();
        }
        else {
            let input = await vscode.window.showInputBox({ placeHolder: 'Enter Message' });
            if (input === undefined) {
                this.SetNodeRunning(node, false);
                return;
            }
            if (input === "") {
                this.SetNodeRunning(node, false);
                return;
            }
            message = input;
        }
        let result = await api.SendMessage(node.Region, node.QueueArn, message);
        if (!result.isSuccessful) {
            ui.logToOutput("api.SendMessage Error !!!", result.error);
            ui.showErrorMessage('Send Message Error !!!', result.error);
            this.SetNodeRunning(node, false);
            return;
        }
        ui.logToOutput("api.SendMessage Success !!!");
        ui.logToOutput("MessageId: " + result.result.MessageId);
        ui.showInfoMessage('Message Published Successfully. MessageId: ' + result.result.MessageId);
        this.SetNodeRunning(node, false);
    }
    async ReceiveMessage(node) {
        ui.logToOutput('SqsTreeView.ReceiveMessage Started');
        if (node.IsRunning) {
            return;
        }
        this.SetNodeRunning(node, true);
        let result = await api.ReceiveMessage(node.Region, node.QueueArn);
        if (!result.isSuccessful) {
            ui.logToOutput("api.ReceiveMessage Error !!!", result.error);
            ui.showErrorMessage('Receive Message Error !!!', result.error);
            this.SetNodeRunning(node, false);
            return;
        }
        ui.logToOutput("api.ReceiveMessage Success !!!");
        if (result.result.Messages && result.result.Messages.length > 0) {
            for (let message of result.result.Messages) {
                this.treeDataProvider.AddNewReceivedMessageNode(node, node.Region, node.QueueArn, message);
            }
            ui.showInfoMessage('Messages Received: ' + result.result.Messages.length);
        }
        else {
            ui.showInfoMessage('No Messages Received');
        }
        this.SetNodeRunning(node, false);
    }
    async DeleteAllMessages(node) {
        ui.logToOutput('SqsTreeView.DeleteAllMessages Started');
        if (node.IsRunning) {
            return;
        }
        let confirm = await vscode.window.showInputBox({ placeHolder: 'print delete to confirm' });
        if (confirm === undefined || !["delete", "d"].includes(confirm)) {
            return;
        }
        this.SetNodeRunning(node, true);
        let result = await api.DeleteAllMessages(node.Region, node.QueueArn);
        if (!result.isSuccessful) {
            ui.logToOutput("api.DeleteAllMessages Error !!!", result.error);
            ui.showErrorMessage('Delete All Messages Error !!!', result.error);
            this.SetNodeRunning(node, false);
            return;
        }
        ui.logToOutput("api.DeleteAllMessages Success !!!");
        if (result.result) {
            ui.showInfoMessage(result.result + ' Messages Deleted Successfully');
        }
        else {
            ui.showInfoMessage('No Messages Deleted');
        }
        this.SetNodeRunning(node, false);
    }
    async GetMessageCount(node) {
        ui.logToOutput('SqsTreeView.GetMessageCount Started');
        if (node.IsRunning) {
            return;
        }
        this.SetNodeRunning(node, true);
        let result = await api.GetMessageCount(node.Region, node.QueueArn);
        if (!result.isSuccessful) {
            ui.logToOutput("api.GetMessageCount Error !!!", result.error);
            ui.showErrorMessage('Get Message Count Error !!!', result.error);
            this.SetNodeRunning(node, false);
            return;
        }
        ui.logToOutput("api.GetMessageCount Success !!!");
        ui.showInfoMessage('Message Count: ' + result.result);
        this.SetNodeRunning(node, false);
    }
    async PreviewMessage(node) {
        ui.logToOutput('SqsTreeView.PreviewMessage Started');
        if (!(node.TreeItemType == SqsTreeItem_1.TreeItemType.ReceivedMessage || node.TreeItemType == SqsTreeItem_1.TreeItemType.DeletedMessage)) {
            return;
        }
        if (!node.Body) {
            return;
        }
        ui.ShowTextDocument(node.Body);
    }
    async DeleteMessage(node) {
        ui.logToOutput('SqsTreeView.DeleteMessage Started');
        if (node.TreeItemType !== SqsTreeItem_1.TreeItemType.ReceivedMessage) {
            return;
        }
        if (!node.ReceiptHandle) {
            return;
        }
        this.SetNodeRunning(node, true);
        let result = await api.DeleteMessage(node.Region, node.QueueArn, node.ReceiptHandle);
        if (!result.isSuccessful) {
            ui.logToOutput("api.DeleteMessage Error !!!", result.error);
            ui.showErrorMessage('Delete Message Error !!!', result.error);
            this.SetNodeRunning(node, false);
            return;
        }
        node.TreeItemType = SqsTreeItem_1.TreeItemType.DeletedMessage;
        ui.logToOutput("api.DeleteMessage Success !!!");
        ui.showInfoMessage('Message Deleted Successfully');
        this.treeDataProvider.Refresh();
        this.SetNodeRunning(node, false);
    }
    SetNodeRunning(node, isRunning) {
        node.IsRunning = isRunning;
        node.refreshUI();
        this.treeDataProvider.Refresh();
    }
    async SelectAwsProfile(node) {
        ui.logToOutput('SqsTreeView.SelectAwsProfile Started');
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
    }
    async UpdateAwsEndPoint() {
        ui.logToOutput('SqsTreeView.UpdateAwsEndPoint Started');
        let awsEndPointUrl = await vscode.window.showInputBox({ placeHolder: 'Enter Aws End Point URL (Leave Empty To Return To Default)' });
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
        this.Refresh();
    }
    async PrintQueue(node) {
        ui.logToOutput('SqsTreeView.PrintQueue Started');
        ui.showInfoMessage('Work In Progress');
    }
    async RemoveMessageFilePath(node) {
        ui.logToOutput('SqsTreeView.RemoveMessageFilePath Started');
        if (node.TreeItemType !== SqsTreeItem_1.TreeItemType.PublishFile) {
            return;
        }
        this.treeDataProvider.RemoveMessageFilePath(node);
        this.SaveState();
        ui.showInfoMessage('Message Path Removed Successfully');
    }
    async AddMessageFilePath(node) {
        ui.logToOutput('SqsTreeView.AddMessageFilePath Started');
        if (node.TreeItemType !== SqsTreeItem_1.TreeItemType.PublishGroup) {
            return;
        }
        const selectedPath = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select',
            canSelectFiles: true
        });
        if (!selectedPath || selectedPath.length === 0) {
            return;
        }
        this.treeDataProvider.AddMessageFilePath(node, selectedPath[0].path);
        this.SaveState();
        ui.showInfoMessage('Message Path Added Successfully');
    }
}
exports.SqsTreeView = SqsTreeView;
//# sourceMappingURL=SqsTreeView.js.map