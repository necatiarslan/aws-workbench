"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkbenchTreeItem = void 0;
const vscode = require("vscode");
class WorkbenchTreeItem extends vscode.TreeItem {
    serviceId;
    itemData;
    constructor(label, collapsibleState, serviceId, contextValue, itemData) {
        super(label, collapsibleState);
        this.serviceId = serviceId;
        this.contextValue = contextValue;
        this.itemData = itemData;
    }
}
exports.WorkbenchTreeItem = WorkbenchTreeItem;
//# sourceMappingURL=WorkbenchTreeItem.js.map