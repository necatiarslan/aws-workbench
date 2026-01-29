"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSDetailsGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const SQSQueueNode_1 = require("./SQSQueueNode");
const SQSDetailsNode_1 = require("./SQSDetailsNode");
const SQSDlqLinkNode_1 = require("./SQSDlqLinkNode");
class SQSDetailsGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "list-flat";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        // Attach event handlers
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        this.SetContextValue();
    }
    GetQueueNode() {
        if (this.Parent instanceof SQSQueueNode_1.SQSQueueNode) {
            return this.Parent;
        }
        return undefined;
    }
    async handleNodeRefresh() {
        // Clear existing detail nodes
        this.ClearDetailNodes();
        // Reload details
        await this.LoadQueueDetails();
    }
    async handleLoadChildren() {
        if (this.Children.length === 0) {
            await this.LoadQueueDetails();
        }
    }
    ClearDetailNodes() {
        const nodesToRemove = [...this.Children];
        for (const node of nodesToRemove) {
            node.Remove();
        }
    }
    async LoadQueueDetails() {
        const queueNode = this.GetQueueNode();
        if (!queueNode || !queueNode.QueueUrl || !queueNode.Region) {
            return;
        }
        this.StartWorking();
        try {
            const result = await api.GetQueueAttributes(queueNode.Region, queueNode.QueueUrl);
            if (!result.isSuccessful || !result.result) {
                ui.logToOutput('api.GetQueueAttributes Error !!!', result.error);
                this.StopWorking();
                return;
            }
            const attrs = result.result;
            // Create detail nodes for each attribute
            new SQSDetailsNode_1.SQSDetailsNode('ARN', attrs.QueueArn || 'N/A', this);
            new SQSDetailsNode_1.SQSDetailsNode('Type', attrs.IsFifo ? 'FIFO' : 'Standard', this);
            new SQSDetailsNode_1.SQSDetailsNode('Messages', String(attrs.ApproximateNumberOfMessages ?? 0), this);
            new SQSDetailsNode_1.SQSDetailsNode('In Flight', String(attrs.ApproximateNumberOfMessagesNotVisible ?? 0), this);
            new SQSDetailsNode_1.SQSDetailsNode('Delayed', String(attrs.ApproximateNumberOfMessagesDelayed ?? 0), this);
            new SQSDetailsNode_1.SQSDetailsNode('Visibility Timeout', `${attrs.VisibilityTimeout || 0} sec`, this);
            new SQSDetailsNode_1.SQSDetailsNode('Max Message Size', `${attrs.MaximumMessageSize || 0} bytes`, this);
            new SQSDetailsNode_1.SQSDetailsNode('Retention Period', `${attrs.MessageRetentionPeriod || 0} sec`, this);
            new SQSDetailsNode_1.SQSDetailsNode('Delay', `${attrs.DelaySeconds || 0} sec`, this);
            if (attrs.IsFifo) {
                new SQSDetailsNode_1.SQSDetailsNode('Content Deduplication', attrs.ContentBasedDeduplication || 'false', this);
            }
            // Add DLQ link if configured
            if (attrs.DlqQueueArn) {
                new SQSDlqLinkNode_1.SQSDlqLinkNode('Dead Letter Queue', attrs.DlqQueueArn, this);
            }
            if (attrs.CreatedTimestamp) {
                const createdDate = new Date(parseInt(attrs.CreatedTimestamp) * 1000);
                new SQSDetailsNode_1.SQSDetailsNode('Created', createdDate.toISOString(), this);
            }
            if (attrs.LastModifiedTimestamp) {
                const modifiedDate = new Date(parseInt(attrs.LastModifiedTimestamp) * 1000);
                new SQSDetailsNode_1.SQSDetailsNode('Last Modified', modifiedDate.toISOString(), this);
            }
        }
        catch (error) {
            ui.logToOutput('SQSDetailsGroupNode.LoadQueueDetails Error !!!', error);
        }
        this.StopWorking();
    }
}
exports.SQSDetailsGroupNode = SQSDetailsGroupNode;
//# sourceMappingURL=SQSDetailsGroupNode.js.map