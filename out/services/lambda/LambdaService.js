"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaService = void 0;
const vscode = require("vscode");
const LambdaTreeItem_1 = require("./lambda/LambdaTreeItem");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const LambdaTreeDataProvider_1 = require("./lambda/LambdaTreeDataProvider");
const ui = require("../../common/UI");
const api = require("./common/API");
class LambdaService {
    static Instance;
    serviceId = 'lambda';
    treeDataProvider;
    context;
    FilterString = "";
    isShowOnlyFavorite = false;
    isShowHiddenNodes = false;
    AwsProfile = "default";
    AwsEndPoint;
    LambdaList = [];
    PayloadPathList = [];
    CodePathList = [];
    constructor(context) {
        LambdaService.Instance = this;
        this.context = context;
        this.treeDataProvider = new LambdaTreeDataProvider_1.LambdaTreeDataProvider();
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
        context.subscriptions.push(vscode.commands.registerCommand('LambdaTreeView.Refresh', () => {
            this.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('LambdaTreeView.AddLambda', async () => {
            await this.AddLambda();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('LambdaTreeView.Filter', async () => {
            await this.Filter();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('LambdaTreeView.ShowOnlyFavorite', async () => {
            await this.ShowOnlyFavorite();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('LambdaTreeView.ShowHiddenNodes', async () => {
            await this.ShowHiddenNodes();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('LambdaTreeView.AddToFav', (node) => {
            this.AddToFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('LambdaTreeView.DeleteFromFav', (node) => {
            this.DeleteFromFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('LambdaTreeView.HideNode', (node) => {
            this.HideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('LambdaTreeView.UnHideNode', (node) => {
            this.UnHideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('LambdaTreeView.RemoveLambda', async (node) => {
            await this.RemoveLambda(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('LambdaTreeView.Goto', (node) => {
            this.Goto(wrap(node));
        }), vscode.commands.registerCommand('LambdaTreeView.TriggerLambda', (node) => {
            this.TriggerLambda(wrap(node));
        }), vscode.commands.registerCommand('LambdaTreeView.ViewLatestLog', (node) => {
            this.ViewLatestLog(wrap(node));
        }), vscode.commands.registerCommand('LambdaTreeView.LambdaView', (node) => {
            this.LambdaView(wrap(node));
        }), vscode.commands.registerCommand('LambdaTreeView.PrintLambda', async (node) => {
            await this.PrintLambda(wrap(node));
        }), vscode.commands.registerCommand('LambdaTreeView.UpdateLambdaCodes', async (node) => {
            await this.UpdateLambdaCodes(wrap(node));
        }), vscode.commands.registerCommand('LambdaTreeView.DownloadLambdaCode', async (node) => {
            await this.DownloadLambdaCode(wrap(node));
        }));
    }
    async getRootNodes() {
        const lambdas = await this.treeDataProvider.GetLambdaNodes();
        return lambdas.map(l => this.mapToWorkbenchItem(l));
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
        return await this.AddLambda();
    }
    Refresh() {
        this.treeDataProvider.Refresh();
    }
    async AddLambda() {
        ui.logToOutput('LambdaService.AddLambda Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        let selectedLambdaName = await vscode.window.showInputBox({ placeHolder: 'Enter Lambda Name / Search Text' });
        if (selectedLambdaName === undefined) {
            return;
        }
        var resultLambda = await api.GetLambdaList(selectedRegion, selectedLambdaName);
        if (!resultLambda.isSuccessful) {
            return;
        }
        let selectedLambdaList = await vscode.window.showQuickPick(resultLambda.result, { canPickMany: true, placeHolder: 'Select Lambda(s)' });
        if (!selectedLambdaList || selectedLambdaList.length === 0) {
            return;
        }
        let lastAddedItem;
        for (var selectedLambda of selectedLambdaList) {
            lastAddedItem = this.treeDataProvider.AddLambda(selectedRegion, selectedLambda);
        }
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }
    async RemoveLambda(node) {
        if (!node || node.TreeItemType !== LambdaTreeItem_1.TreeItemType.Lambda || !node.Region || !node.Lambda) {
            return;
        }
        this.treeDataProvider.RemoveLambda(node.Region, node.Lambda);
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
    Goto(node) {
        // Implement Goto
    }
    TriggerLambda(node) {
        // Implement TriggerLambda
    }
    ViewLatestLog(node) {
        // Implement ViewLatestLog
    }
    LambdaView(node) {
        // Implement LambdaView
    }
    async PrintLambda(node) {
        // Implement PrintLambda
    }
    async UpdateLambdaCodes(node) {
        // Implement UpdateLambdaCodes
    }
    async DownloadLambdaCode(node) {
        // Implement DownloadLambdaCode
    }
    LoadState() {
        try {
            this.AwsProfile = this.context.globalState.get('AwsProfile', 'default');
            this.FilterString = this.context.globalState.get('FilterString', '');
            this.isShowOnlyFavorite = this.context.globalState.get('ShowOnlyFavorite', false);
            this.isShowHiddenNodes = this.context.globalState.get('ShowHiddenNodes', false);
            this.LambdaList = this.context.globalState.get('LambdaList', []);
            this.PayloadPathList = this.context.globalState.get('PayloadPathList', []);
            this.CodePathList = this.context.globalState.get('CodePathList', []);
        }
        catch (error) {
            ui.logToOutput("LambdaService.loadState Error !!!");
        }
    }
    SaveState() {
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('LambdaList', this.LambdaList);
            this.context.globalState.update('PayloadPathList', this.PayloadPathList);
            this.context.globalState.update('CodePathList', this.CodePathList);
        }
        catch (error) {
            ui.logToOutput("LambdaService.saveState Error !!!");
        }
    }
    // Proxy methods for TreeDataProvider to call back into Service for business logic if needed
    LoadEnvironmentVariables(node) { }
    LoadTags(node) { }
    LoadInfo(node) { }
}
exports.LambdaService = LambdaService;
//# sourceMappingURL=LambdaService.js.map