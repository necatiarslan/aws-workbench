"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnsService = void 0;
const vscode = require("vscode");
const SnsTreeView_1 = require("./sns/SnsTreeView");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
class SnsService {
    serviceId = 'sns';
    treeView;
    constructor(context) {
        this.treeView = new SnsTreeView_1.SnsTreeView(context);
    }
    registerCommands(context, treeProvider) {
        // Commands are registered by the internal activate() or we can add them here
    }
    async getRootNodes() {
        // Most of these have a Get...Nodes method in their treeDataProvider
        // We'll need to adapt each one or use a common logic if available
        return [];
    }
    mapToWorkbenchItem(n) {
        return new WorkbenchTreeItem_1.WorkbenchTreeItem(typeof n.label === 'string' ? n.label : n.label?.label || '', n.collapsibleState || vscode.TreeItemCollapsibleState.None, this.serviceId, n.contextValue, n);
    }
    async getChildren(element) {
        if (!element) {
            return this.getRootNodes();
        }
        const internalItem = element.itemData;
        if (!internalItem)
            return [];
        const children = await this.treeView.treeDataProvider.getChildren(internalItem);
        return (children || []).map((child) => this.mapToWorkbenchItem(child));
    }
    async getTreeItem(element) {
        return element.itemData;
    }
    async addResource() {
        // Each service has a different "Add" method
    }
}
exports.SnsService = SnsService;
//# sourceMappingURL=SnsService.js.map