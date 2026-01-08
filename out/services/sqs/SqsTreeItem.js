"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqsTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
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
        if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSQueue) {
            this.iconPath = new vscode.ThemeIcon('package'); // inbox
            this.contextValue = "Queue";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSPublishGroup) {
            this.iconPath = new vscode.ThemeIcon('send');
            this.contextValue = "PublishGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSPublishAdhoc) {
            this.iconPath = new vscode.ThemeIcon('report');
            this.contextValue = "PublishAdhoc";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSPublishFile) {
            this.iconPath = new vscode.ThemeIcon('mail');
            this.contextValue = "PublishFile";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSReceiveGroup) {
            this.iconPath = new vscode.ThemeIcon('inbox');
            this.contextValue = "ReceiveGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSReceivedMessage) {
            this.iconPath = new vscode.ThemeIcon('mail');
            this.contextValue = "ReceivedMessage";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSDeletedMessage) {
            this.iconPath = new vscode.ThemeIcon('mail-read');
            this.contextValue = "DeletedMessage";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSPolicy) {
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
//# sourceMappingURL=SqsTreeItem.js.map