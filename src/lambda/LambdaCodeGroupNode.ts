import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';

export class LambdaCodeGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "code";

        this.ShouldBeSaved = false;
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

}