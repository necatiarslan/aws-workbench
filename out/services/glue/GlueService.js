"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueService = void 0;
const vscode = require("vscode");
const GlueTreeView_1 = require("./glue/GlueTreeView");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
class GlueService {
    serviceId = 'glue';
    treeView;
    constructor(context) {
        this.treeView = new GlueTreeView_1.GlueTreeView(context);
    }
    registerCommands(context, treeProvider) {
        // Commands are registered by the internal activate() or we can add them here
    }
    async getRootNodes() {
        const nodes = await this.treeView.treeDataProvider.getChildren(undefined);
        return nodes.map((n) => this.mapToWorkbenchItem(n));
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
        await this.treeView.AddGlueJob();
    }
}
exports.GlueService = GlueService;
//# sourceMappingURL=GlueService.js.map