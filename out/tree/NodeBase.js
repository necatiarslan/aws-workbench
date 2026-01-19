"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeBase = void 0;
const vscode = require("vscode");
const TreeProvider_1 = require("./TreeProvider");
const Session_1 = require("../common/Session");
class NodeBase extends vscode.TreeItem {
    static RootNodes = [];
    constructor(label, parent) {
        super(label);
        this.id = Date.now().toString();
        // Set parent and add this item to the parent's children
        this.Parent = parent || undefined;
        if (this.Parent) {
            this.Parent.Children.push(this);
            this.Parent.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        else {
            NodeBase.RootNodes.push(this);
        }
        this.SetContextValue();
        TreeProvider_1.TreeProvider.Current.Refresh(this);
    }
    _isFavorite = false;
    _isHidden = false;
    Parent = undefined;
    Children = [];
    _icon = "";
    _awsProfile = "";
    IsVisible = true;
    SetVisible() {
        let result = true;
        if (Session_1.Session.Current.IsShowOnlyFavorite && !this.IsFavorite) {
            result = false;
        }
        if (!Session_1.Session.Current.IsShowHiddenNodes && this.IsHidden) {
            result = false;
        }
        if (!Session_1.Session.Current.IsShowHiddenNodes && this.AwsProfile.length > 0 && this.AwsProfile !== Session_1.Session.Current.AwsProfile) {
            result = false;
        }
        if (Session_1.Session.Current.FilterString.length > 0) {
            const filter = Session_1.Session.Current.FilterString.toLowerCase();
            if (this.label && !this.label.toString().toLowerCase().includes(filter)) {
                result = false;
            }
        }
        this.IsVisible = result;
        if (this.Children.length > 0) {
            this.Children.forEach(child => {
                child.SetVisible();
            });
        }
        if (this.IsVisible && this.Parent) {
            this.Parent.IsVisible = true;
        }
    }
    get AwsProfile() {
        return this._awsProfile;
    }
    set AwsProfile(value) {
        this._awsProfile = value;
        this.SetContextValue();
    }
    SetContextValue() {
        let context = "node";
        context += "#AddToNode#Remove#";
        if (this.IsFavorite) {
            context += "#RemoveFav#";
        }
        else {
            context += "#AddFav#";
        }
        if (this.IsHidden) {
            context += "#UnHide#";
        }
        else {
            context += "#Hide#";
        }
        if (this.AwsProfile.length > 0) {
            context += "#ShowInAnyProfile#";
        }
        else {
            context += "#ShowOnlyInThisProfile#";
        }
        this.contextValue = context;
    }
    get HasChildren() {
        return this.Children.length > 0;
    }
    get IsHidden() {
        return this._isHidden;
    }
    set IsHidden(value) {
        this._isHidden = value;
        this.SetContextValue();
        TreeProvider_1.TreeProvider.Current.Refresh(this.Parent);
    }
    get IsFavorite() {
        return this._isFavorite;
    }
    set IsFavorite(value) {
        this._isFavorite = value;
        this.SetContextValue();
        TreeProvider_1.TreeProvider.Current.Refresh(this.Parent);
    }
    get Icon() {
        return this._icon;
    }
    set Icon(value) {
        this._icon = value;
        this.iconPath = new vscode.ThemeIcon(this._icon);
    }
    IsRunning = false;
    Remove() {
        if (this.Parent) {
            const index = this.Parent.Children.indexOf(this);
            if (index > -1) {
                this.Parent.Children.splice(index, 1);
                if (!this.Parent.HasChildren) {
                    this.Parent.collapsibleState = vscode.TreeItemCollapsibleState.None;
                }
            }
        }
        else {
            const index = NodeBase.RootNodes.indexOf(this);
            if (index > -1) {
                NodeBase.RootNodes.splice(index, 1);
            }
        }
        TreeProvider_1.TreeProvider.Current.Refresh(this.Parent);
    }
}
exports.NodeBase = NodeBase;
//# sourceMappingURL=NodeBase.js.map