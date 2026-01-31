import { NodeBase } from '../tree/NodeBase';
import { GlueJobNode } from './GlueJobNode';
import { TreeState } from '../tree/TreeState';
import * as ui from '../common/UI';
import * as vscode from 'vscode';
import * as path from 'path';
import { ServiceHub } from '../tree/ServiceHub';
import { GlueJobRunView } from './GlueJobRunView';

export class GlueTriggerFileNode extends NodeBase {

    public FileId: string;
    public FilePath: string;

    constructor(filePath: string, parent?: NodeBase, fileId?: string) {
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
        ui.logToOutput('GlueTriggerFileNode.handleNodeRun Started');

        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }

        // Open webview with this trigger file
        GlueJobRunView.Render(
            job.Region,
            job.JobName,
            this.FilePath
        );
    }

    private async handleNodeOpen(): Promise<void> {
        // Open the file in editor
        try {
            const document = await vscode.workspace.openTextDocument(this.FilePath);
            await vscode.window.showTextDocument(document);
        } catch (error: any) {
            ui.logToOutput('GlueTriggerFileNode.handleNodeOpen Error !!!', error);
            ui.showErrorMessage('Failed to open file', error);
        }
    }

    private handleNodeRemove(): void {
        const job = this.getParentJob();
        if (job) {
            // Remove from job's trigger files
            job.TriggerFiles = job.TriggerFiles.filter(tf => tf.id !== this.FileId);
        }
        this.Remove();
        this.TreeSave();
    }
}
