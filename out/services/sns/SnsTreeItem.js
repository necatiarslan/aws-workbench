"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeItemType = exports.SnsTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
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
        if (this.TreeItemType === TreeItemType.Topic) {
            this.iconPath = new vscode.ThemeIcon('package'); // inbox
            this.contextValue = "Topic";
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
        else if (this.TreeItemType === TreeItemType.SubscriptionGroup) {
            this.iconPath = new vscode.ThemeIcon('organization');
            this.contextValue = "SubscriptionGroup";
        }
        else if (this.TreeItemType === TreeItemType.Subscription) {
            this.iconPath = new vscode.ThemeIcon('person');
            this.contextValue = "Subscription";
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
var TreeItemType;
(function (TreeItemType) {
    TreeItemType[TreeItemType["Topic"] = 1] = "Topic";
    TreeItemType[TreeItemType["PublishGroup"] = 2] = "PublishGroup";
    TreeItemType[TreeItemType["PublishAdhoc"] = 3] = "PublishAdhoc";
    TreeItemType[TreeItemType["PublishFile"] = 4] = "PublishFile";
    TreeItemType[TreeItemType["SubscriptionGroup"] = 5] = "SubscriptionGroup";
    TreeItemType[TreeItemType["Subscription"] = 6] = "Subscription";
    TreeItemType[TreeItemType["Other"] = 99] = "Other";
})(TreeItemType || (exports.TreeItemType = TreeItemType = {}));
//# sourceMappingURL=SnsTreeItem.js.map