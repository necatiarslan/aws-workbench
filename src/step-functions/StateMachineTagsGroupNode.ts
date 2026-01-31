import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { StateMachineNode } from './StateMachineNode';
import { StateMachineTagNode } from './StateMachineTagNode';

export class StateMachineTagsGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "tag";
        
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeRefresh(): Promise<void> {
        ui.logToOutput('StateMachineTagsGroupNode.NodeRefresh Started');

        const stateMachineNode = this.Parent as StateMachineNode;
        if (!stateMachineNode || !stateMachineNode.StateMachineArn || !stateMachineNode.Region) {
            ui.logToOutput('StateMachineTagsGroupNode.NodeRefresh - Parent StateMachine node not found');
            return;
        }

        // if (this.IsWorking) {
        //     return;
        // }

        this.StartWorking();

        const result = await api.GetStateMachineTags(stateMachineNode.Region, stateMachineNode.StateMachineArn);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetStateMachineTags Error !!!', result.error);
            ui.showErrorMessage('Get State Machine Tags Error !!!', result.error);
            this.StopWorking();
            return;
        }

        this.Children = [];

        const tags = result.result || [];
        for (const tag of tags) {
            new StateMachineTagNode(tag.key, tag.value, this);
        }

        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }

        this.StopWorking();
        this.RefreshTree();
    }

    public async handleNodeAdd(): Promise<void> {
        ui.logToOutput('StateMachineTagsGroupNode.NodeAdd Started');

        const stateMachineNode = this.Parent as StateMachineNode;
        if (!stateMachineNode || !stateMachineNode.StateMachineArn || !stateMachineNode.Region) {
            ui.logToOutput('StateMachineTagsGroupNode.NodeAdd - Parent StateMachine node not found');
            return;
        }

        const key = await vscode.window.showInputBox({
            placeHolder: 'Enter Tag Key'
        });
        if (!key) { return; }

        const value = await vscode.window.showInputBox({
            placeHolder: 'Enter Tag Value'
        });
        if (value === undefined) { return; }

        if (this.IsWorking) { return; }
        this.StartWorking();

        const result = await api.UpdateStateMachineTag(stateMachineNode.Region, stateMachineNode.StateMachineArn, key, value);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateStateMachineTag Error !!!', result.error);
            ui.showErrorMessage('Add Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Added Successfully');
        await this.handleNodeRefresh();
    }
}
