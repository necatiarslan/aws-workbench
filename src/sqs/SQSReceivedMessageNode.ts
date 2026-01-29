import { NodeBase } from '../tree/NodeBase';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { SQSQueueNode } from './SQSQueueNode';
import { SQSReceiveGroupNode } from './SQSReceiveGroupNode';
import { SQSMessageView } from './SQSMessageView';
import { ServiceHub } from '../tree/ServiceHub';
import { Message } from '@aws-sdk/client-sqs';

export class SQSReceivedMessageNode extends NodeBase {

    public MessageId: string = "";
    public ReceiptHandle: string = "";
    public Body: string = "";
    public Attributes: Record<string, string> = {};
    public IsDeleted: boolean = false;

    constructor(message: Message, parent?: NodeBase) {
        const msgId = message.MessageId || 'Unknown';
        const shortId = msgId.length > 20 ? msgId.substring(0, 20) + '...' : msgId;
        super(shortId, parent);
        
        this.Icon = "mail";
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        
        this.MessageId = message.MessageId || '';
        this.ReceiptHandle = message.ReceiptHandle || '';
        this.Body = message.Body || '';
        this.Attributes = message.Attributes || {};
        
        // Set description to show preview of body
        const bodyPreview = this.Body.length > 50 ? this.Body.substring(0, 50) + '...' : this.Body;
        this.description = bodyPreview;
        
        // Attach event handlers
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        
        this.SetContextValue();
    }

    public GetQueueNode(): SQSQueueNode | undefined {
        if (this.Parent instanceof SQSReceiveGroupNode) {
            return this.Parent.GetQueueNode();
        }
        return undefined;
    }

    private async handleNodeOpen(): Promise<void> {
        // Open message body in a new text document
        const content = this.formatMessageContent();
        const document = await vscode.workspace.openTextDocument({
            content: content,
            language: 'json'
        });
        await vscode.window.showTextDocument(document);
    }

    private async handleNodeView(): Promise<void> {
        // Open in webview for better viewing experience
        SQSMessageView.Render(
            ServiceHub.Current.Context.extensionUri,
            this
        );
    }

    private formatMessageContent(): string {
        const messageData = {
            MessageId: this.MessageId,
            Body: this.tryParseJson(this.Body),
            Attributes: this.Attributes,
            ReceiptHandle: this.ReceiptHandle
        };
        return JSON.stringify(messageData, null, 2);
    }

    private tryParseJson(str: string): any {
        try {
            return JSON.parse(str);
        } catch {
            return str;
        }
    }

    private async handleNodeRemove(): Promise<void> {
        ui.logToOutput('SQSReceivedMessageNode.handleNodeRemove Started');

        const queueNode = this.GetQueueNode();
        if (!queueNode || !queueNode.QueueUrl || !queueNode.Region) {
            ui.showWarningMessage('Queue information is not available.');
            return;
        }

        if (!this.ReceiptHandle) {
            ui.showWarningMessage('Receipt handle is not available.');
            this.Remove();
            return;
        }

        // Ask for confirmation
        const confirm = await vscode.window.showWarningMessage(
            `Delete message ${this.MessageId} from queue?`,
            { modal: true },
            'Delete'
        );

        if (confirm !== 'Delete') {
            return;
        }

        this.StartWorking();

        try {
            const result = await api.DeleteMessage(
                queueNode.Region,
                queueNode.QueueUrl,
                this.ReceiptHandle
            );

            if (!result.isSuccessful) {
                ui.logToOutput('api.DeleteMessage Error !!!', result.error);
                ui.showErrorMessage('Delete Message Error !!!', result.error);
                this.StopWorking();
                return;
            }

            this.IsDeleted = true;
            this.Icon = "mail-read";
            this.Remove();
            
            ui.showInfoMessage('Message deleted successfully');
            ui.logToOutput('Message deleted: ' + this.MessageId);

        } catch (error: any) {
            ui.logToOutput('SQSReceivedMessageNode.handleNodeRemove Error !!!', error);
            ui.showErrorMessage('Delete Message Error !!!', error);
        }

        this.StopWorking();
    }
}

