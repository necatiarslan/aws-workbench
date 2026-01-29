"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSDlqLinkNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const TreeProvider_1 = require("../tree/TreeProvider");
const SQSQueueNode_1 = require("./SQSQueueNode");
class SQSDlqLinkNode extends NodeBase_1.NodeBase {
    DlqArn = "";
    constructor(label, dlqArn, parent) {
        super(label, parent);
        this.Icon = "warning";
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.DlqArn = dlqArn;
        // Extract queue name from ARN for description
        const parts = dlqArn.split(':');
        const queueName = parts[parts.length - 1];
        this.description = queueName;
        // Attach event handlers
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.SetContextValue();
    }
    async handleNodeRun() {
        ui.logToOutput('SQSDlqLinkNode.handleNodeRun Started');
        // Try to find the DLQ in the tree and reveal it
        const dlqNode = this.findDlqInTree();
        if (dlqNode) {
            // Reveal the node in the tree
            TreeProvider_1.TreeProvider.Current?.Refresh();
            ui.showInfoMessage(`Found DLQ: ${dlqNode.label}`);
        }
        else {
            // DLQ not in tree, show info with ARN
            const action = await vscode.window.showInformationMessage(`Dead Letter Queue: ${this.DlqArn}`, 'Copy ARN');
            if (action === 'Copy ARN') {
                await vscode.env.clipboard.writeText(this.DlqArn);
                ui.showInfoMessage('DLQ ARN copied to clipboard');
            }
        }
    }
    findDlqInTree() {
        // Search through root nodes to find a queue with matching ARN
        for (const rootNode of NodeBase_1.NodeBase.RootNodes) {
            const found = this.searchNodeTree(rootNode);
            if (found) {
                return found;
            }
        }
        return undefined;
    }
    searchNodeTree(node) {
        if (node instanceof SQSQueueNode_1.SQSQueueNode && node.QueueArn === this.DlqArn) {
            return node;
        }
        for (const child of node.Children) {
            const found = this.searchNodeTree(child);
            if (found) {
                return found;
            }
        }
        return undefined;
    }
}
exports.SQSDlqLinkNode = SQSDlqLinkNode;
//# sourceMappingURL=SQSDlqLinkNode.js.map