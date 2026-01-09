"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueService = void 0;
const vscode = require("vscode");
const AbstractAwsService_1 = require("../AbstractAwsService");
const GlueTreeDataProvider_1 = require("./GlueTreeDataProvider");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const ui = require("../../common/UI");
const api = require("./API");
class GlueService extends AbstractAwsService_1.AbstractAwsService {
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
        super();
        GlueService.Instance = this;
        this.context = context;
        this.loadBaseState();
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
        context.subscriptions.push(vscode.commands.registerCommand('aws-workbench.glue.Refresh', () => {
            this.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.glue.Filter', async () => {
            await this.Filter();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.glue.AddGlueJob', async () => {
            await this.AddGlueJob();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.glue.RemoveGlueJob', async (node) => {
            await this.RemoveGlueJob(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.glue.ViewLog', (node) => {
            this.ViewLog(wrap(node));
        }));
    }
    async getRootNodes() {
        const nodes = await this.treeDataProvider.getChildren(undefined);
        const items = nodes.map((n) => this.mapToWorkbenchItem(n));
        return this.processNodes(items);
    }
    mapToWorkbenchItem(n) {
        const item = new WorkbenchTreeItem_1.WorkbenchTreeItem(typeof n.label === 'string' ? n.label : n.label?.label || '', n.collapsibleState || vscode.TreeItemCollapsibleState.None, this.serviceId, n.contextValue, n);
        if (!item.id) {
            if (n.Region && n.ResourceName) {
                item.id = `${n.Region}:${n.ResourceName}:${n.TreeItemType ?? ''}`;
            }
            else if (n.Region) {
                item.id = n.Region;
            }
        }
        if (n.iconPath) {
            item.iconPath = n.iconPath;
        }
        if (n.description) {
            item.description = n.description;
        }
        if (n.tooltip) {
            item.tooltip = n.tooltip;
        }
        if (n.command) {
            item.command = n.command;
        }
        if (n.resourceUri) {
            item.resourceUri = n.resourceUri;
        }
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
            lastAddedItem = this.treeDataProvider.AddResource(selectedRegion, selectedJob, TreeItemType_1.TreeItemType.GlueJob);
        }
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }
    async RemoveGlueJob(node) {
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.GlueJob || !node.Region || !node.ResourceName) {
            return;
        }
        this.treeDataProvider.RemoveResource(node.Region, node.ResourceName, TreeItemType_1.TreeItemType.GlueJob);
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
            this.saveBaseState();
        }
        catch (error) {
            ui.logToOutput("GlueService.saveState Error !!!");
        }
    }
    ViewLog(node) { }
    addToFav(node) {
        const data = node.itemData;
        if (data) {
            data.IsFav = true;
            data.setContextValue();
        }
        super.addToFav(node);
    }
    deleteFromFav(node) {
        const data = node.itemData;
        if (data) {
            data.IsFav = false;
            data.setContextValue();
        }
        super.deleteFromFav(node);
    }
    hideResource(node) {
        const data = node.itemData;
        if (data) {
            data.IsHidden = true;
            data.setContextValue();
        }
        super.hideResource(node);
    }
    unhideResource(node) {
        const data = node.itemData;
        if (data) {
            data.IsHidden = false;
            data.setContextValue();
        }
        super.unhideResource(node);
    }
    showOnlyInProfile(node, profile) {
        const data = node.itemData;
        if (data) {
            data.ProfileToShow = profile;
            data.setContextValue();
        }
        super.showOnlyInProfile(node, profile);
    }
    showInAnyProfile(node) {
        const data = node.itemData;
        if (data) {
            data.ProfileToShow = "";
            data.setContextValue();
        }
        super.showInAnyProfile(node);
    }
}
exports.GlueService = GlueService;
//# sourceMappingURL=GlueService.js.map