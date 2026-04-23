import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { StateMachineNode } from './StateMachineNode';
import { StateMachineExecutionNode } from './StateMachineExecutionNode';

export class StateMachinePinnedExecutionsGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "pin";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());

        this.SetContextValue();
    }

    private async handleLoadChildren(): Promise<void> {
        await this.handleNodeRefresh();
    }

    private async handleNodeRefresh(): Promise<void> {
        this.Children = [];

        const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if (!stateMachineNode) {
            ui.logToOutput('StateMachinePinnedExecutionsGroupNode: StateMachineNode not found');
            return;
        }

        for (const pinned of stateMachineNode.PinnedExecutions) {
            const execNode = new StateMachineExecutionNode(pinned.executionName, this);
            execNode.ExecutionArn = pinned.executionArn;
            execNode.Status = pinned.status || '';
            execNode.StartDate = pinned.startDate || '';
            execNode.StopDate = pinned.stopDate || '';
        }

        this.RefreshTree(this);
    }
}
