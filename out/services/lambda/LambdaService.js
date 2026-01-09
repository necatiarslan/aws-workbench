"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaService = void 0;
const vscode = require("vscode");
const AbstractAwsService_1 = require("../AbstractAwsService");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const LambdaTreeDataProvider_1 = require("./LambdaTreeDataProvider");
const ui = require("../../common/UI");
const api = require("./API");
class LambdaService extends AbstractAwsService_1.AbstractAwsService {
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
        super();
        LambdaService.Instance = this;
        this.context = context;
        this.loadBaseState();
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
        context.subscriptions.push(vscode.commands.registerCommand('aws-workbench.lambda.Refresh', () => {
            this.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.lambda.AddLambda', async () => {
            await this.AddLambda();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.lambda.Filter', async () => {
            await this.Filter();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.lambda.ShowOnlyFavorite', async () => {
            await this.ShowOnlyFavorite();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.lambda.ShowHiddenNodes', async () => {
            await this.ShowHiddenNodes();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.lambda.AddToFav', (node) => {
            this.AddToFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.lambda.DeleteFromFav', (node) => {
            this.DeleteFromFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.lambda.HideNode', (node) => {
            this.HideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.lambda.UnHideNode', (node) => {
            this.UnHideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.lambda.RemoveLambda', async (node) => {
            await this.RemoveLambda(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.lambda.Goto', (node) => {
            this.Goto(wrap(node));
        }), vscode.commands.registerCommand('aws-workbench.lambda.TriggerLambda', (node) => {
            this.TriggerLambda(wrap(node));
        }), vscode.commands.registerCommand('aws-workbench.lambda.ViewLatestLog', (node) => {
            this.ViewLatestLog(wrap(node));
        }), vscode.commands.registerCommand('aws-workbench.lambda.LambdaView', (node) => {
            this.LambdaView(wrap(node));
        }), vscode.commands.registerCommand('aws-workbench.lambda.PrintLambda', async (node) => {
            await this.PrintLambda(wrap(node));
        }), vscode.commands.registerCommand('aws-workbench.lambda.UpdateLambdaCodes', async (node) => {
            await this.UpdateLambdaCodes(wrap(node));
        }), vscode.commands.registerCommand('aws-workbench.lambda.DownloadLambdaCode', async (node) => {
            await this.DownloadLambdaCode(wrap(node));
        }));
    }
    async getRootNodes() {
        const lambdas = await this.treeDataProvider.GetLambdaNodes();
        const items = lambdas.map(l => this.mapToWorkbenchItem(l));
        return this.processNodes(items);
    }
    mapToWorkbenchItem(n) {
        const item = new WorkbenchTreeItem_1.WorkbenchTreeItem(typeof n.label === 'string' ? n.label : n.label?.label || '', n.collapsibleState || vscode.TreeItemCollapsibleState.None, this.serviceId, n.contextValue, n);
        if (!item.id) {
            if (n.Region && n.Lambda) {
                item.id = `${n.Region}:${n.Lambda}:${n.TreeItemType ?? ''}`;
            }
            else if (n.Region) {
                item.id = `${n.Region}:${n.TreeItemType ?? ''}`;
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
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.LambdaFunction || !node.Region || !node.Lambda) {
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
            this.saveBaseState();
        }
        catch (error) {
            ui.logToOutput("LambdaService.saveState Error !!!");
        }
    }
    // Proxy methods for TreeDataProvider to call back into Service for business logic if needed
    LoadEnvironmentVariables(node) { }
    LoadTags(node) { }
    LoadInfo(node) { }
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
exports.LambdaService = LambdaService;
//# sourceMappingURL=LambdaService.js.map