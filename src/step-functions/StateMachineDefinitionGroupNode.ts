import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { StateMachineDefinitionFileNode } from './StateMachineDefinitionFileNode';
import { StateMachineDefinitionDownloadNode } from './StateMachineDefinitionDownloadNode';
import { StateMachineDefinitionCompareNode } from './StateMachineDefinitionCompareNode';
import { StateMachineDefinitionUpdateNode } from './StateMachineDefinitionUpdateNode';

export class StateMachineDefinitionGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "json";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        
        this.SetContextValue();
    }

    private handleLoadChildren(): void {
        if(this.Children.length === 0) {
            new StateMachineDefinitionFileNode("Select Definition File", this);
            new StateMachineDefinitionDownloadNode("Download", this);
            new StateMachineDefinitionCompareNode("Compare", this);
            new StateMachineDefinitionUpdateNode("Update", this);
        }
    }
}