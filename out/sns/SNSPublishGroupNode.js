"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SNSPublishGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const TreeState_1 = require("../tree/TreeState");
const SNSPublishAdhocNode_1 = require("./SNSPublishAdhocNode");
const SNSPublishFileNode_1 = require("./SNSPublishFileNode");
const TreeProvider_1 = require("../tree/TreeProvider");
class SNSPublishGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "send";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        // Attach event handlers
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeLoaded.subscribe(() => this.handleNodeLoaded());
        this.LoadDefaultChildren();
        this.SetContextValue();
    }
    LoadDefaultChildren() {
        new SNSPublishAdhocNode_1.SNSPublishAdhocNode("Adhoc", this);
    }
    handleNodeLoaded() {
        // Restore message file nodes from parent's MessageFiles array
        const topicNode = this.Parent;
        if (topicNode && topicNode.MessageFiles) {
            for (const file of topicNode.MessageFiles) {
                new SNSPublishFileNode_1.SNSPublishFileNode(file.path, file.id, this);
            }
        }
    }
    async handleNodeAdd() {
        ui.logToOutput('SNSPublishGroupNode.handleNodeAdd Started');
        const selectedPath = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select Message File',
            canSelectFiles: true,
            filters: {
                'JSON files': ['json'],
                'Text files': ['txt'],
                'All files': ['*']
            }
        });
        if (!selectedPath || selectedPath.length === 0) {
            return;
        }
        const filePath = selectedPath[0].fsPath;
        // Add to parent's MessageFiles array
        const topicNode = this.Parent;
        if (topicNode) {
            const id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
            topicNode.MessageFiles.push({ id, path: filePath });
            // Create the file node
            new SNSPublishFileNode_1.SNSPublishFileNode(filePath, id, this);
            TreeState_1.TreeState.save();
            TreeProvider_1.TreeProvider.Current.Refresh(this);
            ui.showInfoMessage('Message file added successfully');
        }
    }
}
exports.SNSPublishGroupNode = SNSPublishGroupNode;
//# sourceMappingURL=SNSPublishGroupNode.js.map