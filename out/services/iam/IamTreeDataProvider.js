"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewType = exports.IamTreeDataProvider = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const IamTreeItem_1 = require("./IamTreeItem");
const IamService_1 = require("./IamService");
class IamTreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    IamRoleNodeList = [];
    constructor() {
    }
    Refresh() {
        if (this.IamRoleNodeList.length === 0) {
            this.LoadIamRoleNodeList();
        }
        this._onDidChangeTreeData.fire();
    }
    AddIamRole(Region, IamRole) {
        for (var item of IamService_1.IamService.Instance.IamRoleList) {
            if (item.Region === Region && item.IamRole === IamRole) {
                return this.IamRoleNodeList.find(n => n.Region === Region && n.IamRole === IamRole);
            }
        }
        IamService_1.IamService.Instance.IamRoleList.push({ Region: Region, IamRole: IamRole });
        const node = this.AddNewIamRoleNode(Region, IamRole);
        this.Refresh();
        return node;
    }
    RemoveIamRole(Region, IamRole) {
        for (var i = 0; i < IamService_1.IamService.Instance.IamRoleList.length; i++) {
            if (IamService_1.IamService.Instance.IamRoleList[i].Region === Region && IamService_1.IamService.Instance.IamRoleList[i].IamRole === IamRole) {
                IamService_1.IamService.Instance.IamRoleList.splice(i, 1);
                break;
            }
        }
        this.RemoveIamRoleNode(Region, IamRole);
        this.Refresh();
    }
    LoadIamRoleNodeList() {
        this.IamRoleNodeList = [];
        if (!IamService_1.IamService.Instance)
            return;
        for (var item of IamService_1.IamService.Instance.IamRoleList) {
            let treeItem = this.NewIamRoleNode(item.Region, item.IamRole);
            this.IamRoleNodeList.push(treeItem);
        }
    }
    AddNewIamRoleNode(Region, IamRole) {
        if (this.IamRoleNodeList.some(item => item.Region === Region && item.IamRole === IamRole)) {
            return this.IamRoleNodeList.find(n => n.Region === Region && n.IamRole === IamRole);
        }
        let treeItem = this.NewIamRoleNode(Region, IamRole);
        this.IamRoleNodeList.push(treeItem);
        return treeItem;
    }
    RemoveIamRoleNode(Region, IamRole) {
        for (var i = 0; i < this.IamRoleNodeList.length; i++) {
            if (this.IamRoleNodeList[i].Region === Region && this.IamRoleNodeList[i].IamRole === IamRole) {
                this.IamRoleNodeList.splice(i, 1);
                break;
            }
        }
    }
    NewIamRoleNode(Region, IamRole) {
        let treeItem = new IamTreeItem_1.IamTreeItem(IamRole, IamTreeItem_1.TreeItemType.IamRole);
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        treeItem.Region = Region;
        treeItem.IamRole = IamRole;
        // Add Permissions Group
        let permissionsItem = new IamTreeItem_1.IamTreeItem("Permissions", IamTreeItem_1.TreeItemType.PermissionsGroup);
        permissionsItem.IamRole = treeItem.IamRole;
        permissionsItem.Region = treeItem.Region;
        permissionsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        permissionsItem.Parent = treeItem;
        treeItem.Children.push(permissionsItem);
        // Add Trust Relationships Group
        let trustItem = new IamTreeItem_1.IamTreeItem("Trust Relationships", IamTreeItem_1.TreeItemType.TrustRelationshipsGroup);
        trustItem.IamRole = treeItem.IamRole;
        trustItem.Region = treeItem.Region;
        trustItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        trustItem.Parent = treeItem;
        treeItem.Children.push(trustItem);
        // Add Tags Group
        let tagsItem = new IamTreeItem_1.IamTreeItem("Tags", IamTreeItem_1.TreeItemType.TagsGroup);
        tagsItem.IamRole = treeItem.IamRole;
        tagsItem.Region = treeItem.Region;
        tagsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        tagsItem.Parent = treeItem;
        treeItem.Children.push(tagsItem);
        // Add Info Group
        let infoItem = new IamTreeItem_1.IamTreeItem("Info", IamTreeItem_1.TreeItemType.InfoGroup);
        infoItem.IamRole = treeItem.IamRole;
        infoItem.Region = treeItem.Region;
        infoItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        infoItem.Parent = treeItem;
        treeItem.Children.push(infoItem);
        return treeItem;
    }
    getChildren(node) {
        let result = [];
        if (!node) {
            result.push(...this.GetIamRoleNodes());
        }
        else if (node.TreeItemType === IamTreeItem_1.TreeItemType.PermissionsGroup && node.Children.length === 0) {
            // Auto-load permissions when the node is expanded
            IamService_1.IamService.Instance.LoadPermissions(node);
        }
        else if (node.TreeItemType === IamTreeItem_1.TreeItemType.TrustRelationshipsGroup && node.Children.length === 0) {
            // Auto-load trust relationships when the node is expanded
            IamService_1.IamService.Instance.LoadTrustRelationships(node);
        }
        else if (node.TreeItemType === IamTreeItem_1.TreeItemType.TagsGroup && node.Children.length === 0) {
            // Auto-load tags when the node is expanded
            IamService_1.IamService.Instance.LoadTags(node);
        }
        else if (node.TreeItemType === IamTreeItem_1.TreeItemType.InfoGroup && node.Children.length === 0) {
            // Auto-load info when the node is expanded
            IamService_1.IamService.Instance.LoadInfo(node);
        }
        else if (node.Children.length > 0) {
            result.push(...node.Children);
        }
        return Promise.resolve(result);
    }
    GetIamRoleNodes() {
        var result = [];
        if (!IamService_1.IamService.Instance)
            return result;
        for (var node of this.IamRoleNodeList) {
            if (IamService_1.IamService.Instance.FilterString && !node.IsFilterStringMatch(IamService_1.IamService.Instance.FilterString)) {
                continue;
            }
            if (IamService_1.IamService.Instance.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (IamService_1.IamService.Instance.isShowHiddenNodes && (node.IsHidden)) {
                continue;
            }
            result.push(node);
        }
        return result;
    }
    getTreeItem(element) {
        return element;
    }
}
exports.IamTreeDataProvider = IamTreeDataProvider;
var ViewType;
(function (ViewType) {
    ViewType[ViewType["IamRole"] = 1] = "IamRole";
})(ViewType || (exports.ViewType = ViewType = {}));
//# sourceMappingURL=IamTreeDataProvider.js.map