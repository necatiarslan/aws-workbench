"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnsTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
class SnsTreeItem extends vscode.TreeItem {
    IsFav = false;
    TreeItemType;
    Text;
    TopicArn = "";
    TopicName = "";
    Region = "";
    Parent;
    Children = [];
    IsHidden = false;
    MessageFilePath;
    IsRunning = false;
    SubscriptionArn = "";
    Protocol = "";
    Endpoint = "";
    constructor(text, treeItemType) {
        super(text);
        this.Text = text;
        this.TreeItemType = treeItemType;
        this.refreshUI();
    }
    refreshUI() {
        if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSTopic) {
            this.iconPath = new vscode.ThemeIcon('package'); // inbox
            this.contextValue = "Topic";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSPublishGroup) {
            this.iconPath = new vscode.ThemeIcon('send');
            this.contextValue = "PublishGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSPublishAdhoc) {
            this.iconPath = new vscode.ThemeIcon('report');
            this.contextValue = "PublishAdhoc";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSPublishFile) {
            this.iconPath = new vscode.ThemeIcon('mail');
            this.contextValue = "PublishFile";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSSubscriptionGroup) {
            this.iconPath = new vscode.ThemeIcon('organization');
            this.contextValue = "SubscriptionGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSSubscription) {
            this.iconPath = new vscode.ThemeIcon('person');
            this.contextValue = "Subscription";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSOther) {
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
            if (n.Text.includes(FilterString) || n.Region?.includes(FilterString) || n.TopicArn?.includes(FilterString)) {
                return true;
            }
            else if (n.Children.length > 0) {
                return this.IsFilterStringMatchAnyChildren(n, FilterString);
            }
        }
        return false;
    }
}
exports.SnsTreeItem = SnsTreeItem;
//# sourceMappingURL=SnsTreeItem.js.map