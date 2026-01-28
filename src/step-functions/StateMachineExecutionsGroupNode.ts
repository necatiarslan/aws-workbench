import { NodeBase } from '../tree/NodeBase';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { StateMachineNode } from './StateMachineNode';
import * as api from './API';
import { StateMachineExecutionNode } from './StateMachineExecutionNode';
import { StateMachineExecutionStatusGroupNode } from './StateMachineExecutionStatusGroupNode';

export class StateMachineExecutionsGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "history";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        
        this.SetContextValue();
    }

    private async handleLoadChildren(): Promise<void> {
        // Create sub-groups for different execution statuses
        if(this.Children.length === 0) {
            new StateMachineExecutionStatusGroupNode("All", this, undefined);
            new StateMachineExecutionStatusGroupNode("Running", this, "RUNNING");
            new StateMachineExecutionStatusGroupNode("Succeeded", this, "SUCCEEDED");
            new StateMachineExecutionStatusGroupNode("Failed", this, "FAILED");
            new StateMachineExecutionStatusGroupNode("Timed Out", this, "TIMED_OUT");
            new StateMachineExecutionStatusGroupNode("Aborted", this, "ABORTED");
        }
    }

    private async handleNodeRefresh(): Promise<void> {
        // Clear and reload children
        this.Children = [];
        this.IsOnNodeLoadChildrenCalled = false;
        await this.handleLoadChildren();
    }
}