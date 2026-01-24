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

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('LambdaInfoNode', LambdaInfoNode);