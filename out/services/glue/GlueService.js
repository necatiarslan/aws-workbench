"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueService = void 0;
const vscode = require("vscode");
const GlueTreeDataProvider_1 = require("./GlueTreeDataProvider");
const GlueTreeItem_1 = require("./GlueTreeItem");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const ui = require("../../common/UI");
const api = require("./API");
class GlueService {
    static Instance;
    serviceId = 'glue';
    treeDataProvider;
    context;
    FilterString = "";
    isShowOnlyFavorite = false;
    isShowHiddenNodes = false;
    AwsProfile = "default";
    AwsEndPoint;
    ResourceList = [];
    JobInfoCache = {};
    JobRunsCache = {};
    LogStreamsCache = {};
    constructor(context) {
        GlueService.Instance = this;
        this.context = context;
        this.treeDataProvider = new GlueTreeDataProvider_1.GlueTreeDataProvider();
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
        context.subscriptions.push(vscode.commands.registerCommand('GlueTreeView.Refresh', () => {
            this.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('GlueTreeView.Filter', async () => {
            await this.Filter();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('GlueTreeView.AddGlueJob', async () => {
            await this.AddGlueJob();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('GlueTreeView.RemoveGlueJob', async (node) => {
            await this.RemoveGlueJob(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('GlueTreeView.ViewLog', (node) => {
            this.ViewLog(wrap(node));
        }));
    }
    async getRootNodes() {
        const nodes = await this.treeDataProvider.getChildren(undefined);
        return nodes.map((n) => this.mapToWorkbenchItem(n));
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
        return await this.AddGlueJob();
    }
    Refresh() {
        this.treeDataProvider.Refresh();
    }
    async AddGlueJob() {
        ui.logToOutput('GlueService.AddGlueJob Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        let selectedJobName = await vscode.window.showInputBox({ placeHolder: 'Enter Glue Job Name / Search Text' });
        if (selectedJobName === undefined) {
            return;
        }
        var resultJob = await api.GetGlueJobList(selectedRegion, selectedJobName);
        if (!resultJob.isSuccessful) {
            return;
        }
        let selectedJobList = await vscode.window.showQuickPick(resultJob.result, { canPickMany: true, placeHolder: 'Select Glue Job(s)' });
        if (!selectedJobList || selectedJobList.length === 0) {
            return;
        }
        let lastAddedItem;
        for (var selectedJob of selectedJobList) {
            lastAddedItem = this.treeDataProvider.AddResource(selectedRegion, selectedJob, GlueTreeItem_1.TreeItemType.Job);
        }
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }
    async RemoveGlueJob(node) {
        if (!node || node.TreeItemType !== GlueTreeItem_1.TreeItemType.Job || !node.Region || !node.ResourceName) {
            return;
        }
        this.treeDataProvider.RemoveResource(node.Region, node.ResourceName, GlueTreeItem_1.TreeItemType.Job);
        this.SaveState();
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
    LoadState() {
        try {
            this.AwsProfile = this.context.globalState.get('AwsProfile', 'default');
            this.FilterString = this.context.globalState.get('FilterString', '');
            this.ResourceList = this.context.globalState.get('ResourceList', []);
        }
        catch (error) {
            ui.logToOutput("GlueService.loadState Error !!!");
        }
    }
    SaveState() {
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ResourceList', this.ResourceList);
        }
        catch (error) {
            ui.logToOutput("GlueService.saveState Error !!!");
        }
    }
    ViewLog(node) { }
}
exports.GlueService = GlueService;
//# sourceMappingURL=GlueService.js.map