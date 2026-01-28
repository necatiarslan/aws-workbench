"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineExecutionsGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const StateMachineExecutionStatusGroupNode_1 = require("./StateMachineExecutionStatusGroupNode");
class StateMachineExecutionsGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "history";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        this.SetContextValue();
    }
    async handleLoadChildren() {
        // Create sub-groups for different execution statuses
        if (this.Children.length === 0) {
            new StateMachineExecutionStatusGroupNode_1.StateMachineExecutionStatusGroupNode("All", this, undefined);
            new StateMachineExecutionStatusGroupNode_1.StateMachineExecutionStatusGroupNode("Running", this, "RUNNING");
            new StateMachineExecutionStatusGroupNode_1.StateMachineExecutionStatusGroupNode("Succeeded", this, "SUCCEEDED");
            new StateMachineExecutionStatusGroupNode_1.StateMachineExecutionStatusGroupNode("Failed", this, "FAILED");
            new StateMachineExecutionStatusGroupNode_1.StateMachineExecutionStatusGroupNode("Timed Out", this, "TIMED_OUT");
            new StateMachineExecutionStatusGroupNode_1.StateMachineExecutionStatusGroupNode("Aborted", this, "ABORTED");
        }
    }
    async handleNodeRefresh() {
        // Clear and reload children
        this.Children = [];
        this.IsOnNodeLoadChildrenCalled = false;
        await this.handleLoadChildren();
    }
}
exports.StateMachineExecutionsGroupNode = StateMachineExecutionsGroupNode;
//# sourceMappingURL=StateMachineExecutionsGroupNode.js.map