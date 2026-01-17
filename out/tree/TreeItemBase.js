"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeItemBase = void 0;
const vscode = require("vscode");
class TreeItemBase extends vscode.TreeItem {
    constructor(label, parent) {
        super(label);
        // Set parent and add this item to the parent's children
        this.Parent = parent || null;
        if (this.Parent) {
            this.Parent.Children.push(this);
        }
    }
    IsFavorite = false;
    IsHidden = false;
    Parent = null;
    Children = [];
    Icon = "";
    IsRunning = false;
}
exports.TreeItemBase = TreeItemBase;
//# sourceMappingURL=TreeItemBase.js.map