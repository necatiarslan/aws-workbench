import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { GlueJobNode } from './GlueJobNode';
import * as api from './API';
import * as ui from '../common/UI';
import * as fs from 'fs';

export class GlueCodeUpdateNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) {
        super(Label, parent);
        this.Icon = "cloud-upload";
        
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

        if (this.IsWorking) { return; }

        // Confirm upload
        const confirm = await vscode.window.showWarningMessage(
            `Upload local file to S3?\n${job.CodePath}`,
            { modal: true },
            'Yes'
        );
        if (confirm !== 'Yes') { return; }

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

        } catch (error: any) {
            ui.logToOutput('GlueCodeUpdateNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Upload failed', error);
        } finally {
            this.StopWorking();
        }
    }
}
