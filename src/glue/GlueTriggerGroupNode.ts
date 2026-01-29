import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { GlueJobNode } from './GlueJobNode';
import { GlueTriggerFileNode } from './GlueTriggerFileNode';
import { TreeState } from '../tree/TreeState';
import * as ui from '../common/UI';
import { ServiceHub } from '../tree/ServiceHub';
import { GlueJobRunView } from './GlueJobRunView';

export class GlueTriggerGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) {
        super(Label, parent);
        this.Icon = "zap";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        
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
        // Trigger without payload - opens webview
        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }

        GlueJobRunView.Render(
            ServiceHub.Current.Context.extensionUri,
            job.Region,
            job.JobName
        );
    }

    private async handleNodeAdd(): Promise<void> {
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
        new GlueTriggerFileNode(filePath, this, id);

        TreeState.save();
        ui.showInfoMessage(`Trigger file added: ${filePath}`);
    }

    public LoadTriggerFiles(): void {
        const job = this.getParentJob();
        if (!job) { return; }

        for (const tf of job.TriggerFiles) {
            new GlueTriggerFileNode(tf.path, this, tf.id);
        }
    }
}
