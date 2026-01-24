import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { ServiceHub } from '../tree/ServiceHub';
import { TreeState } from '../tree/TreeState';

export class LambdaInfoNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "info";

        this.ShouldBeSaved = false;
        this.SetContextValue();
    }

    public Key: string = "";

    public Value: string = "";

    public async NodeAdd(): Promise<void> {
    }

    public NodeRemove(): void {
    }

    public NodeRefresh(): void {
        this.Parent?.NodeRefresh();
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

    public NodeInfo(): void {}

    public NodeLoaded(): void {}

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('LambdaInfoNode', LambdaInfoNode);