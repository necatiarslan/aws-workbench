"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudWatchService = void 0;
const vscode = require("vscode");
const CloudWatchTreeDataProvider_1 = require("./CloudWatchTreeDataProvider");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const ui = require("../../common/UI");
const api = require("./API");
class CloudWatchService {
    static Instance;
    serviceId = 'cloudwatch';
    treeDataProvider;
    context;
    FilterString = "";
    isShowOnlyFavorite = false;
    isShowHiddenNodes = false;
    AwsProfile = "default";
    AwsEndPoint;
    LastUsedRegion = "us-east-1";
    LogGroupList = [];
    constructor(context) {
        CloudWatchService.Instance = this;
        this.context = context;
        this.treeDataProvider = new CloudWatchTreeDataProvider_1.CloudWatchTreeDataProvider();
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
        context.subscriptions.push(vscode.commands.registerCommand('aws-workbench.cloudwatch.Refresh', () => {
            this.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.cloudwatch.Filter', async () => {
            await this.Filter();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.cloudwatch.ShowOnlyFavorite', async () => {
            await this.ShowOnlyFavorite();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.cloudwatch.ShowHiddenNodes', async () => {
            await this.ShowHiddenNodes();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.cloudwatch.AddToFav', (node) => {
            this.AddToFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.cloudwatch.DeleteFromFav', (node) => {
            this.DeleteFromFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.cloudwatch.HideNode', (node) => {
            this.HideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.cloudwatch.UnHideNode', (node) => {
            this.UnHideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.cloudwatch.AddLogGroup', async () => {
            await this.AddLogGroup();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.cloudwatch.RemoveLogGroup', async (node) => {
            await this.RemoveLogGroup(wrap(node));
            treeProvider.refresh();
        }));
    }
    async getRootNodes() {
        const nodes = this.treeDataProvider.GetRegionNodes();
        return nodes.map(n => this.mapToWorkbenchItem(n));
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
        return await this.AddLogGroup();
    }
    Refresh() {
        this.treeDataProvider.Refresh();
    }
    async AddLogGroup() {
        ui.logToOutput('CloudWatchService.AddLogGroup Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        this.LastUsedRegion = selectedRegion;
        let selectedGroupName = await vscode.window.showInputBox({ placeHolder: 'Enter Log Group Name / Search Text' });
        if (selectedGroupName === undefined) {
            return;
        }
        var resultGroup = await api.GetLogGroupList(selectedRegion, selectedGroupName);
        if (!resultGroup.isSuccessful) {
            return;
        }
        let selectedGroupList = await vscode.window.showQuickPick(resultGroup.result, { canPickMany: true, placeHolder: 'Select Log Group(s)' });
        if (!selectedGroupList || selectedGroupList.length === 0) {
            return;
        }
        let lastAddedItem;
        for (var selectedGroup of selectedGroupList) {
            lastAddedItem = this.treeDataProvider.AddLogGroup(selectedRegion, selectedGroup);
        }
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }
    async RemoveLogGroup(node) {
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.CloudWatchLogGroup || !node.Region || !node.LogGroup) {
            return;
        }
        this.treeDataProvider.RemoveLogGroup(node.Region, node.LogGroup);
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
    async AddToFav(node) {
        if (!node)
            return;
        node.IsFav = true;
        this.treeDataProvider.Refresh();
    }
    async DeleteFromFav(node) {
        if (!node)
            return;
        node.IsFav = false;
        this.treeDataProvider.Refresh();
    }
    async HideNode(node) {
        if (!node)
            return;
        node.IsHidden = true;
        this.treeDataProvider.Refresh();
    }
    async UnHideNode(node) {
        if (!node)
            return;
        node.IsHidden = false;
        this.treeDataProvider.Refresh();
    }
    LoadState() {
        try {
            this.AwsProfile = this.context.globalState.get('AwsProfile', 'default');
            this.FilterString = this.context.globalState.get('FilterString', '');
            this.isShowOnlyFavorite = this.context.globalState.get('ShowOnlyFavorite', false);
            this.isShowHiddenNodes = this.context.globalState.get('ShowHiddenNodes', false);
            this.LogGroupList = this.context.globalState.get('LogGroupList', []);
            this.LastUsedRegion = this.context.globalState.get('LastUsedRegion', 'us-east-1');
        }
        catch (error) {
            ui.logToOutput("CloudWatchService.loadState Error !!!");
        }
    }
    SaveState() {
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('LogGroupList', this.LogGroupList);
            this.context.globalState.update('LastUsedRegion', this.LastUsedRegion);
        }
        catch (error) {
            ui.logToOutput("CloudWatchService.saveState Error !!!");
        }
    }
}
exports.CloudWatchService = CloudWatchService;
//# sourceMappingURL=CloudWatchService.js.map