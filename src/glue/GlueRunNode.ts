import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { JobRun } from '@aws-sdk/client-glue';
import * as ui from '../common/UI';

export class GlueRunNode extends NodeBase {

    public RunId: string;
    public RunStatus: string;
    public JobRun: JobRun;

    constructor(jobRun: JobRun, parent?: NodeBase) {
        const runId = jobRun.Id || 'unknown';
        const status = jobRun.JobRunState || 'UNKNOWN';
        const startTime = jobRun.StartedOn ? jobRun.StartedOn.toLocaleString() : '';
        
        super(`${runId.substring(0, 10)}...`, parent);
        
        this.RunId = runId;
        this.RunStatus = status;
        this.JobRun = jobRun;
        
        // Set icon based on status
        this.setIconForStatus(status);
        
        // Build description with status and time
        const duration = this.calculateDuration(jobRun);
        this.description = `${status} - ${startTime}${duration ? ` (${duration})` : ''}`;
        
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        
        this.SetContextValue();
    }

    private setIconForStatus(status: string): void {
        switch (status) {
            case 'SUCCEEDED':
                this.Icon = "pass";
                break;
            case 'FAILED':
                this.Icon = "error";
                break;
            case 'RUNNING':
                this.Icon = "sync~spin";
                break;
            case 'STOPPED':
            case 'STOPPING':
                this.Icon = "debug-stop";
                break;
            case 'TIMEOUT':
                this.Icon = "clock";
                break;
            case 'STARTING':
            case 'WAITING':
                this.Icon = "loading~spin";
                break;
            default:
                this.Icon = "circle-outline";
        }
    }

    private calculateDuration(jobRun: JobRun): string {
        if (jobRun.ExecutionTime) {
            return `${jobRun.ExecutionTime}s`;
        }
        if (jobRun.StartedOn) {
            const endTime = jobRun.CompletedOn || new Date();
            const durationMs = endTime.getTime() - jobRun.StartedOn.getTime();
            const durationSec = Math.round(durationMs / 1000);
            return `${durationSec}s`;
        }
        return '';
    }

    private async handleNodeInfo(): Promise<void> {
        ui.logToOutput('GlueRunNode.handleNodeInfo Started');

        try {
            const jsonContent = JSON.stringify(this.JobRun, null, 2);
            const document = await vscode.workspace.openTextDocument({
                content: jsonContent,
                language: 'json'
            });
            await vscode.window.showTextDocument(document);
        } catch (error: any) {
            ui.logToOutput('GlueRunNode.handleNodeInfo Error !!!', error);
            ui.showErrorMessage('Failed to show run details', error);
        }
    }
}
