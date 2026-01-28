import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import * as api from './API';
import { TreeState } from '../tree/TreeState';
import { StateMachineNode } from './StateMachineNode';
import { GetLogEvents } from '../lambda/API';
import { StateMachineExecutionView } from './StateMachineExecutionView';
import { Session } from '../common/Session';

export class StateMachineExecutionNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = 'pass';

        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.OnNodeEdit.subscribe(() => this.handleNodeViewHistory());
        
        this.SetContextValue();
    }

    public ExecutionArn: string = "";

    public Status: string = "";

    public StartDate: string = "";

    public StopDate: string = "";

    private handleNodeRemove(): void {
        this.Remove();
    }

    private async handleNodeInfo(): Promise<void> {
        ui.logToOutput('StateMachineExecutionNode.NodeInfo Started');

        if (!this.ExecutionArn) {
            ui.showWarningMessage('Execution ARN not available');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        try {
            // Get state machine node to find region
            const stateMachineNode = this.GetStateMachineNode();
            if(!stateMachineNode) {
                ui.showWarningMessage('State machine node not found');
                this.StopWorking();
                return;
            }

            const result = await api.GetExecutionDetails(stateMachineNode.Region, this.ExecutionArn);
            if (result.isSuccessful && result.result) {
                const jsonContent = JSON.stringify(result.result, null, 2);
                const document = await vscode.workspace.openTextDocument({
                    content: jsonContent,
                    language: 'json'
                });
                await vscode.window.showTextDocument(document);
            } else {
                ui.showWarningMessage('Failed to load execution details');
            }
        } catch (error: any) {
            ui.logToOutput('StateMachineExecutionNode.NodeInfo Error !!!', error);
            ui.showErrorMessage('Failed to open execution details', error);
        }
        this.StopWorking();
    }

    private async handleNodeViewHistory(): Promise<void> {
        ui.logToOutput('StateMachineExecutionNode.ViewHistory Started');

        if (!this.ExecutionArn) {
            ui.showWarningMessage('Execution ARN not available');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        try {
            const stateMachineNode = this.GetStateMachineNode();
            if(!stateMachineNode) {
                ui.showWarningMessage('State machine node not found');
                this.StopWorking();
                return;
            }

            const result = await api.GetExecutionHistory(stateMachineNode.Region, this.ExecutionArn);
            if (result.isSuccessful && result.result) {
                const jsonContent = JSON.stringify(result.result, null, 2);
                const document = await vscode.workspace.openTextDocument({
                    content: jsonContent,
                    language: 'json'
                });
                await vscode.window.showTextDocument(document);
            } else {
                ui.showWarningMessage('Failed to load execution history');
            }
        } catch (error: any) {
            ui.logToOutput('StateMachineExecutionNode.ViewHistory Error !!!', error);
            ui.showErrorMessage('Failed to open execution history', error);
        }
        this.StopWorking();
    }

    private async handleNodeView(): Promise<void> {
        ui.logToOutput('StateMachineExecutionNode.View Started');

        if (!this.ExecutionArn) {
            ui.showWarningMessage('Execution ARN not available');
            return;
        }

        const stateMachineNode = this.GetStateMachineNode();
        if(!stateMachineNode) {
            ui.showWarningMessage('State machine node not found');
            return;
        }

        StateMachineExecutionView.Render(Session.Current.ExtensionUri, this.ExecutionArn, stateMachineNode.StateMachineArn || '', stateMachineNode.Region || '');
    }

    private GetStateMachineNode(): StateMachineNode | undefined {
        let current: NodeBase | undefined = this.Parent;
        while(current) {
            if(current instanceof StateMachineNode) {
                return current;
            }
            current = current.Parent;
        }
        return undefined;
    }
}

