"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3TreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
class S3TreeItem extends WorkbenchTreeItem_1.WorkbenchTreeItem {
    TreeItemType;
    Text;
    Bucket;
    Shortcut;
    // flag accessors inherited from WorkbenchTreeItem
    constructor(text, treeItemType) {
        super(text);
        this.Text = text;
        this.TreeItemType = treeItemType;
        this.refreshUI();
    }
    setContextValue() {
        let contextValue = "#Type:S3#";
        contextValue += this.IsFav ? "Fav#" : "!Fav#";
        contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
        contextValue += this.TreeItemType === TreeItemType_1.TreeItemType.S3Bucket ? "Bucket#" : "";
        contextValue += this.TreeItemType === TreeItemType_1.TreeItemType.S3Shortcut ? "Shortcut#" : "";
        contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";
        this.contextValue = contextValue;
    }
    refreshUI() {
        if (this.TreeItemType === TreeItemType_1.TreeItemType.S3Bucket) {
            this.iconPath = new vscode.ThemeIcon('package');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.S3Shortcut) {
            this.iconPath = new vscode.ThemeIcon('file-symlink-directory');
        }
        else {
            this.iconPath = new vscode.ThemeIcon('circle-outline');
        }
        this.setContextValue();
    }
}
exports.S3TreeItem = S3TreeItem;
//# sourceMappingURL=S3TreeItem.js.map