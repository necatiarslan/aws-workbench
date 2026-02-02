import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { StateMachineNode } from './StateMachineNode';
import * as api from './API';
import { StateMachineExecutionNode } from './StateMachineExecutionNode';
import { StateMachineExecutionsGroupNode } from './StateMachineExecutionsGroupNode';

export class StateMachineExecutionFilterGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "folder";
        this.NodeId = new Date().getTime().toString();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        
        this.SetContextValue();
    }
    public NodeId?: string;
    public StartDate?: Date;
    public ExecutionName?: string;
    public StatusFilter?: string;

    private async handleNodeRemove(): Promise<void> {
        this.Remove();
        const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if(!stateMachineNode) {
            ui.showInfoMessage("State Machine node not found.");
            return;
        }
        stateMachineNode.RemoveExecutionFilter(this.NodeId!);
    };

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
                this.StatusFilter,
                undefined,
                this.StartDate,
            );

            if(result.isSuccessful && result.result) {
                // Clear existing execution nodes
                this.Children = [];

                // Add execution nodes (limit to 50 most recent)
                const executions = result.result;
                for(const exec of executions) {
                    if(exec.executionArn && exec.name) {
                        if(this.ExecutionName && !exec.name.includes(this.ExecutionName)) {
                            continue;
                        }
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
