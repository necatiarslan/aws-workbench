"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSInfoGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const SQSQueueNode_1 = require("./SQSQueueNode");
const SQSInfoNode_1 = require("./SQSInfoNode");
const SQSDlqLinkNode_1 = require("./SQSDlqLinkNode");
class SQSInfoGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "info";
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
            new SQSInfoNode_1.SQSInfoNode('ARN', attrs.QueueArn || 'N/A', this);
            new SQSInfoNode_1.SQSInfoNode('Type', attrs.IsFifo ? 'FIFO' : 'Standard', this);
            new SQSInfoNode_1.SQSInfoNode('Messages', String(attrs.ApproximateNumberOfMessages ?? 0), this);
            new SQSInfoNode_1.SQSInfoNode('In Flight', String(attrs.ApproximateNumberOfMessagesNotVisible ?? 0), this);
            new SQSInfoNode_1.SQSInfoNode('Delayed', String(attrs.ApproximateNumberOfMessagesDelayed ?? 0), this);
            new SQSInfoNode_1.SQSInfoNode('Visibility Timeout', `${attrs.VisibilityTimeout || 0} sec`, this);
            new SQSInfoNode_1.SQSInfoNode('Max Message Size', `${attrs.MaximumMessageSize || 0} bytes`, this);
            new SQSInfoNode_1.SQSInfoNode('Retention Period', `${attrs.MessageRetentionPeriod || 0} sec`, this);
            new SQSInfoNode_1.SQSInfoNode('Delay', `${attrs.DelaySeconds || 0} sec`, this);
            if (attrs.IsFifo) {
                new SQSInfoNode_1.SQSInfoNode('Content Deduplication', attrs.ContentBasedDeduplication || 'false', this);
            }
            // Add DLQ link if configured
            if (attrs.DlqQueueArn) {
                new SQSDlqLinkNode_1.SQSDlqLinkNode('Dead Letter Queue', attrs.DlqQueueArn, this);
            }
            if (attrs.CreatedTimestamp) {
                const createdDate = new Date(parseInt(attrs.CreatedTimestamp) * 1000);
                new SQSInfoNode_1.SQSInfoNode('Created', createdDate.toISOString(), this);
            }
            if (attrs.LastModifiedTimestamp) {
                const modifiedDate = new Date(parseInt(attrs.LastModifiedTimestamp) * 1000);
                new SQSInfoNode_1.SQSInfoNode('Last Modified', modifiedDate.toISOString(), this);
            }
        }
        catch (error) {
            ui.logToOutput('SQSDetailsGroupNode.LoadQueueDetails Error !!!', error);
        }
        this.StopWorking();
    }
}
exports.SQSInfoGroupNode = SQSInfoGroupNode;
//# sourceMappingURL=SQSInfoGroupNode.js.map