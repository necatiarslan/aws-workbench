"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
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
        if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMRole) {
            this.iconPath = new vscode.ThemeIcon('shield');
            this.contextValue = "IamRole";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMPermissionsGroup) {
            this.iconPath = new vscode.ThemeIcon('lock');
            this.contextValue = "PermissionsGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMPermission) {
            this.iconPath = new vscode.ThemeIcon('key');
            this.contextValue = "Permission";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMTrustRelationshipsGroup) {
            this.iconPath = new vscode.ThemeIcon('references');
            this.contextValue = "TrustRelationshipsGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMTrustRelationship) {
            this.iconPath = new vscode.ThemeIcon('person');
            this.contextValue = "TrustRelationship";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMTagsGroup) {
            this.iconPath = new vscode.ThemeIcon('tag');
            this.contextValue = "TagsGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMTag) {
            this.iconPath = new vscode.ThemeIcon('tag');
            this.contextValue = "Tag";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMInfoGroup) {
            this.iconPath = new vscode.ThemeIcon('info');
            this.contextValue = "InfoGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMInfoItem) {
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
//# sourceMappingURL=IamTreeItem.js.map