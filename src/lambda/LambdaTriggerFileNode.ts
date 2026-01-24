import { NodeBase } from '../tree/NodeBase';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { LambdaFunctionNode } from './LambdaFunctionNode';
import { TreeState } from '../tree/TreeState';

export class LambdaTriggerFileNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "run";

        this.ShouldBeSaved = false;
        this.EnableNodeRun = true;
        this.EnableNodeRemove = true;
        this.EnableNodeEdit = true;
        this.SetContextValue();
    }

    public FilePath: string = "";

    public async NodeAdd(): Promise<void> {}

    public NodeRemove(): void {
        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        lambdaNode.TriggerFiles = lambdaNode.TriggerFiles.filter(tf => tf.id !== this.id);
        this.Remove();
        TreeState.save();
    }

    public NodeRefresh(): void {}

    public NodeView(): void {}

    public async NodeEdit(): Promise<void> {
        if (this.FilePath) {
            const document = await vscode.workspace.openTextDocument(this.FilePath);
            await vscode.window.showTextDocument(document);
        }
    }

    public NodeRun(): void {
        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        if (lambdaNode && this.FilePath) {
            lambdaNode.NodeRun(this.FilePath);
        }
    }

    public NodeStop(): void {}

    public NodeOpen(): void {}

    public NodeInfo(): void {}

    public NodeLoaded(): void {}

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('LambdaTriggerFileNode', LambdaTriggerFileNode);