"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnsService = void 0;
const vscode = require("vscode");
const AbstractAwsService_1 = require("../AbstractAwsService");
const SnsTreeDataProvider_1 = require("./SnsTreeDataProvider");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const ui = require("../../common/UI");
const api = require("./API");
class SnsService extends AbstractAwsService_1.AbstractAwsService {
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
        super();
        SnsService.Instance = this;
        this.context = context;
        this.loadBaseState();
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
        context.subscriptions.push(vscode.commands.registerCommand('aws-workbench.sns.Refresh', () => {
            this.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.sns.Filter', async () => {
            await this.Filter();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.sns.ShowOnlyFavorite', async () => {
            await this.ShowOnlyFavorite();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.sns.ShowHiddenNodes', async () => {
            await this.ShowHiddenNodes();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.sns.AddToFav', (node) => {
            this.AddToFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.sns.DeleteFromFav', (node) => {
            this.DeleteFromFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.sns.HideNode', (node) => {
            this.HideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.sns.UnHideNode', (node) => {
            this.UnHideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.sns.AddTopic', async () => {
            await this.AddTopic();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.sns.RemoveTopic', async (node) => {
            await this.RemoveTopic(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.sns.PublishMessage', async (node) => {
            await this.PublishMessage(wrap(node));
        }));
    }
    async getRootNodes() {
        const nodes = this.treeDataProvider.GetSnsNodes();
        const items = nodes.map(n => this.mapToWorkbenchItem(n));
        return this.processNodes(items);
    }
    mapToWorkbenchItem(n) {
        const item = new WorkbenchTreeItem_1.WorkbenchTreeItem(typeof n.label === 'string' ? n.label : n.label?.label || '', n.collapsibleState || vscode.TreeItemCollapsibleState.None, this.serviceId, n.contextValue, n);
        if (!item.id) {
            if (n.TopicArn) {
                item.id = n.TopicArn;
            }
            else if (n.Region && n.TopicName) {
                item.id = `${n.Region}:${n.TopicName}:${n.TreeItemType ?? ''}`;
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
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.SNSTopic || !node.Region || !node.TopicArn) {
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
        this.addToFav(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }
    async DeleteFromFav(node) {
        if (!node)
            return;
        this.deleteFromFav(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }
    async HideNode(node) {
        if (!node)
            return;
        this.hideResource(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }
    async UnHideNode(node) {
        if (!node)
            return;
        this.unhideResource(this.mapToWorkbenchItem(node));
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
            this.saveBaseState();
        }
        catch (error) {
            ui.logToOutput("SnsService.saveState Error !!!");
        }
    }
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
exports.SnsService = SnsService;
//# sourceMappingURL=SnsService.js.map