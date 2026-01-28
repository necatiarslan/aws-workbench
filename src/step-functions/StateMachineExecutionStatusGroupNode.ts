import { NodeBase } from '../tree/NodeBase';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { StateMachineNode } from './StateMachineNode';
import * as api from './API';
import { StateMachineExecutionNode } from './StateMachineExecutionNode';
import { StateMachineExecutionsGroupNode } from './StateMachineExecutionsGroupNode';

export class StateMachineExecutionStatusGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase, statusFilter?: string) 
    {
        super(label, parent);
        this.Icon = "folder";
        this.StatusFilter = statusFilter;
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        
        this.SetContextValue();
    }

    public StatusFilter?: string;

    private async handleLoadChildren(): Promise<void> {
        const execGroupNode = this.Parent as StateMachineExecutionsGroupNode;
        const stateMachineNode = execGroupNode?.Parent as StateMachineNode;
        if(!stateMachineNode) return;

        this.StartWorking();
        try {
            if(!stateMachineNode.StateMachineArn) {
                this.StopWorking();
                return;
            }

            const result = await api.ListExecutions(
                stateMachineNode.Region,
                stateMachineNode.StateMachineArn,
                this.StatusFilter
            );

            if(result.isSuccessful && result.result) {
                // Clear existing execution nodes
                this.Children = [];

                // Add execution nodes (limit to 50 most recent)
                const executions = result.result.slice(0, 50);
                for(const exec of executions) {
                    if(exec.executionArn && exec.name) {
                        const startTime = exec.startDate ? exec.startDate.toLocaleString() : 'Unknown';
                        const status = exec.status || 'Unknown';
                        const label = `${exec.name} [${status}] - ${startTime}`;
                        
                        const execNode = new StateMachineExecutionNode(label, this);
                        execNode.ExecutionArn = exec.executionArn;
                        execNode.Status = status;
                        execNode.StartDate = startTime;
                        if(exec.stopDate) {
                            execNode.StopDate = exec.stopDate.toLocaleString();
                        } else {
                            execNode.StopDate = '';
                        }

                    }
                }

                if(executions.length === 0) {
                    ui.logToOutput(`No executions found for status filter: ${this.StatusFilter || 'all'}`);
                }
            }
        } catch (error: any) {
            ui.logToOutput('StateMachineExecutionStatusGroupNode.handleLoadChildren Error !!!', error);
            ui.showErrorMessage('Failed to load executions', error);
        }
        this.StopWorking();
    }

    private async handleNodeRefresh(): Promise<void> {
        this.Children = [];
        this.IsOnNodeLoadChildrenCalled = false;
        await this.handleLoadChildren();
    }
}
