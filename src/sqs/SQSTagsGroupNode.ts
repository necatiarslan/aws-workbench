import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { SQSQueueNode } from './SQSQueueNode';
import { SQSTagNode } from './SQSTagNode';

export class SQSTagsGroupNode extends NodeBase {

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
        ui.logToOutput('SQSTagsGroupNode.NodeRefresh Started');

        const queueNode = this.Parent as SQSQueueNode;
        if (!queueNode || !queueNode.QueueUrl || !queueNode.Region) {
            ui.logToOutput('SQSTagsGroupNode.NodeRefresh - Parent SQS queue node not found');
            return;
        }

        // if (this.IsWorking) {
        //     return;
        // }

        this.StartWorking();

        const result = await api.GetQueueTags(queueNode.Region, queueNode.QueueUrl);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetQueueTags Error !!!', result.error);
            ui.showErrorMessage('Get Queue Tags Error !!!', result.error);
            this.StopWorking();
            return;
        }

        this.Children = [];

        const tags = result.result || [];
        for (const tag of tags) {
            new SQSTagNode(tag.key, tag.value, this);
        }

        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }

        this.StopWorking();
        this.RefreshTree();
    }

    public async handleNodeAdd(): Promise<void> {
        ui.logToOutput('SQSTagsGroupNode.NodeAdd Started');

        const queueNode = this.Parent as SQSQueueNode;
        if (!queueNode || !queueNode.QueueUrl || !queueNode.Region) {
            ui.logToOutput('SQSTagsGroupNode.NodeAdd - Parent SQS queue node not found');
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

        const result = await api.UpdateSQSQueueTag(queueNode.Region, queueNode.QueueUrl, key, value);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateSQSQueueTag Error !!!', result.error);
            ui.showErrorMessage('Add Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Added Successfully');
        await this.handleNodeRefresh();
    }
}
