import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { SNSTopicNode } from './SNSTopicNode';

export class SNSTagNode extends NodeBase {

    constructor(Key: string, Value: string, parent?: NodeBase) 
    {
        super(Key, parent);
        this.Icon = "circle-outline";
        this.Key = Key;
        this.Value = Value;
        this.description = Value;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;

        this.OnNodeCopy.subscribe(() => this.handleNodeCopy());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
    }

    public Key: string = "";
    public Value: string = "";

    private async handleNodeCopy(): Promise<void> {
        const info = `${this.Key}: ${this.Value}`;
        ui.CopyToClipboard(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }

    public async handleNodeRemove(): Promise<void> {
        ui.logToOutput('SNSTagNode.NodeRemove Started');

        if (!this.Key) { return; }

        const confirmation = await vscode.window.showWarningMessage(
            `Are you sure you want to remove tag "${this.Key}"?`,
            { modal: true },
            'Yes',
            'No'
        );

        if (confirmation !== 'Yes') { return; }

        const topicNode = this.GetAwsResourceNode() as SNSTopicNode;
        if (!topicNode || !topicNode.TopicArn || !topicNode.Region) {
            ui.logToOutput('SNSTagNode.NodeRemove - Parent SNS topic node not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        const result = await api.RemoveSNSTopicTag(topicNode.Region, topicNode.TopicArn, this.Key);
        if (!result.isSuccessful) {
            ui.logToOutput('api.RemoveSNSTopicTag Error !!!', result.error);
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
        ui.logToOutput('SNSTagNode.NodeEdit Started');

        const newValue = await vscode.window.showInputBox({
            value: this.Value,
            placeHolder: 'Enter New Value for ' + this.Key
        });
        if (newValue === undefined) { return; }

        if (!this.Key) { return; }

        const topicNode = this.GetAwsResourceNode() as SNSTopicNode;
        if (!topicNode || !topicNode.TopicArn || !topicNode.Region) {
            ui.logToOutput('SNSTagNode.NodeEdit - Parent SNS topic node not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        const result = await api.UpdateSNSTopicTag(topicNode.Region, topicNode.TopicArn, this.Key, newValue);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateSNSTopicTag Error !!!', result.error);
            ui.showErrorMessage('Update Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Updated Successfully');
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }
}
