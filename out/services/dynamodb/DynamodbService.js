"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamodbService = void 0;
const vscode = require("vscode");
const DynamodbTreeDataProvider_1 = require("./DynamodbTreeDataProvider");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const ui = require("../../common/UI");
const api = require("./API");
class DynamodbService {
    static Instance;
    serviceId = 'dynamodb';
    treeDataProvider;
    context;
    FilterString = "";
    isShowOnlyFavorite = false;
    isShowHiddenNodes = false;
    AwsProfile = "default";
    AwsEndPoint;
    DynamodbList = [];
    constructor(context) {
        DynamodbService.Instance = this;
        this.context = context;
        this.treeDataProvider = new DynamodbTreeDataProvider_1.DynamodbTreeDataProvider();
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
        context.subscriptions.push(vscode.commands.registerCommand('aws-workbench.dynamodb.Refresh', () => {
            this.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.dynamodb.Filter', async () => {
            await this.Filter();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.dynamodb.ShowOnlyFavorite', async () => {
            await this.ShowOnlyFavorite();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.dynamodb.ShowHiddenNodes', async () => {
            await this.ShowHiddenNodes();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.dynamodb.AddToFav', (node) => {
            this.AddToFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.dynamodb.DeleteFromFav', (node) => {
            this.DeleteFromFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.dynamodb.HideNode', (node) => {
            this.HideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.dynamodb.UnHideNode', (node) => {
            this.UnHideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.dynamodb.AddDynamodb', async () => {
            await this.AddDynamodb();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.dynamodb.RemoveDynamodb', async (node) => {
            await this.RemoveDynamodb(wrap(node));
            treeProvider.refresh();
        }));
    }
    async getRootNodes() {
        const nodes = this.treeDataProvider.GetDynamodbNodes();
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
        return await this.AddDynamodb();
    }
    Refresh() {
        this.treeDataProvider.Refresh();
    }
    async AddDynamodb() {
        ui.logToOutput('DynamodbService.AddDynamodb Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        let selectedTableName = await vscode.window.showInputBox({ placeHolder: 'Enter Table Name / Search Text' });
        if (selectedTableName === undefined) {
            return;
        }
        var resultTable = await api.GetDynamodbList(selectedRegion, selectedTableName);
        if (!resultTable.isSuccessful) {
            return;
        }
        let selectedTableList = await vscode.window.showQuickPick(resultTable.result, { canPickMany: true, placeHolder: 'Select Table(s)' });
        if (!selectedTableList || selectedTableList.length === 0) {
            return;
        }
        let lastAddedItem;
        for (var selectedTable of selectedTableList) {
            lastAddedItem = this.treeDataProvider.AddDynamodb(selectedRegion, selectedTable);
        }
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }
    async RemoveDynamodb(node) {
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.DynamoDBTable || !node.Region || !node.Dynamodb) {
            return;
        }
        this.treeDataProvider.RemoveDynamodb(node.Region, node.Dynamodb);
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
            this.DynamodbList = this.context.globalState.get('DynamodbList', []);
        }
        catch (error) {
            ui.logToOutput("DynamodbService.loadState Error !!!");
        }
    }
    SaveState() {
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('DynamodbList', this.DynamodbList);
        }
        catch (error) {
            ui.logToOutput("DynamodbService.saveState Error !!!");
        }
    }
}
exports.DynamodbService = DynamodbService;
//# sourceMappingURL=DynamodbService.js.map