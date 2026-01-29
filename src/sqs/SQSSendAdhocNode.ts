import { NodeBase } from '../tree/NodeBase';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { SQSQueueNode } from './SQSQueueNode';
import { SQSSendGroupNode } from './SQSSendGroupNode';

export class SQSSendAdhocNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "report";
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        
        // Attach event handlers
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        
        this.SetContextValue();
    }

    public GetQueueNode(): SQSQueueNode | undefined {
        if (this.Parent instanceof SQSSendGroupNode) {
            return this.Parent.GetQueueNode();
        }
        return undefined;
    }

    private async handleNodeRun(): Promise<void> {
        ui.logToOutput('SQSSendAdhocNode.handleNodeRun Started');

        const queueNode = this.GetQueueNode();
        if (!queueNode || !queueNode.QueueUrl || !queueNode.Region) {
            ui.showWarningMessage('Queue information is not available.');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        // Prompt for message body
        const messageBody = await vscode.window.showInputBox({
            value: '',
            placeHolder: 'Enter message body (JSON or plain text)',
            prompt: 'Message content to send to the queue'
        });

        if (messageBody === undefined || messageBody.trim().length === 0) {
            return;
        }

        let messageGroupId: string | undefined;
        let messageDeduplicationId: string | undefined;

        // If FIFO queue, prompt for MessageGroupId (required) and DeduplicationId (optional)
        if (queueNode.IsFifo) {
            messageGroupId = await vscode.window.showInputBox({
                value: 'default',
                placeHolder: 'Message Group ID (required for FIFO)',
                prompt: 'Messages with the same group ID are processed in order'
            });

            if (messageGroupId === undefined || messageGroupId.trim().length === 0) {
                ui.showWarningMessage('Message Group ID is required for FIFO queues.');
                return;
            }

            messageDeduplicationId = await vscode.window.showInputBox({
                value: '',
                placeHolder: 'Message Deduplication ID (optional)',
                prompt: 'Leave empty for content-based deduplication (if enabled)'
            });

            if (messageDeduplicationId === '') {
                messageDeduplicationId = undefined;
            }
        }

        this.StartWorking();

        try {
            const result = await api.SendMessage(
                queueNode.Region,
                queueNode.QueueUrl,
                messageBody,
                messageGroupId,
                messageDeduplicationId
            );

            if (!result.isSuccessful) {
                ui.logToOutput('api.SendMessage Error !!!', result.error);
                ui.showErrorMessage('Send Message Error !!!', result.error);
                this.StopWorking();
                return;
            }

            ui.showInfoMessage(`Message sent successfully! MessageId: ${result.result?.MessageId}`);
            ui.logToOutput('Message sent successfully: ' + result.result?.MessageId);

        } catch (error: any) {
            ui.logToOutput('SQSSendAdhocNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Send Message Error !!!', error);
        }

        this.StopWorking();
    }
}

