import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { v4 as uuidv4 } from 'uuid';
import { TreeState } from '../tree/TreeState';
import { SQSSendGroupNode } from './SQSSendGroupNode';
import { SQSReceiveGroupNode } from './SQSReceiveGroupNode';
import { SQSDetailsGroupNode } from './SQSDetailsGroupNode';
import { SQSPolicyNode } from './SQSPolicyNode';

export class SQSQueueNode extends NodeBase {

    constructor(QueueName: string, parent?: NodeBase) 
    {
        super(QueueName, parent);
        this.Icon = "sqs-queue";
        this.QueueName = QueueName;
        
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;

        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        
        this.LoadDefaultChildren();
        this.SetContextValue();
    }

    @Serialize()
    public QueueName: string = "";

    @Serialize()
    public QueueUrl: string = "";

    @Serialize()
    public QueueArn: string = "";

    @Serialize()
    public Region: string = "";

    @Serialize()
    public IsFifo: boolean = false;

    @Serialize()
    public DlqQueueArn?: string;

    @Serialize()
    public MessageFiles: { id: string; path: string }[] = [];

    public async LoadDefaultChildren(): Promise<void> {
        new SQSSendGroupNode("Send", this);
        new SQSReceiveGroupNode("Receive", this);
        new SQSDetailsGroupNode("Details", this);
        new SQSPolicyNode("Policy", this);
    }

    private handleNodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

    private async handleNodeInfo(): Promise<void> {
        ui.logToOutput('SQSQueueNode.handleNodeInfo Started');

        if (!this.QueueUrl || !this.Region) {
            ui.showWarningMessage('Queue URL or region is not set.');
            return;
        }

        this.StartWorking();

        try {
            const result = await api.GetQueueAttributes(this.Region, this.QueueUrl);

            if (!result.isSuccessful || !result.result) {
                ui.logToOutput('api.GetQueueAttributes Error !!!', result.error);
                ui.showErrorMessage('Get Queue Attributes Error !!!', result.error);
                this.StopWorking();
                return;
            }

            // Create a formatted JSON document with queue info
            const queueInfo = {
                QueueName: this.QueueName,
                QueueUrl: this.QueueUrl,
                QueueArn: result.result.QueueArn,
                Region: this.Region,
                Type: result.result.IsFifo ? 'FIFO' : 'Standard',
                ApproximateNumberOfMessages: result.result.ApproximateNumberOfMessages,
                ApproximateNumberOfMessagesNotVisible: result.result.ApproximateNumberOfMessagesNotVisible,
                ApproximateNumberOfMessagesDelayed: result.result.ApproximateNumberOfMessagesDelayed,
                VisibilityTimeout: result.result.VisibilityTimeout + ' seconds',
                MaximumMessageSize: result.result.MaximumMessageSize + ' bytes',
                MessageRetentionPeriod: result.result.MessageRetentionPeriod + ' seconds',
                DelaySeconds: result.result.DelaySeconds + ' seconds',
                ContentBasedDeduplication: result.result.ContentBasedDeduplication,
                DeadLetterQueue: result.result.DlqQueueArn || 'Not configured',
                CreatedTimestamp: result.result.CreatedTimestamp,
                LastModifiedTimestamp: result.result.LastModifiedTimestamp
            };

            const content = JSON.stringify(queueInfo, null, 2);
            const document = await vscode.workspace.openTextDocument({
                content: content,
                language: 'json'
            });
            await vscode.window.showTextDocument(document);

        } catch (error: any) {
            ui.logToOutput('SQSQueueNode.handleNodeInfo Error !!!', error);
            ui.showErrorMessage('Get Queue Info Error !!!', error);
        }

        this.StopWorking();
    }

    public AddMessageFile(filePath: string): void {
        const id = uuidv4();
        this.MessageFiles.push({ id, path: filePath });
        TreeState.save();
    }

    public RemoveMessageFile(id: string): void {
        this.MessageFiles = this.MessageFiles.filter(f => f.id !== id);
        TreeState.save();
    }
}

NodeRegistry.register('SQSQueueNode', SQSQueueNode);
