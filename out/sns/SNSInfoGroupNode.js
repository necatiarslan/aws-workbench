"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SNSInfoGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const SNSInfoNode_1 = require("./SNSInfoNode");
class SNSInfoGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "info";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('SNSInfoGroupNode.NodeRefresh Started');
        // Get the parent SNS topic node
        const topicNode = this.Parent;
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
            new SNSInfoNode_1.SNSInfoNode(item.key, item.value, this);
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        this.StopWorking();
        this.RefreshTree();
    }
}
exports.SNSInfoGroupNode = SNSInfoGroupNode;
//# sourceMappingURL=SNSInfoGroupNode.js.map