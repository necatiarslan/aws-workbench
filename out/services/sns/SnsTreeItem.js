"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnsTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
class SnsTreeItem extends vscode.TreeItem {
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
    TopicArn = "";
    TopicName = "";
    Region = "";
    Parent;
    Children = [];
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