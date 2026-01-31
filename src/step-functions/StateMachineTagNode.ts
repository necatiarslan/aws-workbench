import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { StateMachineNode } from './StateMachineNode';

export class StateMachineTagNode extends NodeBase {

    constructor(Key: string, Value: string, parent?: NodeBase) 
    {
        super(Key, parent);
        this.Icon = "circle-outline";
        this.Key = Key;
        this.Value = Value;
        this.description = Value;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;

        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
    }

    public Key: string = "";
    public Value: string = "";

    private async handleNodeOpen(): Promise<void> {
        const info = `${this.Key}: ${this.Value}`;
        await vscode.env.clipboard.writeText(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }

    public async handleNodeRemove(): Promise<void> {
        ui.logToOutput('StateMachineTagNode.NodeRemove Started');

        if (!this.Key) { return; }

        const confirmation = await vscode.window.showWarningMessage(
            `Are you sure you want to remove tag "${this.Key}"?`,
            { modal: true },
            'Yes',
            'No'
        );

        if (confirmation !== 'Yes') { return; }

        const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if (!stateMachineNode || !stateMachineNode.StateMachineArn || !stateMachineNode.Region) {
            ui.logToOutput('StateMachineTagNode.NodeRemove - Parent StateMachine node not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        const result = await api.RemoveStateMachineTag(stateMachineNode.Region, stateMachineNode.StateMachineArn, this.Key);
        if (!result.isSuccessful) {
            ui.logToOutput('api.RemoveStateMachineTag Error !!!', result.error);
            ui.showErrorMessage('Remove Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Removed Successfully');
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }

    public async handleNodeRefresh(): Promise<void> {
        this.Parent?.NodeRefresh();
    }

    public async handleNodeEdit(): Promise<void> {
        ui.logToOutput('StateMachineTagNode.NodeEdit Started');

        const newValue = await vscode.window.showInputBox({
            value: this.Value,
            placeHolder: 'Enter New Value for ' + this.Key
        });
        if (newValue === undefined) { return; }

        if (!this.Key) { return; }

        const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if (!stateMachineNode || !stateMachineNode.StateMachineArn || !stateMachineNode.Region) {
            ui.logToOutput('StateMachineTagNode.NodeEdit - Parent StateMachine node not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        const result = await api.UpdateStateMachineTag(stateMachineNode.Region, stateMachineNode.StateMachineArn, this.Key, newValue);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateStateMachineTag Error !!!', result.error);
            ui.showErrorMessage('Update Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Updated Successfully');
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }
}
