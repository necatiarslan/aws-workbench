"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepfunctionsService = void 0;
const vscode = require("vscode");
const StepFuncTreeView_1 = require("./step/StepFuncTreeView");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
class StepfunctionsService {
    serviceId = 'stepfunctions';
    treeView;
    constructor(context) {
        this.treeView = new StepFuncTreeView_1.StepFuncTreeView(context);
    }
    registerCommands(context, treeProvider) {
        // Commands are registered by the internal activate()
    }
    async getRootNodes() {
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
    }
}
exports.StepfunctionsService = StepfunctionsService;
//# sourceMappingURL=StepfunctionsService.js.map