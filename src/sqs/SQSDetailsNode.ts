import { NodeBase } from '../tree/NodeBase';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';

export class SQSDetailsNode extends NodeBase {

    public Key: string = "";
    public Value: string = "";

    constructor(key: string, value: string, parent?: NodeBase) {
        super(`${key}: ${value}`, parent);
        this.Icon = "circle-outline";
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.Key = key;
        this.Value = value;
        
        this.SetContextValue();
    }
}
