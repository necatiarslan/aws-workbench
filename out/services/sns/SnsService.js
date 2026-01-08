"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnsService = void 0;
const vscode = require("vscode");
const SnsTreeDataProvider_1 = require("./sns/SnsTreeDataProvider");
const SnsTreeItem_1 = require("./sns/SnsTreeItem");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const ui = require("../../common/UI");
const api = require("./common/API");
class SnsService {
    static Instance;
    serviceId = 'sns';
    treeDataProvider;
    context;
    FilterString = "";
    isShowOnlyFavorite = false;
    isShowHiddenNodes = false;
    AwsProfile = "default";
    AwsEndPoint;
    TopicList = [];
    constructor(context) {
        SnsService.Instance = this;
        this.context = context;
        this.treeDataProvider = new SnsTreeDataProvider_1.SnsTreeDataProvider();
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
        context.subscriptions.push(vscode.commands.registerCommand('SnsTreeView.Refresh', () => {
            this.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('SnsTreeView.Filter', async () => {
            await this.Filter();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('SnsTreeView.ShowOnlyFavorite', async () => {
            await this.ShowOnlyFavorite();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('SnsTreeView.ShowHiddenNodes', async () => {
            await this.ShowHiddenNodes();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('SnsTreeView.AddToFav', (node) => {
            this.AddToFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('SnsTreeView.DeleteFromFav', (node) => {
            this.DeleteFromFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('SnsTreeView.HideNode', (node) => {
            this.HideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('SnsTreeView.UnHideNode', (node) => {
            this.UnHideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('SnsTreeView.AddTopic', async () => {
            await this.AddTopic();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('SnsTreeView.RemoveTopic', async (node) => {
            await this.RemoveTopic(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('SnsTreeView.PublishMessage', async (node) => {
            await this.PublishMessage(wrap(node));
        }));
    }
    async getRootNodes() {
        const nodes = this.treeDataProvider.GetSnsNodes();
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
        return await this.AddTopic();
    }
    Refresh() {
        this.treeDataProvider.Refresh();
    }
    async AddTopic() {
        ui.logToOutput('SnsService.AddTopic Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        let selectedTopicName = await vscode.window.showInputBox({ placeHolder: 'Enter Topic Name / Search Text' });
        if (selectedTopicName === undefined) {
            return;
        }
        var resultTopic = await api.GetSnsTopicList(selectedRegion, selectedTopicName);
        if (!resultTopic.isSuccessful) {
            return;
        }
        let selectedTopicList = await vscode.window.showQuickPick(resultTopic.result, { canPickMany: true, placeHolder: 'Select Topic(s)' });
        if (!selectedTopicList || selectedTopicList.length === 0) {
            return;
        }
        let lastAddedItem;
        for (var selectedTopic of selectedTopicList) {
            lastAddedItem = this.treeDataProvider.AddTopic(selectedRegion, selectedTopic);
        }
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }
    async RemoveTopic(node) {
        if (!node || node.TreeItemType !== SnsTreeItem_1.TreeItemType.Topic || !node.Region || !node.TopicArn) {
            return;
        }
        this.treeDataProvider.RemoveTopic(node.Region, node.TopicArn);
        this.SaveState();
    }
    async PublishMessage(node) {
        if (!node || !node.Region || !node.TopicArn)
            return;
        ui.logToOutput('SnsService.PublishMessage Started');
        let message = await vscode.window.showInputBox({ placeHolder: 'Enter Message Body' });
        if (message === undefined)
            return;
        let result = await api.PublishMessage(node.Region, node.TopicArn, message);
        if (result.isSuccessful) {
            ui.showInfoMessage('Message Published Successfully');
        }
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
            this.TopicList = this.context.globalState.get('TopicList', []);
        }
        catch (error) {
            ui.logToOutput("SnsService.loadState Error !!!");
        }
    }
    SaveState() {
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('TopicList', this.TopicList);
        }
        catch (error) {
            ui.logToOutput("SnsService.saveState Error !!!");
        }
    }
}
exports.SnsService = SnsService;
//# sourceMappingURL=SnsService.js.map