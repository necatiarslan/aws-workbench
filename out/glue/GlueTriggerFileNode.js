"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueTriggerFileNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const GlueJobNode_1 = require("./GlueJobNode");
const ui = require("../common/UI");
const vscode = require("vscode");
const path = require("path");
const GlueJobRunView_1 = require("./GlueJobRunView");
class GlueTriggerFileNode extends NodeBase_1.NodeBase {
    FileId;
    FilePath;
    constructor(filePath, parent, fileId) {
        super(path.basename(filePath), parent);
        this.Icon = "file";
        this.FilePath = filePath;
        this.FileId = fileId || Date.now().toString();
        this.description = filePath;
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
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
        ui.logToOutput('GlueTriggerFileNode.handleNodeRun Started');
        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }
        // Open webview with this trigger file
        GlueJobRunView_1.GlueJobRunView.Render(job.Region, job.JobName, this.FilePath);
    }
    async handleNodeOpen() {
        // Open the file in editor
        try {
            const document = await vscode.workspace.openTextDocument(this.FilePath);
            await vscode.window.showTextDocument(document);
        }
        catch (error) {
            ui.logToOutput('GlueTriggerFileNode.handleNodeOpen Error !!!', error);
            ui.showErrorMessage('Failed to open file', error);
        }
    }
    handleNodeRemove() {
        const job = this.getParentJob();
        if (job) {
            // Remove from job's trigger files
            job.TriggerFiles = job.TriggerFiles.filter(tf => tf.id !== this.FileId);
        }
        this.Remove();
        this.TreeSave();
    }
}
exports.GlueTriggerFileNode = GlueTriggerFileNode;
//# sourceMappingURL=GlueTriggerFileNode.js.map