"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamService = void 0;
const vscode = require("vscode");
const AbstractAwsService_1 = require("../AbstractAwsService");
const IamTreeDataProvider_1 = require("./IamTreeDataProvider");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const ui = require("../../common/UI");
const api = require("./API");
class IamService extends AbstractAwsService_1.AbstractAwsService {
    static Instance;
    serviceId = 'iam';
    treeDataProvider;
    context;
    IamRoleList = [];
    constructor(context) {
        super();
        IamService.Instance = this;
        this.context = context;
        this.loadBaseState();
        this.treeDataProvider = new IamTreeDataProvider_1.IamTreeDataProvider();
        this.Refresh();
    }
    registerCommands(context, treeProvider, treeView) {
        const wrap = (node) => {
            if (node instanceof WorkbenchTreeItem_1.WorkbenchTreeItem) {
                return node.itemData;
            }
            return node;
        };
        context.subscriptions.push(vscode.commands.registerCommand('aws-workbench.iam.Refresh', () => {
            this.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.iam.AddIamRole', async () => {
            await this.AddIamRole();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.iam.RemoveIamRole', async (node) => {
            await this.RemoveIamRole(wrap(node));
            treeProvider.refresh();
        }));
    }
    async getRootNodes() {
        const nodes = this.treeDataProvider.GetIamRoleNodes();
        const items = nodes.map(n => this.mapToWorkbenchItem(n));
        return this.processNodes(items);
    }
    mapToWorkbenchItem(n) {
        const item = new WorkbenchTreeItem_1.WorkbenchTreeItem(typeof n.label === 'string' ? n.label : n.label?.label || '', n.collapsibleState || vscode.TreeItemCollapsibleState.None, this.serviceId, n.contextValue, n);
        if (!item.id) {
            if (n.Region && n.IamRole) {
                item.id = `${n.Region}:${n.IamRole}:${n.TreeItemType ?? ''}`;
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
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }
    async RemoveIamRole(node) {
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.IAMRole || !node.Region || !node.IamRole) {
            return;
        }
        this.treeDataProvider.RemoveIamRole(node.Region, node.IamRole);
    }
    LoadPermissions(node) { }
    LoadTrustRelationships(node) { }
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
exports.IamService = IamService;
//# sourceMappingURL=IamService.js.map