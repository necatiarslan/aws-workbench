import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import { CloudWatchLogTagNode } from './CloudWatchLogTagNode';
import { CloudWatchLogGroupNode } from './CloudWatchLogGroupNode';

export class CloudWatchLogTagsGroupNode extends NodeBase {
    constructor(label: string, parent: NodeBase) {
        super(label, parent);
        this.Icon = "tag";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
    }

    SetContextValue(): void {
        this.contextValue = "AwsWorkbenchCloudWatchLogTagsGroupNode";
        this.contextValue += "#CanRefresh#";
        this.contextValue += "#CanAdd#";
    }

    async handleNodeRefresh() {
        ui.logToOutput('CloudWatchLogTagsGroupNode.NodeRefresh Started');

        const awsResourceNode = this.GetAwsResourceNode();
        if (!(awsResourceNode instanceof CloudWatchLogGroupNode)) {
            ui.logToOutput('CloudWatchLogTagsGroupNode.NodeRefresh - Parent CloudWatch Log Group not found');
            return;
        }

        // if (this.IsWorking) {
        //     return;
        // }

        this.StartWorking();

        const result = await api.GetLogGroupTags(
            awsResourceNode.Region,
            awsResourceNode.LogGroupName
        );

        if (!result.isSuccessful) {
            ui.logToOutput('api.GetLogGroupTags Error !!!', result.error);
            ui.showErrorMessage('Get Log Group Tags Error !!!', result.error);
            this.StopWorking();
            return;
        }

        this.Children = [];

        const tags = result.result || [];
        for (const tag of tags) {
            new CloudWatchLogTagNode(tag.key, tag.value, this);
        }

        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }

        this.StopWorking();
        this.RefreshTree();
    }

    async handleNodeAdd() {
        ui.logToOutput('CloudWatchLogTagsGroupNode.NodeAdd Started');

        const key = await vscode.window.showInputBox({
            prompt: 'Tag Key',
            placeHolder: 'Enter tag key'
        });

        if (!key) {
            return;
        }

        const value = await vscode.window.showInputBox({
            prompt: 'Tag Value',
            placeHolder: 'Enter tag value'
        });

        if (value === undefined) {
            return;
        }

        const awsResourceNode = this.GetAwsResourceNode();
        if (!(awsResourceNode instanceof CloudWatchLogGroupNode)) {
            ui.logToOutput('CloudWatchLogTagsGroupNode.NodeAdd - Parent CloudWatch Log Group not found');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        const result = await api.UpdateCloudWatchLogGroupTag(
            awsResourceNode.Region,
            awsResourceNode.LogGroupName,
            key,
            value
        );

        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateCloudWatchLogGroupTag Error !!!', result.error);
            ui.showErrorMessage('Add Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Added Successfully');
        this.StopWorking();
        await this.handleNodeRefresh();
    }
}


// Register with NodeRegistry for deserialization
NodeRegistry.register('CloudWatchLogTagsGroupNode', CloudWatchLogTagsGroupNode);
