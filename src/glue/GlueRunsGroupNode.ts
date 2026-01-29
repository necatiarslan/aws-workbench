import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { GlueJobNode } from './GlueJobNode';
import { GlueRunNode } from './GlueRunNode';
import * as api from './API';
import * as ui from '../common/UI';
import { ServiceHub } from '../tree/ServiceHub';
import { GlueJobRunsReportView } from './GlueJobRunsReportView';

export class GlueRunsGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) {
        super(Label, parent);
        this.Icon = "history";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        
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

    private async handleNodeView(): Promise<void> {
        // Open the runs report webview
        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }

        GlueJobRunsReportView.Render(
            ServiceHub.Current.Context.extensionUri,
            job.Region,
            job.JobName
        );
    }

    private async handleLoadChildren(): Promise<void> {
        ui.logToOutput('GlueRunsGroupNode.handleLoadChildren Started');

        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }

        // Clear existing children
        this.Children.length = 0;

        this.StartWorking();

        try {
            const result = await api.GetGlueJobRuns(job.Region, job.JobName);
            if (!result.isSuccessful || !result.result) {
                ui.showWarningMessage('Failed to load job runs');
                this.StopWorking();
                return;
            }

            // Sort by start time descending
            const runs = result.result.sort((a, b) => {
                const aTime = a.StartedOn?.getTime() || 0;
                const bTime = b.StartedOn?.getTime() || 0;
                return bTime - aTime;
            });

            // Show only last 20 runs in tree, use report for more
            const displayRuns = runs.slice(0, 20);

            for (const run of displayRuns) {
                new GlueRunNode(run, this);
            }

            if (runs.length > 20) {
                this.description = `${displayRuns.length} of ${runs.length} runs`;
            } else {
                this.description = `${runs.length} runs`;
            }

        } catch (error: any) {
            ui.logToOutput('GlueRunsGroupNode.handleLoadChildren Error !!!', error);
            ui.showErrorMessage('Failed to load job runs', error);
        } finally {
            this.StopWorking();
        }
    }
}
