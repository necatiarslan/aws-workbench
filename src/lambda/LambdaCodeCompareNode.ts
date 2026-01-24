import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { TreeProvider } from '../tree/TreeProvider';
import { TreeState } from '../tree/TreeState';
import { LambdaFunctionNode } from './LambdaFunctionNode';

export class LambdaCodeCompareNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "diff";

        this.ShouldBeSaved = false;
        this.EnableNodeRun = true;
        this.SetContextValue();
    }

    public async NodeAdd(): Promise<void> {
    }

    public NodeRemove(): void {
    }

    public NodeRefresh(): void {
    }

    public NodeView(): void {
    }

    public NodeEdit(): void {
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
NodeRegistry.register('LambdaCodeCompareNode', LambdaCodeCompareNode);