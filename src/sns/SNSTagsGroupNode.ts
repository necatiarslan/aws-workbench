import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { SNSTopicNode } from './SNSTopicNode';
import { SNSTagNode } from './SNSTagNode';

export class SNSTagsGroupNode extends NodeBase {

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
        ui.logToOutput('SNSTagsGroupNode.NodeRefresh Started');

        const topicNode = this.Parent as SNSTopicNode;
        if (!topicNode || !topicNode.TopicArn || !topicNode.Region) {
            ui.logToOutput('SNSTagsGroupNode.NodeRefresh - Parent SNS topic node not found');
            return;
        }

        // if (this.IsWorking) {
        //     return;
        // }

        this.StartWorking();

        const result = await api.GetTopicTags(topicNode.Region, topicNode.TopicArn);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetTopicTags Error !!!', result.error);
            ui.showErrorMessage('Get Topic Tags Error !!!', result.error);
            this.StopWorking();
            return;
        }

        this.Children = [];

        const tags = result.result || [];
        for (const tag of tags) {
            new SNSTagNode(tag.key, tag.value, this);
        }

        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }

        this.StopWorking();
        this.RefreshTree();
    }

    public async handleNodeAdd(): Promise<void> {
        ui.logToOutput('SNSTagsGroupNode.NodeAdd Started');

        const topicNode = this.Parent as SNSTopicNode;
        if (!topicNode || !topicNode.TopicArn || !topicNode.Region) {
            ui.logToOutput('SNSTagsGroupNode.NodeAdd - Parent SNS topic node not found');
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

        const result = await api.UpdateSNSTopicTag(topicNode.Region, topicNode.TopicArn, key, value);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateSNSTopicTag Error !!!', result.error);
            ui.showErrorMessage('Add Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Added Successfully');
        await this.handleNodeRefresh();
    }
}
