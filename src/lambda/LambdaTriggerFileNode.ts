import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { LambdaFunctionNode } from './LambdaFunctionNode';

export class LambdaTriggerFileNode extends NodeBase {

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
        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        lambdaNode.TriggerFiles = lambdaNode.TriggerFiles.filter(tf => tf.id !== this.id);
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
        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        if (lambdaNode && this.FilePath) {
            // Store the trigger file path and invoke the parent node's run
            await lambdaNode.TriggerLambda(this.FilePath);
        }
    }

}
