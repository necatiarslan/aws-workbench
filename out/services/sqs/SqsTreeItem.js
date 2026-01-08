"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeItemType = exports.SqsTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
class SqsTreeItem extends vscode.TreeItem {
    IsFav = false;
    TreeItemType;
    Text;
    QueueArn = "";
    QueueName = "";
    Region = "";
    Parent;
    Children = [];
    IsHidden = false;
    MessageFilePath;
    IsRunning = false;
    MessageId;
    ReceiptHandle;
    Body;
    constructor(text, treeItemType) {
        super(text);
        this.Text = text;
        this.TreeItemType = treeItemType;
        this.refreshUI();
    }
    refreshUI() {
        if (this.TreeItemType === TreeItemType.Queue) {
            this.iconPath = new vscode.ThemeIcon('package'); // inbox
            this.contextValue = "Queue";
        }
        else if (this.TreeItemType === TreeItemType.PublishGroup) {
            this.iconPath = new vscode.ThemeIcon('send');
            this.contextValue = "PublishGroup";
        }
        else if (this.TreeItemType === TreeItemType.PublishAdhoc) {
            this.iconPath = new vscode.ThemeIcon('report');
            this.contextValue = "PublishAdhoc";
        }
        else if (this.TreeItemType === TreeItemType.PublishFile) {
            this.iconPath = new vscode.ThemeIcon('mail');
            this.contextValue = "PublishFile";
        }
        else if (this.TreeItemType === TreeItemType.ReceiveGroup) {
            this.iconPath = new vscode.ThemeIcon('inbox');
            this.contextValue = "ReceiveGroup";
        }
        else if (this.TreeItemType === TreeItemType.ReceivedMessage) {
            this.iconPath = new vscode.ThemeIcon('mail');
            this.contextValue = "ReceivedMessage";
        }
        else if (this.TreeItemType === TreeItemType.DeletedMessage) {
            this.iconPath = new vscode.ThemeIcon('mail-read');
            this.contextValue = "DeletedMessage";
        }
        else if (this.TreeItemType === TreeItemType.Policy) {
            this.iconPath = new vscode.ThemeIcon('shield');
            this.contextValue = "Policy";
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
            if (n.Text.includes(FilterString) || n.Region?.includes(FilterString) || n.QueueArn?.includes(FilterString)) {
                return true;
            }
            else if (n.Children.length > 0) {
                return this.IsFilterStringMatchAnyChildren(n, FilterString);
            }
        }
        return false;
    }
}
exports.SqsTreeItem = SqsTreeItem;
var TreeItemType;
(function (TreeItemType) {
    TreeItemType[TreeItemType["Queue"] = 1] = "Queue";
    TreeItemType[TreeItemType["PublishGroup"] = 2] = "PublishGroup";
    TreeItemType[TreeItemType["PublishAdhoc"] = 3] = "PublishAdhoc";
    TreeItemType[TreeItemType["PublishFile"] = 4] = "PublishFile";
    TreeItemType[TreeItemType["ReceiveGroup"] = 5] = "ReceiveGroup";
    TreeItemType[TreeItemType["ReceivedMessage"] = 6] = "ReceivedMessage";
    TreeItemType[TreeItemType["DetailGroup"] = 7] = "DetailGroup";
    TreeItemType[TreeItemType["DetailItem"] = 8] = "DetailItem";
    TreeItemType[TreeItemType["Policy"] = 9] = "Policy";
    TreeItemType[TreeItemType["DeletedMessage"] = 10] = "DeletedMessage";
    TreeItemType[TreeItemType["Other"] = 99] = "Other";
})(TreeItemType || (exports.TreeItemType = TreeItemType = {}));
//# sourceMappingURL=SqsTreeItem.js.map