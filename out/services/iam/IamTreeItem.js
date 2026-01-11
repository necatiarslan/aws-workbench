"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
class IamTreeItem extends WorkbenchTreeItem_1.WorkbenchTreeItem {
    // flag accessors inherited from WorkbenchTreeItem
    TreeItemType;
    Text;
    IamRole = "";
    Region = "";
    // Parent/Children provided by WorkbenchTreeItem
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
    setContextValue() {
        let contextValue = "#Type:IAM#";
        contextValue += this.IsFav ? "Fav#" : "!Fav#";
        contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
        contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";
        if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMRole) {
            contextValue += "IamRole#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMPermissionsGroup) {
            contextValue += "PermissionsGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMPermission) {
            contextValue += "Permission#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMTrustRelationshipsGroup) {
            contextValue += "TrustRelationshipsGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMTrustRelationship) {
            contextValue += "TrustRelationship#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMTagsGroup) {
            contextValue += "TagsGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMTag) {
            contextValue += "Tag#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMInfoGroup) {
            contextValue += "InfoGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMInfoItem) {
            contextValue += "InfoItem#";
        }
        else {
            contextValue += "Other#";
        }
        this.contextValue = contextValue;
    }
    refreshUI() {
        if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMRole) {
            this.iconPath = new vscode.ThemeIcon('shield');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMPermissionsGroup) {
            this.iconPath = new vscode.ThemeIcon('lock');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMPermission) {
            this.iconPath = new vscode.ThemeIcon('key');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMTrustRelationshipsGroup) {
            this.iconPath = new vscode.ThemeIcon('references');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMTrustRelationship) {
            this.iconPath = new vscode.ThemeIcon('person');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMTagsGroup) {
            this.iconPath = new vscode.ThemeIcon('tag');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMTag) {
            this.iconPath = new vscode.ThemeIcon('tag');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMInfoGroup) {
            this.iconPath = new vscode.ThemeIcon('info');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.IAMInfoItem) {
            this.iconPath = new vscode.ThemeIcon('symbol-property');
        }
        else {
            this.iconPath = new vscode.ThemeIcon('circle-outline');
        }
        if (this.IsRunning) {
            this.iconPath = new vscode.ThemeIcon('loading~spin');
        }
        this.setContextValue();
    }
}
exports.IamTreeItem = IamTreeItem;
//# sourceMappingURL=IamTreeItem.js.map