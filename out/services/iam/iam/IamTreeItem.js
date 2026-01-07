"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeItemType = exports.IamTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
class IamTreeItem extends vscode.TreeItem {
    IsFav = false;
    TreeItemType;
    Text;
    IamRole = "";
    Region = "";
    Parent;
    Children = [];
    IsHidden = false;
    TagKey;
    TagValue;
    InfoKey;
    InfoValue;
    PolicyName;
    PolicyArn;
    PolicyDocument;
    TrustEntity;
    IsRunning = false;
    constructor(text, treeItemType) {
        super(text);
        this.Text = text;
        this.TreeItemType = treeItemType;
        this.refreshUI();
    }
    refreshUI() {
        if (this.TreeItemType === TreeItemType.IamRole) {
            this.iconPath = new vscode.ThemeIcon('shield');
            this.contextValue = "IamRole";
        }
        else if (this.TreeItemType === TreeItemType.PermissionsGroup) {
            this.iconPath = new vscode.ThemeIcon('lock');
            this.contextValue = "PermissionsGroup";
        }
        else if (this.TreeItemType === TreeItemType.Permission) {
            this.iconPath = new vscode.ThemeIcon('key');
            this.contextValue = "Permission";
        }
        else if (this.TreeItemType === TreeItemType.TrustRelationshipsGroup) {
            this.iconPath = new vscode.ThemeIcon('references');
            this.contextValue = "TrustRelationshipsGroup";
        }
        else if (this.TreeItemType === TreeItemType.TrustRelationship) {
            this.iconPath = new vscode.ThemeIcon('person');
            this.contextValue = "TrustRelationship";
        }
        else if (this.TreeItemType === TreeItemType.TagsGroup) {
            this.iconPath = new vscode.ThemeIcon('tag');
            this.contextValue = "TagsGroup";
        }
        else if (this.TreeItemType === TreeItemType.Tag) {
            this.iconPath = new vscode.ThemeIcon('tag');
            this.contextValue = "Tag";
        }
        else if (this.TreeItemType === TreeItemType.InfoGroup) {
            this.iconPath = new vscode.ThemeIcon('info');
            this.contextValue = "InfoGroup";
        }
        else if (this.TreeItemType === TreeItemType.InfoItem) {
            this.iconPath = new vscode.ThemeIcon('symbol-property');
            this.contextValue = "InfoItem";
        }
        else {
            this.iconPath = new vscode.ThemeIcon('circle-outline');
            this.contextValue = "Other";
        }
        if (this.IsRunning) {
            this.iconPath = new vscode.ThemeIcon('loading~spin');
        }
    }
    IsAnyChidrenFav() {
        return this.IsAnyChidrenFavInternal(this);
    }
    IsAnyChidrenFavInternal(node) {
        for (var n of node.Children) {
            if (n.IsFav) {
                return true;
            }
            else if (n.Children.length > 0) {
                return this.IsAnyChidrenFavInternal(n);
            }
        }
        return false;
    }
    IsFilterStringMatch(FilterString) {
        if (this.Text.includes(FilterString)) {
            return true;
        }
        if (this.IsFilterStringMatchAnyChildren(this, FilterString)) {
            return true;
        }
        return false;
    }
    IsFilterStringMatchAnyChildren(node, FilterString) {
        for (var n of node.Children) {
            if (n.Text.includes(FilterString) || n.Region?.includes(FilterString) || n.IamRole?.includes(FilterString)) {
                return true;
            }
            else if (n.Children.length > 0) {
                return this.IsFilterStringMatchAnyChildren(n, FilterString);
            }
        }
        return false;
    }
}
exports.IamTreeItem = IamTreeItem;
var TreeItemType;
(function (TreeItemType) {
    TreeItemType[TreeItemType["IamRole"] = 1] = "IamRole";
    TreeItemType[TreeItemType["PermissionsGroup"] = 2] = "PermissionsGroup";
    TreeItemType[TreeItemType["Permission"] = 3] = "Permission";
    TreeItemType[TreeItemType["TrustRelationshipsGroup"] = 4] = "TrustRelationshipsGroup";
    TreeItemType[TreeItemType["TrustRelationship"] = 5] = "TrustRelationship";
    TreeItemType[TreeItemType["TagsGroup"] = 6] = "TagsGroup";
    TreeItemType[TreeItemType["Tag"] = 7] = "Tag";
    TreeItemType[TreeItemType["InfoGroup"] = 8] = "InfoGroup";
    TreeItemType[TreeItemType["InfoItem"] = 9] = "InfoItem";
})(TreeItemType || (exports.TreeItemType = TreeItemType = {}));
//# sourceMappingURL=IamTreeItem.js.map