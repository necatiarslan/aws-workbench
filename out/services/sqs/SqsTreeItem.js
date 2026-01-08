"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqsTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
class SqsTreeItem extends vscode.TreeItem {
    _isFav = false;
    _isHidden = false;
    _profileToShow = "";
    set ProfileToShow(value) {
        this._profileToShow = value;
        this.setContextValue();
    }
    get ProfileToShow() {
        return this._profileToShow;
    }
    set IsHidden(value) {
        this._isHidden = value;
        this.setContextValue();
    }
    get IsHidden() {
        return this._isHidden;
    }
    set IsFav(value) {
        this._isFav = value;
        this.setContextValue();
    }
    get IsFav() {
        return this._isFav;
    }
    TreeItemType;
    Text;
    QueueArn = "";
    QueueName = "";
    Region = "";
    Parent;
    Children = [];
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
    setContextValue() {
        let contextValue = "#Type:SQS#";
        contextValue += this.IsFav ? "Fav#" : "!Fav#";
        contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
        contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";
        if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSQueue) {
            contextValue += "Queue#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSPublishGroup) {
            contextValue += "PublishGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSPublishAdhoc) {
            contextValue += "PublishAdhoc#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSPublishFile) {
            contextValue += "PublishFile#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSReceiveGroup) {
            contextValue += "ReceiveGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSReceivedMessage) {
            contextValue += "ReceivedMessage#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSDeletedMessage) {
            contextValue += "DeletedMessage#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSPolicy) {
            contextValue += "Policy#";
        }
        else {
            contextValue += "Other#";
        }
        this.contextValue = contextValue;
    }
    refreshUI() {
        if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSQueue) {
            this.iconPath = new vscode.ThemeIcon('package'); // inbox
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSPublishGroup) {
            this.iconPath = new vscode.ThemeIcon('send');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSPublishAdhoc) {
            this.iconPath = new vscode.ThemeIcon('report');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSPublishFile) {
            this.iconPath = new vscode.ThemeIcon('mail');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSReceiveGroup) {
            this.iconPath = new vscode.ThemeIcon('inbox');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSReceivedMessage) {
            this.iconPath = new vscode.ThemeIcon('mail');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSDeletedMessage) {
            this.iconPath = new vscode.ThemeIcon('mail-read');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.SQSPolicy) {
            this.iconPath = new vscode.ThemeIcon('shield');
        }
        else {
            this.iconPath = new vscode.ThemeIcon('circle-outline');
        }
        if (this.IsRunning) {
            this.iconPath = new vscode.ThemeIcon('loading~spin');
        }
        this.setContextValue();
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