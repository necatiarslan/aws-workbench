import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { SQSQueueNode } from './SQSQueueNode';
import { SQSInfoNode } from './SQSInfoNode';
import { SQSDlqLinkNode } from './SQSDlqLinkNode';

export class SQSInfoGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "info";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        
        // Attach event handlers
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        
        this.SetContextValue();
    }

    public GetQueueNode(): SQSQueueNode | undefined {
        if (this.Parent instanceof SQSQueueNode) {
            return this.Parent;
        }
        return undefined;
    }

    private async handleNodeRefresh(): Promise<void> {
        // Clear existing detail nodes
        this.ClearDetailNodes();
        // Reload details
        await this.LoadQueueDetails();
    }

    private async handleLoadChildren(): Promise<void> {
        if (this.Children.length === 0) {
            await this.LoadQueueDetails();
        }
    }

    public ClearDetailNodes(): void {
        const nodesToRemove = [...this.Children];
        for (const node of nodesToRemove) {
            node.Remove();
        }
    }

    private async LoadQueueDetails(): Promise<void> {
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
            new SQSInfoNode('ARN', attrs.QueueArn || 'N/A', this);
            new SQSInfoNode('Type', attrs.IsFifo ? 'FIFO' : 'Standard', this);
            new SQSInfoNode('Messages', String(attrs.ApproximateNumberOfMessages ?? 0), this);
            new SQSInfoNode('In Flight', String(attrs.ApproximateNumberOfMessagesNotVisible ?? 0), this);
            new SQSInfoNode('Delayed', String(attrs.ApproximateNumberOfMessagesDelayed ?? 0), this);
            new SQSInfoNode('Visibility Timeout', `${attrs.VisibilityTimeout || 0} sec`, this);
            new SQSInfoNode('Max Message Size', `${attrs.MaximumMessageSize || 0} bytes`, this);
            new SQSInfoNode('Retention Period', `${attrs.MessageRetentionPeriod || 0} sec`, this);
            new SQSInfoNode('Delay', `${attrs.DelaySeconds || 0} sec`, this);
            
            if (attrs.IsFifo) {
                new SQSInfoNode('Content Deduplication', attrs.ContentBasedDeduplication || 'false', this);
            }

            // Add DLQ link if configured
            if (attrs.DlqQueueArn) {
                new SQSDlqLinkNode('Dead Letter Queue', attrs.DlqQueueArn, this);
            }

            if (attrs.CreatedTimestamp) {
                const createdDate = new Date(parseInt(attrs.CreatedTimestamp) * 1000);
                new SQSInfoNode('Created', createdDate.toISOString(), this);
            }

            if (attrs.LastModifiedTimestamp) {
                const modifiedDate = new Date(parseInt(attrs.LastModifiedTimestamp) * 1000);
                new SQSInfoNode('Last Modified', modifiedDate.toISOString(), this);
            }

        } catch (error: any) {
            ui.logToOutput('SQSDetailsGroupNode.LoadQueueDetails Error !!!', error);
        }

        this.StopWorking();
    }
}
