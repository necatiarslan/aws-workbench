import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { GlueJobNode } from './GlueJobNode';
import * as api from './API';
import * as ui from '../common/UI';
import * as fs from 'fs';
import * as path from 'path';

export class GlueCodeDownloadNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) {
        super(Label, parent);
        this.Icon = "cloud-download";
        
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.SetContextValue();
    }

    private getParentJob(): GlueJobNode | undefined {
        let current = this.Parent;
        while (current) {
            if (current instanceof GlueJobNode) {
                return current;
            }
            current = current.Parent;
        }
        return undefined;
    }

    private async handleNodeRun(): Promise<void> {
        ui.logToOutput('GlueCodeDownloadNode.handleNodeRun Started');

        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }

        if (this.IsWorking) { return; }

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

        } catch (error: any) {
            ui.logToOutput('GlueCodeDownloadNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Download failed', error);
        } finally {
            this.StopWorking();
        }
    }
}
