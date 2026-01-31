import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { StateMachineNode } from './StateMachineNode';
import { TreeState } from '../tree/TreeState';

export class StateMachineTriggerFileNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "run";
        
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRun.subscribe(() => this.handleNodeRun());

        this.SetContextValue();
    }

    public FilePath: string = "";

    private async handleNodeRemove(): Promise<void> {
        const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if(!stateMachineNode) return;
        stateMachineNode.PayloadFiles = stateMachineNode.PayloadFiles.filter(tf => tf.id !== this.id);
        this.Remove();
        this.TreeSave();
    }

    private async handleNodeEdit(): Promise<void> {
        if (this.FilePath) {
            const document = await vscode.workspace.openTextDocument(this.FilePath);
            await vscode.window.showTextDocument(document);
        }
    }

    private async handleNodeRun(): Promise<void> {
        const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if (stateMachineNode && this.FilePath) {
            // Store the trigger file path and invoke the parent node's run
            await stateMachineNode.Trigger(this.FilePath, this);
        }
    }

}
