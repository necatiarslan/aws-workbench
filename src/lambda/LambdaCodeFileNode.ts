import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { ServiceHub } from '../tree/ServiceHub';
import { TreeState } from '../tree/TreeState';

export class LambdaCodeFileNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "file-code";
        this.Label = Label;

        this.ShouldBeSaved = false;
        this.EnableNodeAdd = true;
        this.EnableNodeRemove = true;
        this.EnableNodeEdit = true;
        this.SetContextValue();
    }

    @Serialize()
    public Label: string = "";

    @Serialize()
    public FilePath: string = "";

    public async NodeAdd(): Promise<void> {
        //TODO: Implement add logic here
    }

    public NodeRemove(): void {
        //TODO: Implement remove logic here
    }

    public NodeRefresh(): void {
    }

    public NodeView(): void {
    }

    public async NodeEdit(): Promise<void> {
        //TODO: Implement edit logic here
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
NodeRegistry.register('LambdaCodeFileNode', LambdaCodeFileNode);