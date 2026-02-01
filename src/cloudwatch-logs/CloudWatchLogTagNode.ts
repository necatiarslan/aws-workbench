import { NodeBase } from '../tree/NodeBase';
import * as api from './API';
import * as ui from '../common/UI';
import * as vscode from 'vscode';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import { CloudWatchLogGroupNode } from './CloudWatchLogGroupNode';

export class CloudWatchLogTagNode extends NodeBase {
    Key: string = "";
    Value: string = "";

    constructor(key: string, value: string, parent: NodeBase) {
        super(key, parent);
        this.Key = key;
        this.Value = value;
        this.description = value;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.Icon = "circle-outline";

        this.OnNodeCopy.subscribe(() => this.handleNodeCopy());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
    }

    SetContextValue(): void {
        this.contextValue = "AwsWorkbenchCloudWatchLogTagNode";
        this.contextValue += "#CanRefresh#";
        this.contextValue += "#CanEdit#";
        this.contextValue += "#CanRemove#";
        this.contextValue += "#CanCopyToClipboard#";
    }

    async handleNodeCopy() {
        const info = `${this.Key}: ${this.Value}`;
        ui.CopyToClipboard(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }

    async handleNodeRemove() {
        const confirmation = await vscode.window.showWarningMessage(
            `Are you sure you want to remove tag "${this.Key}"?`,
            { modal: true },
            'Yes',
            'No'
        );

        if (confirmation !== 'Yes') {
            return;
        }

        const logGroupNode = this.GetAwsResourceNode();
        if (!(logGroupNode instanceof CloudWatchLogGroupNode)) {
            ui.logToOutput('CloudWatchLogTagNode.NodeRemove - Parent CloudWatch Log Group not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        const result = await api.RemoveCloudWatchLogGroupTag(
            logGroupNode.Region,
            logGroupNode.LogGroup,
            this.Key
        );

        if (!result.isSuccessful) {
            ui.logToOutput('api.RemoveCloudWatchLogGroupTag Error !!!', result.error);
            ui.showErrorMessage('Remove Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Removed Successfully');
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }

    async handleNodeEdit() {
        const newValue = await vscode.window.showInputBox({
            prompt: `Edit tag value for '${this.Key}'`,
            value: this.Value
        });

        if (newValue === undefined) {
            return;
        }

        const awsResourceNode = this.GetAwsResourceNode();
        if (!(awsResourceNode instanceof CloudWatchLogGroupNode)) {
            ui.logToOutput('CloudWatchLogTagNode.NodeEdit - Parent CloudWatch Log Group not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        const result = await api.UpdateCloudWatchLogGroupTag(
            awsResourceNode.Region,
            awsResourceNode.LogGroup,
            this.Key,
            newValue
        );

        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateCloudWatchLogGroupTag Error !!!', result.error);
            ui.showErrorMessage('Update Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        this.Value = newValue;
        this.description = newValue;
        ui.showInfoMessage('Tag Updated Successfully');
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }

    async handleNodeRefresh() {
        const awsResourceNode = this.GetAwsResourceNode();
        if (!(awsResourceNode instanceof CloudWatchLogGroupNode)) {
            ui.logToOutput('CloudWatchLogTagNode.NodeRefresh - Parent CloudWatch Log Group not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        const result = await api.GetLogGroupTags(
            awsResourceNode.Region,
            awsResourceNode.LogGroup
        );

        this.StopWorking();

        if (!result.isSuccessful) {
            ui.logToOutput('api.GetLogGroupTags Error !!!', result.error);
            ui.showErrorMessage('Refresh Tag Error !!!', result.error);
            return;
        }

        const tag = result.result?.find(t => t.key === this.Key);
        if (tag) {
            this.Value = tag.value;
            this.description = tag.value;
            this.Parent?.NodeRefresh();
        } else {
            ui.showWarningMessage(`Tag '${this.Key}' no longer exists`);
            this.Parent?.NodeRefresh();
        }
    }
}
