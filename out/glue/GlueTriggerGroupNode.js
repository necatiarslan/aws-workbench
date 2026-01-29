"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueTriggerGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const GlueJobNode_1 = require("./GlueJobNode");
const GlueTriggerFileNode_1 = require("./GlueTriggerFileNode");
const TreeState_1 = require("../tree/TreeState");
const ui = require("../common/UI");
const ServiceHub_1 = require("../tree/ServiceHub");
const GlueJobRunView_1 = require("./GlueJobRunView");
class GlueTriggerGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "zap";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.SetContextValue();
    }
    getParentJob() {
        let current = this.Parent;
        while (current) {
            if (current instanceof GlueJobNode_1.GlueJobNode) {
                return current;
            }
            current = current.Parent;
        }
        return undefined;
    }
    async handleNodeRun() {
        // Trigger without payload - opens webview
        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }
        GlueJobRunView_1.GlueJobRunView.Render(ServiceHub_1.ServiceHub.Current.Context.extensionUri, job.Region, job.JobName);
    }
    async handleNodeAdd() {
        ui.logToOutput('GlueTriggerGroupNode.handleNodeAdd Started');
        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }
        // Let user select a JSON file
        const fileUris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select Trigger File (JSON)',
            filters: {
                'JSON files': ['json'],
                'All files': ['*']
            }
        });
        if (!fileUris || fileUris.length === 0) {
            return;
        }
        const filePath = fileUris[0].fsPath;
        const id = Date.now().toString();
        // Add to job's trigger files
        job.TriggerFiles.push({ id, path: filePath });
        // Create child node
        new GlueTriggerFileNode_1.GlueTriggerFileNode(filePath, this, id);
        TreeState_1.TreeState.save();
        ui.showInfoMessage(`Trigger file added: ${filePath}`);
    }
    LoadTriggerFiles() {
        const job = this.getParentJob();
        if (!job) {
            return;
        }
        for (const tf of job.TriggerFiles) {
            new GlueTriggerFileNode_1.GlueTriggerFileNode(tf.path, this, tf.id);
        }
    }
}
exports.GlueTriggerGroupNode = GlueTriggerGroupNode;
//# sourceMappingURL=GlueTriggerGroupNode.js.map