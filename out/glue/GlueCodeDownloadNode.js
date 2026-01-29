"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueCodeDownloadNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const GlueJobNode_1 = require("./GlueJobNode");
const api = require("./API");
const ui = require("../common/UI");
const fs = require("fs");
const path = require("path");
class GlueCodeDownloadNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "cloud-download";
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
        ui.logToOutput('GlueCodeDownloadNode.handleNodeRun Started');
        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }
        if (this.IsWorking) {
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
            // Download from S3
            const result = await api.DownloadS3Object(job.Region, parsed.bucket, parsed.key);
            if (!result.isSuccessful || !result.result) {
                ui.showErrorMessage('Failed to download code from S3', result.error);
                this.StopWorking();
                return;
            }
            // Ask user where to save
            const defaultFileName = path.basename(parsed.key);
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(defaultFileName),
                filters: {
                    'Python files': ['py'],
                    'Scala files': ['scala'],
                    'All files': ['*']
                }
            });
            if (!saveUri) {
                this.StopWorking();
                return;
            }
            // Write file
            fs.writeFileSync(saveUri.fsPath, result.result);
            // Update job's code path
            job.CodePath = saveUri.fsPath;
            ui.showInfoMessage(`Code downloaded to: ${saveUri.fsPath}`);
            ui.logToOutput(`GlueCodeDownloadNode: Downloaded to ${saveUri.fsPath}`);
            // Open the downloaded file
            const document = await vscode.workspace.openTextDocument(saveUri);
            await vscode.window.showTextDocument(document);
        }
        catch (error) {
            ui.logToOutput('GlueCodeDownloadNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Download failed', error);
        }
        finally {
            this.StopWorking();
        }
    }
}
exports.GlueCodeDownloadNode = GlueCodeDownloadNode;
//# sourceMappingURL=GlueCodeDownloadNode.js.map