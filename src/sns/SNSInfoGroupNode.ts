import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import * as api from './API';
import { SNSTopicNode } from './SNSTopicNode';
import { SNSInfoNode } from './SNSInfoNode';

export class SNSInfoGroupNode extends NodeBase {

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
        ui.logToOutput('SNSInfoGroupNode.NodeRefresh Started');

        // Get the parent SNS topic node
        const topicNode = this.Parent as SNSTopicNode;
        if (!topicNode || !topicNode.TopicArn || !topicNode.Region) {
            ui.logToOutput('SNSInfoGroupNode.NodeRefresh - Parent SNS topic node not found or missing data');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        // Clear existing children
        this.Children = [];

        const attributes = await topicNode.Attributes;
        
        // Add info items as children
        const infoItems = [
            { key: 'TopicName', value: topicNode.TopicName || 'N/A' },
            { key: 'TopicArn', value: topicNode.TopicArn || 'N/A' },
            { key: 'Region', value: topicNode.Region || 'N/A' },
            { key: 'Owner', value: attributes?.Owner || 'N/A' },
            { key: 'DisplayName', value: attributes?.DisplayName || 'N/A' },
            { key: 'SubscriptionsPending', value: attributes?.SubscriptionsPending || 'N/A' },
            { key: 'SubscriptionsConfirmed', value: attributes?.SubscriptionsConfirmed || 'N/A' },
            { key: 'SubscriptionsDeleted', value: attributes?.SubscriptionsDeleted || 'N/A' },
            { key: 'DeliveryPolicy', value: attributes?.DeliveryPolicy || 'N/A' },
            { key: 'EffectiveDeliveryPolicy', value: attributes?.EffectiveDeliveryPolicy || 'N/A' }
        ];

        for (const item of infoItems) {
            new SNSInfoNode(item.key, item.value, this);
        }

        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }

        this.StopWorking();
        this.RefreshTree();
    }
}
