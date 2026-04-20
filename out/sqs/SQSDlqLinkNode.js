"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSDlqLinkNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
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
            this.RefreshTree();
            ui.showInfoMessage(`Found DLQ: ${dlqNode.label}`);
        }
        else {
            // DLQ not in tree, show info with ARN
            const action = await vscode.window.showInformationMessage(`Dead Letter Queue: ${this.DlqArn}`, 'Copy ARN');
            if (action === 'Copy ARN') {
                ui.CopyToClipboard(this.DlqArn);
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