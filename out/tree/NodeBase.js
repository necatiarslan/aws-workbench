"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeBase = void 0;
const vscode = require("vscode");
const TreeProvider_1 = require("./TreeProvider");
class NodeBase extends vscode.TreeItem {
    static RootNodes = [];
    constructor(label, parent) {
        super(label);
        // Set parent and add this item to the parent's children
        this.Parent = parent || undefined;
        if (this.Parent) {
            this.Parent.Children.push(this);
            this.Parent.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        else {
            NodeBase.RootNodes.push(this);
        }
        TreeProvider_1.TreeProvider.Current.Refresh(this);
    }
    IsFavorite = false;
    IsHidden = false;
    Parent = undefined;
    Children = [];
    _icon = "";
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
                if (this.Parent.Children.length === 0) {
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