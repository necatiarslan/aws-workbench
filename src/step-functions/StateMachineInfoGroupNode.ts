import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { StateMachineNode } from './StateMachineNode';
import { StateMachineInfoNode } from './StateMachineInfoNode';

export class StateMachineInfoGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "info";
        
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeRefresh(): Promise<void> {
        ui.logToOutput('StateMachineInfoGroupNode.NodeRefresh Started');

        // Get the parent StateMachine node
        const stateMachineNode = this.Parent as StateMachineNode;
        if (!stateMachineNode || !stateMachineNode.StateMachineName) {
            ui.logToOutput('StateMachineInfoGroupNode.NodeRefresh - Parent StateMachine node not found');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        // Get state machine definition
        const definition = await stateMachineNode.GetDefinition();
        if (!definition) {
            ui.logToOutput('StateMachineInfoGroupNode.NodeRefresh - Failed to get definition');
            ui.showErrorMessage('Failed to get state machine definition', new Error('Definition is undefined'));
            this.StopWorking();
            return;
        }

        // Clear existing children
        this.Children = [];

        // Add info items as children
        const infoItems = [
            { key: 'Name', value: definition.name || 'N/A' },
            { key: 'ARN', value: definition.stateMachineArn || stateMachineNode.StateMachineArn || 'N/A' },
            { key: 'Type', value: definition.type || 'N/A' },
            { key: 'Status', value: definition.status || 'N/A' },
            { key: 'RoleArn', value: definition.roleArn || 'N/A' },
            { key: 'CreationDate', value: definition.creationDate || 'N/A' },
            { key: 'LoggingLevel', value: definition.loggingConfiguration?.level || 'N/A' },
            { key: 'IncludeExecutionData', value: definition.loggingConfiguration?.includeExecutionData?.toString() || 'N/A' }
        ];

        for (const item of infoItems) {
            new StateMachineInfoNode(item.key, item.value, this);
        }

        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }

        this.StopWorking();
        this.RefreshTree();
    }
}
