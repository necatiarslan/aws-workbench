"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueCodeUpdateNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const GlueJobNode_1 = require("./GlueJobNode");
const api = require("./API");
const ui = require("../common/UI");
const fs = require("fs");
class GlueCodeUpdateNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "cloud-upload";
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
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
        ui.logToOutput('GlueCodeUpdateNode.handleNodeRun Started');
        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }
        if (!job.CodePath) {
            ui.showWarningMessage('No local code file selected. Please select a file first.');
            return;
        }
        if (!fs.existsSync(job.CodePath)) {
            ui.showWarningMessage('Local code file not found: ' + job.CodePath);
            return;
        }
        if (this.IsWorking) {
            return;
        }
        // Confirm upload
        const confirm = await vscode.window.showWarningMessage(`Upload local file to S3?\n${job.CodePath}`, { modal: true }, 'Yes');
        if (confirm !== 'Yes') {
            return;
        }
        this.StartWorking();
        try {
            // Get job config to find script location
            const config = await job.JobConfig;
            if (!config || !config.Command?.ScriptLocation) {
                ui.showWarningMessage('Script location not found in job configuration');
                this.StopWorking();
                return;
            }
            const s3Uri = config.Command.ScriptLocation;
            const parsed = api.ParseS3Uri(s3Uri);
            if (!parsed) {
                ui.showErrorMessage('Invalid S3 URI: ' + s3Uri, new Error('Invalid S3 URI'));
                this.StopWorking();
                return;
            }
            // Read local file
            const content = fs.readFileSync(job.CodePath);
            // Upload to S3
            const result = await api.UploadS3Object(job.Region, parsed.bucket, parsed.key, content);
            if (!result.isSuccessful) {
                ui.showErrorMessage('Failed to upload code to S3', result.error);
                this.StopWorking();
                return;
            }
            ui.showInfoMessage(`Code uploaded to: ${s3Uri}`);
            ui.logToOutput(`GlueCodeUpdateNode: Uploaded to ${s3Uri}`);
        }
        catch (error) {
            ui.logToOutput('GlueCodeUpdateNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Upload failed', error);
        }
        finally {
            this.StopWorking();
        }
    }
}
exports.GlueCodeUpdateNode = GlueCodeUpdateNode;
//# sourceMappingURL=GlueCodeUpdateNode.js.map