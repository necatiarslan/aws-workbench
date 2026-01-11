"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnsTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
class SnsTreeItem extends WorkbenchTreeItem_1.WorkbenchTreeItem {
    // flag accessors inherited from WorkbenchTreeItem
    TreeItemType;
    Text;
    TopicArn = "";
    TopicName = "";
    Region = "";
    // Parent/Children provided by WorkbenchTreeItem
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
    setContextValue() {
        let contextValue = "#Type:SNS#";
        contextValue += this.IsFav ? "Fav#" : "!Fav#";
        contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
        contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";
        if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSTopic) {
            contextValue += "Topic#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSPublishGroup) {
            contextValue += "PublishGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSPublishAdhoc) {
            contextValue += "PublishAdhoc#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSPublishFile) {
            contextValue += "PublishFile#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSSubscriptionGroup) {
            contextValue += "SubscriptionGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSSubscription) {
            contextValue += "Subscription#";
        }
        else {
            contextValue += "Other#";
        }
        this.contextValue = contextValue;
    }
    refreshUI() {
        if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSTopic) {
            this.iconPath = new vscode.ThemeIcon('package'); // inbox
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSPublishGroup) {
            this.iconPath = new vscode.ThemeIcon('send');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSPublishAdhoc) {
            this.iconPath = new vscode.ThemeIcon('report');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSPublishFile) {
            this.iconPath = new vscode.ThemeIcon('mail');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSSubscriptionGroup) {
            this.iconPath = new vscode.ThemeIcon('organization');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SNSSubscription) {
            this.iconPath = new vscode.ThemeIcon('person');
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
exports.SnsTreeItem = SnsTreeItem;
//# sourceMappingURL=SnsTreeItem.js.map