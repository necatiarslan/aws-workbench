"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeProvider = void 0;
const vscode = require("vscode");
const NodeBase_1 = require("./NodeBase");
class TreeProvider {
    static Current;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    constructor() {
        TreeProvider.Current = this;
    }
    Refresh(node) {
        this._onDidChangeTreeData.fire(node?.Parent || undefined);
    }
    getTreeItem(node) {
        return node;
    }
    async getChildren(node) {
        if (node && !node.IsOnNodeLoadChildrenCalled) {
            await node?.NodeLoadChildren();
        }
        if (node && node.Children) {
            return node.Children.filter(child => child.IsVisible);
        }
        return NodeBase_1.NodeBase.RootNodes.filter(rootNode => rootNode.IsVisible);
    }
}
exports.TreeProvider = TreeProvider;
//# sourceMappingURL=TreeProvider.js.map