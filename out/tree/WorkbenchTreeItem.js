"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkbenchTreeItem = void 0;
const vscode = require("vscode");
class WorkbenchTreeItem extends vscode.TreeItem {
    label;
    collapsibleState;
    serviceId;
    contextValue;
    itemData;
    constructor(label, collapsibleState, serviceId, contextValue, itemData) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.serviceId = serviceId;
        this.contextValue = contextValue;
        this.itemData = itemData;
    }
}
exports.WorkbenchTreeItem = WorkbenchTreeItem;
//# sourceMappingURL=WorkbenchTreeItem.js.map