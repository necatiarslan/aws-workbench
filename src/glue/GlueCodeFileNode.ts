import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { GlueJobNode } from './GlueJobNode';
import { TreeState } from '../tree/TreeState';
import * as ui from '../common/UI';

export class GlueCodeFileNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) {
        super(Label, parent);
        this.Icon = "file-code";
        
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.OnNodeLoaded.subscribe(() => this.handleNodeLoaded());
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
    private async handleNodeLoaded(): Promise<void> {
        const glueJobNode = this.GetAwsResourceNode() as GlueJobNode;
        if (glueJobNode && glueJobNode.CodePath) {
            this.label = glueJobNode.CodePath;
        }
    }

    private async handleNodeOpen(): Promise<void> {
        ui.logToOutput('GlueCodeFileNode.handleNodeOpen Started');

        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }

        const fileUris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select Code File',
            filters: {
                'Python files': ['py'],
                'Scala files': ['scala'],
                'All files': ['*']
            }
        });

        if (!fileUris || fileUris.length === 0) {
            return;
        }

        job.CodePath = fileUris[0].fsPath;
        this.description = job.CodePath;
        TreeState.save();
        
        ui.showInfoMessage(`Code file set to: ${job.CodePath}`);
        ui.logToOutput(`GlueCodeFileNode: Code path set to ${job.CodePath}`);
    }

}
