import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { v4 as uuidv4 } from 'uuid';
import { SQSQueueNode } from './SQSQueueNode';
import { SQSSendGroupNode } from './SQSSendGroupNode';
import * as fs from 'fs';
import * as path from 'path';

export class SQSSendFileNode extends NodeBase {

    constructor(filePath: string, parent?: NodeBase, fileId?: string) {
        const fileName = path.basename(filePath);
        super(fileName, parent);
        this.Icon = "mail";
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.FilePath = filePath;
        this.FileId = fileId || uuidv4();
        
        // Attach event handlers
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        
        this.SetContextValue();
    }

    public FilePath: string = "";

    public FileId: string = "";

    public GetQueueNode(): SQSQueueNode | undefined {
        if (this.Parent instanceof SQSSendGroupNode) {
            return this.Parent.GetQueueNode();
        }
        return undefined;
    }

    private async handleNodeOpen(): Promise<void> {
        if (this.FilePath && fs.existsSync(this.FilePath)) {
            const document = await vscode.workspace.openTextDocument(this.FilePath);
            await vscode.window.showTextDocument(document);
        } else {
            ui.showWarningMessage('File not found: ' + this.FilePath);
        }
    }

    private handleNodeRemove(): void {
        const queueNode = this.GetQueueNode();
        if (queueNode) {
            queueNode.RemoveMessageFile(this.FileId);
            this.Remove();
        }
    }

    private async handleNodeRun(): Promise<void> {
        ui.logToOutput('SQSSendFileNode.handleNodeRun Started');

        const queueNode = this.GetQueueNode();
        if (!queueNode || !queueNode.QueueUrl || !queueNode.Region) {
            ui.showWarningMessage('Queue information is not available.');
            return;
        }

        if (!this.FilePath || !fs.existsSync(this.FilePath)) {
            ui.showWarningMessage('Message file not found: ' + this.FilePath);
            return;
        }

        if (this.IsWorking) {
            return;
        }

        // Read file content
        let messageBody: string;
        try {
            messageBody = fs.readFileSync(this.FilePath, 'utf-8');
        } catch (error: any) {
            ui.showErrorMessage('Failed to read file', error);
            return;
        }

        // Validate JSON if file is .json
        if (this.FilePath.endsWith('.json') && !ui.isJsonString(messageBody)) {
            ui.showWarningMessage('File contains invalid JSON');
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
            ui.logToOutput('SQSSendFileNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Send Message Error !!!', error);
        }

        this.StopWorking();
    }
}

