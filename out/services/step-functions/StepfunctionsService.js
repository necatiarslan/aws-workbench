"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepfunctionsService = void 0;
const vscode = require("vscode");
const StepFuncTreeDataProvider_1 = require("./StepFuncTreeDataProvider");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const ui = require("../../common/UI");
const api = require("./API");
class StepfunctionsService {
    static Instance;
    serviceId = 'stepfunctions';
    treeDataProvider;
    context;
    FilterString = "";
    isShowOnlyFavorite = false;
    isShowHiddenNodes = false;
    AwsProfile = "default";
    AwsEndPoint;
    StepFuncList = [];
    PayloadPathList = [];
    CodePathList = [];
    constructor(context) {
        StepfunctionsService.Instance = this;
        this.context = context;
        this.treeDataProvider = new StepFuncTreeDataProvider_1.StepFuncTreeDataProvider();
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
        context.subscriptions.push(vscode.commands.registerCommand('aws-workbench.step-functions.Refresh', () => {
            this.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.step-functions.Filter', async () => {
            await this.Filter();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.step-functions.ShowOnlyFavorite', async () => {
            await this.ShowOnlyFavorite();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.step-functions.ShowHiddenNodes', async () => {
            await this.ShowHiddenNodes();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.step-functions.AddToFav', (node) => {
            this.AddToFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.step-functions.DeleteFromFav', (node) => {
            this.DeleteFromFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.step-functions.HideNode', (node) => {
            this.HideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.step-functions.UnHideNode', (node) => {
            this.UnHideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.step-functions.AddStepFunc', async () => {
            await this.AddStepFunc();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.step-functions.RemoveStepFunc', async (node) => {
            await this.RemoveStepFunc(wrap(node));
            treeProvider.refresh();
        }));
    }
    async getRootNodes() {
        const nodes = this.treeDataProvider.GetStepFuncNodes();
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
        return await this.AddStepFunc();
    }
    Refresh() {
        this.treeDataProvider.Refresh();
    }
    async AddStepFunc() {
        ui.logToOutput('StepfunctionsService.AddStepFunc Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        let selectedStepFuncName = await vscode.window.showInputBox({ placeHolder: 'Enter Step Function Name / Search Text' });
        if (selectedStepFuncName === undefined) {
            return;
        }
        var resultStepFunc = await api.GetStepFuncList(selectedRegion, selectedStepFuncName);
        if (!resultStepFunc.isSuccessful) {
            return;
        }
        let selectedStepFuncList = await vscode.window.showQuickPick(resultStepFunc.result, { canPickMany: true, placeHolder: 'Select Step Function(s)' });
        if (!selectedStepFuncList || selectedStepFuncList.length === 0) {
            return;
        }
        let lastAddedItem;
        for (var selectedStepFunc of selectedStepFuncList) {
            lastAddedItem = this.treeDataProvider.AddStepFunc(selectedRegion, selectedStepFunc);
        }
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }
    async RemoveStepFunc(node) {
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.StepFunctionsStateMachine || !node.Region || !node.StepFuncArn) {
            return;
        }
        this.treeDataProvider.RemoveStepFunc(node.Region, node.StepFuncArn);
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
            this.StepFuncList = this.context.globalState.get('StepFuncList', []);
            this.PayloadPathList = this.context.globalState.get('PayloadPathList', []);
            this.CodePathList = this.context.globalState.get('CodePathList', []);
        }
        catch (error) {
            ui.logToOutput("StepfunctionsService.loadState Error !!!");
        }
    }
    SaveState() {
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('StepFuncList', this.StepFuncList);
            this.context.globalState.update('PayloadPathList', this.PayloadPathList);
            this.context.globalState.update('CodePathList', this.CodePathList);
        }
        catch (error) {
            ui.logToOutput("StepfunctionsService.saveState Error !!!");
        }
    }
}
exports.StepfunctionsService = StepfunctionsService;
//# sourceMappingURL=StepfunctionsService.js.map