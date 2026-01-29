"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSSendGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const uuid_1 = require("uuid");
const TreeState_1 = require("../tree/TreeState");
const SQSSendAdhocNode_1 = require("./SQSSendAdhocNode");
const SQSSendFileNode_1 = require("./SQSSendFileNode");
const SQSQueueNode_1 = require("./SQSQueueNode");
class SQSSendGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "send";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        // Attach event handlers
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.LoadDefaultChildren();
        this.SetContextValue();
    }
    async LoadDefaultChildren() {
        new SQSSendAdhocNode_1.SQSSendAdhocNode("Adhoc", this);
        // Load any saved message files from parent queue node
        const queueNode = this.GetQueueNode();
        if (queueNode && queueNode.MessageFiles) {
            for (const file of queueNode.MessageFiles) {
                new SQSSendFileNode_1.SQSSendFileNode(file.path, this, file.id);
            }
        }
    }
    GetQueueNode() {
        if (this.Parent instanceof SQSQueueNode_1.SQSQueueNode) {
            return this.Parent;
        }
        return undefined;
    }
    async handleNodeAdd() {
        ui.logToOutput('SQSSendGroupNode.handleNodeAdd Started');
        const options = {
            canSelectMany: false,
            openLabel: 'Select Message File',
            filters: {
                'JSON Files': ['json'],
                'Text Files': ['txt'],
                'All Files': ['*']
            }
        };
        const fileUri = await vscode.window.showOpenDialog(options);
        if (!fileUri || fileUri.length === 0) {
            return;
        }
        const filePath = fileUri[0].fsPath;
        const queueNode = this.GetQueueNode();
        if (queueNode) {
            const id = (0, uuid_1.v4)();
            queueNode.MessageFiles.push({ id, path: filePath });
            new SQSSendFileNode_1.SQSSendFileNode(filePath, this, id);
            TreeState_1.TreeState.save();
        }
    }
}
exports.SQSSendGroupNode = SQSSendGroupNode;
//# sourceMappingURL=SQSSendGroupNode.js.map