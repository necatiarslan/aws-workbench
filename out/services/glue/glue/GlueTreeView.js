"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueTreeView = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const GlueTreeItem_1 = require("./GlueTreeItem");
const GlueTreeDataProvider_1 = require("./GlueTreeDataProvider");
const ui = require("../common/UI");
const api = require("../common/API");
const CloudWatchLogView_1 = require("../cloudwatch/CloudWatchLogView");
class GlueTreeView {
    static Current;
    view;
    treeDataProvider;
    context;
    FilterString = "";
    isShowOnlyFavorite = false;
    isShowHiddenNodes = false;
    AwsProfile = "default";
    AwsEndPoint;
    ResourceList = [];
    JobRunsCache = {};
    LogStreamsCache = {};
    JobInfoCache = {};
    constructor(context) {
        GlueTreeView.Current = this;
        this.context = context;
        this.LoadState();
        this.treeDataProvider = new GlueTreeDataProvider_1.GlueTreeDataProvider();
        this.view = vscode.window.createTreeView('GlueTreeView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
        this.Refresh();
        context.subscriptions.push(this.view);
    }
    async TestAwsConnection() {
        let response = await api.TestAwsCredentials();
        if (response.isSuccessful && response.result) {
            ui.showInfoMessage('Aws Credentials Test Successfull');
        }
        else {
            ui.showErrorMessage('Aws Credentials Test Error !!!', response.error);
        }
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        response = await api.TestAwsConnection(selectedRegion);
        if (response.isSuccessful && response.result) {
            ui.showInfoMessage('Aws Connection Test Successfull');
        }
        else {
            ui.showErrorMessage('Aws Connection Test Error !!!', response.error);
        }
    }
    BugAndNewFeature() {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/necatiarslan/aws-glue-vscode-extension/issues/new'));
    }
    Donate() {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/sponsors/necatiarslan'));
    }
    Refresh() {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: "Aws Glue: Loading...",
        }, (progress, token) => {
            progress.report({ increment: 0 });
            this.treeDataProvider.Refresh();
            return new Promise(resolve => { resolve(); });
        });
    }
    async AddToFav(node) {
        node.IsFav = true;
        this.treeDataProvider.Refresh();
    }
    async HideNode(node) {
        node.IsHidden = true;
        this.treeDataProvider.Refresh();
    }
    async UnHideNode(node) {
        node.IsHidden = false;
        this.treeDataProvider.Refresh();
    }
    async DeleteFromFav(node) {
        node.IsFav = false;
        this.treeDataProvider.Refresh();
    }
    async Filter() {
        let filterStringTemp = await vscode.window.showInputBox({ value: this.FilterString, placeHolder: 'Enter Your Filter Text' });
        if (filterStringTemp === undefined) {
            return;
        }
        this.FilterString = filterStringTemp;
        this.treeDataProvider.Refresh();
        this.SaveState();
    }
    async ShowOnlyFavorite() {
        this.isShowOnlyFavorite = !this.isShowOnlyFavorite;
        this.treeDataProvider.Refresh();
        this.SaveState();
    }
    async ShowHiddenNodes() {
        this.isShowHiddenNodes = !this.isShowHiddenNodes;
        this.treeDataProvider.Refresh();
        this.SaveState();
    }
    SaveState() {
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('ResourceList', this.ResourceList);
            this.context.globalState.update('AwsEndPoint', this.AwsEndPoint);
        }
        catch (error) { }
    }
    LoadState() {
        try {
            this.AwsEndPoint = this.context.globalState.get('AwsEndPoint');
            this.AwsProfile = this.context.globalState.get('AwsProfile') || "default";
            this.FilterString = this.context.globalState.get('FilterString') || "";
            this.isShowOnlyFavorite = this.context.globalState.get('ShowOnlyFavorite') || false;
            this.isShowHiddenNodes = this.context.globalState.get('ShowHiddenNodes') || false;
            this.ResourceList = this.context.globalState.get('ResourceList') || [];
        }
        catch (error) { }
    }
    async AddGlueJob() {
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        let selectedName = await vscode.window.showInputBox({ placeHolder: 'Enter Job Name / Search Text' });
        if (selectedName === undefined) {
            return;
        }
        let result = await api.GetGlueJobList(selectedRegion, selectedName);
        if (!result.isSuccessful) {
            return;
        }
        let selectedResourceList = await vscode.window.showQuickPick(result.result, { canPickMany: true, placeHolder: `Select Glue Job(s)` });
        if (!selectedResourceList || selectedResourceList.length === 0) {
            return;
        }
        for (var name of selectedResourceList) {
            this.treeDataProvider.AddResource(selectedRegion, name, 'Job');
        }
        this.SaveState();
    }
    async RemoveGlueJob(node) {
        this.treeDataProvider.RemoveResource(node.Region, node.ResourceName, node.TreeItemType);
        this.SaveState();
    }
    async Goto(node) {
        ui.showInfoMessage("Work In Progress");
    }
    async RunJob(node) {
        if (node.IsRunning) {
            return;
        }
        node.IsRunning = true;
        this.treeDataProvider.Refresh();
        let result = await api.StartGlueJobRun(node.Region, node.ResourceName);
        if (!result.isSuccessful) {
            ui.showErrorMessage('Run Job Error !!!', result.error);
            node.IsRunning = false;
            this.treeDataProvider.Refresh();
            return;
        }
        ui.showInfoMessage('Job Run Started Successfully');
        node.IsRunning = false;
        this.treeDataProvider.Refresh();
    }
    async ViewLatestLog(node) {
        // Log group names for Glue are usually:
        // Jobs: /aws-glue/jobs/output or /aws-glue/jobs/error
        let logGroupName = "";
        if (node.TreeItemType === GlueTreeItem_1.TreeItemType.Job)
            logGroupName = "/aws-glue/jobs/output";
        if (!logGroupName)
            return;
        let resultLogStream = await api.GetLatestLogGroupLogStreamList(node.Region, logGroupName);
        if (!resultLogStream.isSuccessful || resultLogStream.result.length === 0) {
            ui.showErrorMessage('Get LogStream Error !!!', resultLogStream.error);
            return;
        }
        CloudWatchLogView_1.CloudWatchLogView.Render(this.context.extensionUri, node.Region, logGroupName, resultLogStream.result[0]);
    }
    async SelectAwsProfile(node) {
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
    }
    async UpdateAwsEndPoint() {
        let awsEndPointUrl = await vscode.window.showInputBox({ placeHolder: 'Enter Aws End Point URL (Leave Empty To Return To Default)' });
        if (awsEndPointUrl === undefined) {
            return;
        }
        this.AwsEndPoint = awsEndPointUrl || undefined;
        this.SaveState();
        this.Refresh();
    }
    async PrintResource(node) {
        let result = await api.GetGlueJobDescription(node.Region, node.ResourceName);
        if (!result.isSuccessful) {
            ui.showErrorMessage('Get Resource Description Error !!!', result.error);
            return;
        }
        let jsonString = JSON.stringify(result.result, null, 2);
        ui.ShowTextDocument(jsonString, "json");
    }
    async ViewLog(node) {
        if (node.TreeItemType !== GlueTreeItem_1.TreeItemType.LogStream)
            return;
        let logGroupName = "";
        if (node.Payload && node.Payload.LogGroupName) {
            logGroupName = node.Payload.LogGroupName;
        }
        else if (node.Parent) {
            logGroupName = node.Parent.label;
        }
        if (!logGroupName)
            return;
        CloudWatchLogView_1.CloudWatchLogView.Render(this.context.extensionUri, node.Region, logGroupName, node.ResourceName);
    }
    async RefreshLogStreams(node) {
        if (node.TreeItemType !== GlueTreeItem_1.TreeItemType.LogGroup)
            return;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: `Aws Glue: Loading Log Streams for ${node.label}...`,
        }, async (progress, token) => {
            let resultLogs = await api.GetLatestLogGroupLogStreamList(node.Region, node.label);
            if (!resultLogs.isSuccessful) {
                ui.showErrorMessage('Get Logs Error!', resultLogs.error);
                return;
            }
            this.LogStreamsCache[node.label] = resultLogs.result;
            this.treeDataProvider.Refresh();
        });
    }
    async RefreshRuns(node) {
        if (node.TreeItemType !== GlueTreeItem_1.TreeItemType.RunGroup || !node.Parent)
            return;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: `Aws Glue: Loading Runs for ${node.Parent.ResourceName}...`,
        }, async (progress, token) => {
            let resultRuns = await api.GetGlueJobRuns(node.Region, node.Parent.ResourceName);
            if (!resultRuns.isSuccessful) {
                ui.showErrorMessage('Get Runs Error!', resultRuns.error);
                return;
            }
            this.JobRunsCache[node.Parent.ResourceName] = resultRuns.result;
            ui.logToOutput(`Fetched ${resultRuns.result.length} runs for ${node.Parent.ResourceName}`);
            this.treeDataProvider.Refresh();
        });
    }
    async RefreshJobInfo(node) {
        if (node.TreeItemType !== GlueTreeItem_1.TreeItemType.Info || !node.Parent)
            return;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: `Aws Glue: Loading Info for ${node.Parent.ResourceName}...`,
        }, async (progress, token) => {
            let result = await api.GetGlueJobDescription(node.Region, node.Parent.ResourceName);
            if (!result.isSuccessful) {
                ui.showErrorMessage('Get Job Info Error!', result.error);
                return;
            }
            this.JobInfoCache[node.Parent.ResourceName] = result.result;
            this.treeDataProvider.Refresh(node);
        });
    }
}
exports.GlueTreeView = GlueTreeView;
//# sourceMappingURL=GlueTreeView.js.map