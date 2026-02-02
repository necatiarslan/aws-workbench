import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { StateMachineExecutionFilterGroupNode } from './StateMachineExecutionFilterGroupNode';
import { StateMachineNode } from './StateMachineNode';
import * as ui from '../common/UI';
import { FolderNode } from '../filesystem/FolderNode';
import { StateMachineExecutionsReportView } from './StateMachineExecutionsReportView';

export class StateMachineExecutionsGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "history";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeView.subscribe(() => { this.handleNodeView(); });
        
        this.SetContextValue();
    }

    private async handleViewExecutionsReport(): Promise<void> {
 
    }

    private async handleNodeView(): Promise<void> {
       const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if(!stateMachineNode) {
            ui.showInfoMessage("State Machine not found.");
            return;
        }

        StateMachineExecutionsReportView.Render(
            stateMachineNode.Region,
            stateMachineNode.StateMachineArn,
            stateMachineNode.StateMachineName
        );
    }

    private async handleNodeAdd(): Promise<void> {
        const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if(!stateMachineNode) {
            ui.showInfoMessage("State Machine not found.");
            return;
        }

        //ask user execution start date
        const startDateInput = await vscode.window.showInputBox({
            prompt: 'Enter the start date for executions (YYYY-MM-DD)',
            placeHolder: '2026-01-01',
            value: new Date().toISOString().split('T')[0],
            validateInput: (value: string) => {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    return 'Invalid date format. Please use YYYY-MM-DD.';
                }
                return null;
            }
        });

        if (!startDateInput) {
            return; // User cancelled input
        }

        //ask user execution name filter
        const nameFilterInput = await vscode.window.showInputBox({
            prompt: 'Enter the execution name filter (optional)',
            placeHolder: 'Execution Name Filter'
        });

        let filterName = startDateInput;
        if(nameFilterInput){
            filterName = filterName + " [" + (nameFilterInput ? nameFilterInput.trim() : "") + "]";
        }

        // Create and configure the new filter node
        const filterNode = new StateMachineExecutionFilterGroupNode(filterName || "New Filter", this);
        filterNode.StartDate = new Date(startDateInput);
        filterNode.StartDate.setHours(0, 0, 0, 0);
        if (nameFilterInput && nameFilterInput.trim().length > 0) {
            filterNode.ExecutionName = nameFilterInput.trim();
        }

        stateMachineNode.AddExecutionFilter(
            filterNode.NodeId!,
            filterNode.StartDate,
            filterNode.ExecutionName,
            filterNode.StatusFilter
        );
    }

    private async handleLoadChildren(): Promise<void> {
        this.handleNodeRefresh();
    }

    private async handleNodeRefresh(): Promise<void> {
        // Clear and reload children
        this.Children = [];
        const todayFilterNode = new StateMachineExecutionFilterGroupNode("Today", this);
        todayFilterNode.StartDate = new Date();
        todayFilterNode.StartDate.setHours(0, 0, 0, 0);

        const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if(stateMachineNode && stateMachineNode.ExecutionFilters) {
            for(const filter of stateMachineNode.ExecutionFilters) {
                let filterName = new Date(filter.startDate).toISOString().split('T')[0];
                if(filter.executionName){
                    filterName = filterName + " [" + (filter.executionName ? filter.executionName.trim() : "") + "]";
                }
                const filterNode = new StateMachineExecutionFilterGroupNode(filterName, this);
                filterNode.NodeId = filter.NodeId;
                filterNode.StartDate = new Date(filter.startDate);
                filterNode.ExecutionName = filter.executionName;
                filterNode.StatusFilter = filter.statusFilter;
            }
        }
    }
}