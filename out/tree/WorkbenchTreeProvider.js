"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkbenchTreeProvider = void 0;
const vscode = require("vscode");
const ServiceManager_1 = require("../services/ServiceManager");
const WorkbenchTreeItem_1 = require("./WorkbenchTreeItem");
class WorkbenchTreeProvider {
    context;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    constructor(context) {
        this.context = context;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        const service = ServiceManager_1.ServiceManager.Instance.getService(element.serviceId);
        if (service && element.itemData) {
            try {
                return service.getTreeItem(element);
            }
            catch (error) {
                console.error(`Error getting tree item for ${element.label} (Service: ${element.serviceId}):`, error);
                const errorItem = new vscode.TreeItem(element.label || 'Error', vscode.TreeItemCollapsibleState.None);
                errorItem.description = 'Error loading item';
                errorItem.tooltip = error instanceof Error ? error.message : String(error);
                return errorItem;
            }
        }
        return element;
    }
    async getChildren(element) {
        if (!element) {
            const services = ServiceManager_1.ServiceManager.Instance.getAllServices();
            const allRootNodes = [];
            for (const service of services) {
                try {
                    const roots = await service.getRootNodes();
                    allRootNodes.push(...roots);
                }
                catch (error) {
                    console.error(`Error loading root nodes for service ${service.serviceId}:`, error);
                    // Optionally push an error node so the user knows this service failed
                    allRootNodes.push(new WorkbenchTreeItem_1.WorkbenchTreeItem(`${service.serviceId.toUpperCase()} (Error)`, vscode.TreeItemCollapsibleState.None, service.serviceId, 'error', { error }));
                }
            }
            return allRootNodes;
        }
        const service = ServiceManager_1.ServiceManager.Instance.getService(element.serviceId);
        if (service) {
            try {
                const children = await service.getChildren(element);
                return children;
            }
            catch (error) {
                console.error(`Error loading children for ${element.label} (Service: ${element.serviceId}):`, error);
                return [new WorkbenchTreeItem_1.WorkbenchTreeItem('Error loading children', vscode.TreeItemCollapsibleState.None, element.serviceId, 'error', { error })];
            }
        }
        return [];
    }
}
exports.WorkbenchTreeProvider = WorkbenchTreeProvider;
//# sourceMappingURL=WorkbenchTreeProvider.js.map