import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { GlueJobNode } from './GlueJobNode';
import * as api from './API';
import * as ui from '../common/UI';

export class GlueLogsGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) {
        super(Label, parent);
        this.Icon = "output";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        
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

    private async handleLoadChildren(): Promise<void> {
        ui.logToOutput('GlueLogsGroupNode.handleLoadChildren Started');

        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }

        // Clear existing children
        this.Children.length = 0;

        this.StartWorking();

        try {
            // Glue jobs log to /aws-glue/jobs/output and /aws-glue/jobs/error
            const outputLogGroup = api.GetGlueJobLogGroupName(job.JobName);
            const errorLogGroup = api.GetGlueJobErrorLogGroupName(job.JobName);

            // Create output logs node
            new GlueLogStreamGroupNode("Output Logs", outputLogGroup, this);
            new GlueLogStreamGroupNode("Error Logs", errorLogGroup, this);

        } catch (error: any) {
            ui.logToOutput('GlueLogsGroupNode.handleLoadChildren Error !!!', error);
            ui.showErrorMessage('Failed to load logs', error);
        } finally {
            this.StopWorking();
        }
    }
}

class GlueLogStreamGroupNode extends NodeBase {

    public LogGroupName: string;

    constructor(label: string, logGroupName: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "list-unordered";
        this.LogGroupName = logGroupName;
        this.description = logGroupName;
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        
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

    private async handleLoadChildren(): Promise<void> {
        ui.logToOutput('GlueLogStreamGroupNode.handleLoadChildren Started');

        const job = this.getParentJob();
        if (!job) {
            return;
        }

        // Clear existing children
        this.Children.length = 0;

        this.StartWorking();

        try {
            // Get log streams from this log group
            const result = await api.GetLatestLogStreamList(job.Region, this.LogGroupName);
            if (!result.isSuccessful || !result.result) {
                this.description = `${this.LogGroupName} (no streams)`;
                this.StopWorking();
                return;
            }

            // Filter to streams that contain the job name
            const jobStreams = result.result.filter(s => s.includes(job.JobName));
            const displayStreams = jobStreams.slice(0, 10);

            for (const stream of displayStreams) {
                new GlueLogStreamNode(stream, this.LogGroupName, this);
            }

            this.description = `${displayStreams.length} streams`;

        } catch (error: any) {
            ui.logToOutput('GlueLogStreamGroupNode.handleLoadChildren Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }
}

class GlueLogStreamNode extends NodeBase {

    public LogGroupName: string;
    public LogStreamName: string;

    constructor(logStreamName: string, logGroupName: string, parent?: NodeBase) {
        // Show abbreviated stream name
        const displayName = logStreamName.length > 30 
            ? logStreamName.substring(0, 30) + '...' 
            : logStreamName;
        
        super(displayName, parent);
        this.Icon = "file-text";
        this.LogGroupName = logGroupName;
        this.LogStreamName = logStreamName;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        
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

    private async handleNodeOpen(): Promise<void> {
        ui.logToOutput('GlueLogStreamNode.handleNodeOpen Started');

        const job = this.getParentJob();
        if (!job) {
            return;
        }

        this.StartWorking();

        try {
            const result = await api.GetLogEvents(job.Region, this.LogGroupName, this.LogStreamName);
            if (!result.isSuccessful || !result.result) {
                ui.showWarningMessage('Failed to load log events');
                this.StopWorking();
                return;
            }

            // Format log events
            const logContent = result.result
                .map(event => {
                    const timestamp = event.timestamp 
                        ? new Date(event.timestamp).toISOString() 
                        : '';
                    return `[${timestamp}] ${event.message || ''}`;
                })
                .join('\n');

            // Show in new document
            const document = await vscode.workspace.openTextDocument({
                content: logContent || 'No log events found',
                language: 'log'
            });
            await vscode.window.showTextDocument(document);

        } catch (error: any) {
            ui.logToOutput('GlueLogStreamNode.handleNodeOpen Error !!!', error);
            ui.showErrorMessage('Failed to load logs', error);
        } finally {
            this.StopWorking();
        }
    }
}
