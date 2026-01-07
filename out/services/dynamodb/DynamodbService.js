"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamodbService = void 0;
const vscode = require("vscode");
const DynamodbTreeView_1 = require("./dynamodb/DynamodbTreeView");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
class DynamodbService {
    serviceId = 'dynamodb';
    treeView;
    constructor(context) {
        this.treeView = new DynamodbTreeView_1.DynamodbTreeView(context);
    }
    registerCommands(context, treeProvider) {
        // Commands are registered by the internal activate() or we can add them here
    }
    async getRootNodes() {
        const nodes = this.treeView.treeDataProvider.GetDynamodbNodes();
        return nodes.map(n => this.mapToWorkbenchItem(n));
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
        await this.treeView.AddDynamodb();
    }
}
exports.DynamodbService = DynamodbService;
//# sourceMappingURL=DynamodbService.js.map