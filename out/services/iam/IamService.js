"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamService = void 0;
const vscode = require("vscode");
const IamTreeDataProvider_1 = require("./iam/IamTreeDataProvider");
const IamTreeItem_1 = require("./iam/IamTreeItem");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const ui = require("../../common/UI");
const api = require("./common/API");
class IamService {
    static Instance;
    serviceId = 'iam';
    treeDataProvider;
    context;
    FilterString = "";
    isShowOnlyFavorite = false;
    isShowHiddenNodes = false;
    AwsProfile = "default";
    AwsEndPoint;
    IamRoleList = [];
    constructor(context) {
        IamService.Instance = this;
        this.context = context;
        this.treeDataProvider = new IamTreeDataProvider_1.IamTreeDataProvider();
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
        context.subscriptions.push(vscode.commands.registerCommand('IamTreeView.Refresh', () => {
            this.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('IamTreeView.Filter', async () => {
            await this.Filter();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('IamTreeView.ShowOnlyFavorite', async () => {
            await this.ShowOnlyFavorite();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('IamTreeView.ShowHiddenNodes', async () => {
            await this.ShowHiddenNodes();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('IamTreeView.AddToFav', (node) => {
            this.AddToFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('IamTreeView.DeleteFromFav', (node) => {
            this.DeleteFromFav(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('IamTreeView.HideNode', (node) => {
            this.HideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('IamTreeView.UnHideNode', (node) => {
            this.UnHideNode(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('IamTreeView.AddIamRole', async () => {
            await this.AddIamRole();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('IamTreeView.RemoveIamRole', async (node) => {
            await this.RemoveIamRole(wrap(node));
            treeProvider.refresh();
        }));
    }
    async getRootNodes() {
        const nodes = this.treeDataProvider.GetIamRoleNodes();
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
        return await this.AddIamRole();
    }
    Refresh() {
        this.treeDataProvider.Refresh();
    }
    async AddIamRole() {
        ui.logToOutput('IamService.AddIamRole Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        let selectedRoleName = await vscode.window.showInputBox({ placeHolder: 'Enter IAM Role Name / Search Text' });
        if (selectedRoleName === undefined) {
            return;
        }
        var resultRole = await api.GetIamRoleList(selectedRoleName);
        if (!resultRole.isSuccessful) {
            return;
        }
        let selectedRoleList = await vscode.window.showQuickPick(resultRole.result, { canPickMany: true, placeHolder: 'Select IAM Role(s)' });
        if (!selectedRoleList || selectedRoleList.length === 0) {
            return;
        }
        let lastAddedItem;
        for (var selectedRole of selectedRoleList) {
            lastAddedItem = this.treeDataProvider.AddIamRole(selectedRegion, selectedRole);
        }
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }
    async RemoveIamRole(node) {
        if (!node || node.TreeItemType !== IamTreeItem_1.TreeItemType.IamRole || !node.Region || !node.IamRole) {
            return;
        }
        this.treeDataProvider.RemoveIamRole(node.Region, node.IamRole);
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
            this.IamRoleList = this.context.globalState.get('IamRoleList', []);
        }
        catch (error) {
            ui.logToOutput("IamService.loadState Error !!!");
        }
    }
    SaveState() {
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('IamRoleList', this.IamRoleList);
        }
        catch (error) {
            ui.logToOutput("IamService.saveState Error !!!");
        }
    }
    LoadPermissions(node) { }
    LoadTrustRelationships(node) { }
    LoadTags(node) { }
    LoadInfo(node) { }
}
exports.IamService = IamService;
//# sourceMappingURL=IamService.js.map