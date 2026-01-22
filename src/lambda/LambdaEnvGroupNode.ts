import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { ServiceHub } from '../tree/ServiceHub';
import { TreeState } from '../tree/TreeState';

export class LambdaEnvGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "symbol-value";
        this.Label = Label;

        this.ShouldBeSaved = false;
        this.SetContextValue();
    }

    @Serialize()
    public Label: string = "";

    public async NodeAdd(): Promise<void> {
    }

    public NodeRemove(): void {
    }

    public NodeRefresh(): void {
    }

    public NodeView(): void {
    }

    public async NodeEdit(): Promise<void> {
    }

    public NodeRun(): void {
    }

    public NodeStop(): void {
    }

    public NodeOpen(): void {
    }

    public NodeInfo(): void {
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('LambdaEnvGroupNode', LambdaEnvGroupNode);