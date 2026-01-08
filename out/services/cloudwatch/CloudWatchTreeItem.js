"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudWatchTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
class CloudWatchTreeItem extends vscode.TreeItem {
    TreeItemType;
    Text;
    Region;
    LogGroup;
    LogStream;
    DetailValue;
    DateFilter;
    Parent;
    Children = [];
    _profileToShow = "";
    _isHidden = false;
    _isFav = false;
    _isPinned = false;
    get IsFav() {
        return this._isFav;
    }
    set IsFav(value) {
        this._isFav = value;
        this.setContextValue();
    }
    get IsHidden() {
        return this._isHidden;
    }
    set IsHidden(value) {
        this._isHidden = value;
        this.setContextValue();
    }
    get ProfileToShow() {
        return this._profileToShow;
    }
    set ProfileToShow(value) {
        this._profileToShow = value;
        this.setContextValue();
    }
    get IsPinned() {
        return this._isPinned;
    }
    set IsPinned(value) {
        this._isPinned = value;
        this.setContextValue();
    }
    constructor(text, treeItemType) {
        super(text);
        this.Text = text;
        this.TreeItemType = treeItemType;
        this.refreshUI();
    }
    setContextValue() {
        let contextValue = "#";
        contextValue += this.IsFav ? "Fav#" : "!Fav#";
        contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
        contextValue += this.IsPinned ? "Pinned#" : "NotPinned#";
        contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";
        switch (this.TreeItemType) {
            case TreeItemType_1.TreeItemType.CloudWatchRegion:
                contextValue += "Region#";
                break;
            case TreeItemType_1.TreeItemType.CloudWatchLogGroup:
                contextValue += "LogGroup#";
                break;
            case TreeItemType_1.TreeItemType.CloudWatchLogStream:
                contextValue += "LogStream#";
                break;
            case TreeItemType_1.TreeItemType.CloudWatchInfo:
                contextValue += "Info#";
                break;
            case TreeItemType_1.TreeItemType.CloudWatchInfoDetail:
                contextValue += "InfoDetail#";
                break;
            case TreeItemType_1.TreeItemType.CloudWatchToday:
                contextValue += "Today#";
                break;
            case TreeItemType_1.TreeItemType.CloudWatchYesterday:
                contextValue += "Yesterday#";
                break;
            case TreeItemType_1.TreeItemType.CloudWatchHistory:
                contextValue += "History#";
                break;
            case TreeItemType_1.TreeItemType.CloudWatchRefreshAction:
                contextValue += "RefreshAction#";
                break;
        }
        this.contextValue = contextValue;
    }
    refreshUI() {
        if (this.TreeItemType === TreeItemType_1.TreeItemType.CloudWatchRegion) {
            this.iconPath = new vscode.ThemeIcon('globe');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.CloudWatchLogGroup) {
            this.iconPath = new vscode.ThemeIcon('folder');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.CloudWatchInfo) {
            this.iconPath = new vscode.ThemeIcon('info');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.CloudWatchInfoDetail) {
            this.iconPath = new vscode.ThemeIcon('circle-filled');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.CloudWatchToday || this.TreeItemType === TreeItemType_1.TreeItemType.CloudWatchYesterday || this.TreeItemType === TreeItemType_1.TreeItemType.CloudWatchHistory) {
            this.iconPath = new vscode.ThemeIcon('calendar');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.CloudWatchRefreshAction) {
            this.iconPath = new vscode.ThemeIcon('refresh');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.CloudWatchLogStream) {
            this.iconPath = new vscode.ThemeIcon('output');
        }
        else {
            this.iconPath = new vscode.ThemeIcon('circle-outline');
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
            if (n.Text.includes(FilterString)) {
                return true;
            }
            else if (n.Children.length > 0) {
                return this.IsFilterStringMatchAnyChildren(n, FilterString);
            }
        }
        return false;
    }
}
exports.CloudWatchTreeItem = CloudWatchTreeItem;
//# sourceMappingURL=CloudWatchTreeItem.js.map