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
    rootNodes = [];
    constructor(context) {
        this.context = context;
        this.loadRootNodes();
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        const service = ServiceManager_1.ServiceManager.Instance.getService(element.serviceId);
        if (service && element.itemData) {
            return service.getTreeItem(element);
        }
        return element;
    }
    async getChildren(element) {
        if (!element) {
            const services = ServiceManager_1.ServiceManager.Instance.getAllServices();
            const allRootNodes = [];
            for (const service of services) {
                const roots = await service.getRootNodes();
                allRootNodes.push(...roots);
            }
            return allRootNodes;
        }
        const service = ServiceManager_1.ServiceManager.Instance.getService(element.serviceId);
        if (service) {
            const children = await service.getChildren(element);
            return children;
        }
        return [];
    }
    loadRootNodes() {
        const savedNodes = this.context.globalState.get('workbench.rootNodes', []);
        this.rootNodes = savedNodes.map(n => new WorkbenchTreeItem_1.WorkbenchTreeItem(n.label, vscode.TreeItemCollapsibleState.Collapsed, n.serviceId, n.contextValue, n.itemData));
    }
    persistRootNodes() {
        const nodesToSave = this.rootNodes.map(n => ({
            label: n.label,
            serviceId: n.serviceId,
            contextValue: n.contextValue,
            itemData: n.itemData
        }));
        this.context.globalState.update('workbench.rootNodes', nodesToSave);
    }
    addRootNode(node) {
        this.rootNodes.push(node);
        this.persistRootNodes();
        this.refresh();
    }
    removeRootNode(node) {
        this.rootNodes = this.rootNodes.filter(n => n !== node);
        this.persistRootNodes();
        this.refresh();
    }
}
exports.WorkbenchTreeProvider = WorkbenchTreeProvider;
//# sourceMappingURL=WorkbenchTreeProvider.js.map