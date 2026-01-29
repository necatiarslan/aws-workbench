import { NodeBase } from '../tree/NodeBase';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { SQSQueueNode } from './SQSQueueNode';
import { SQSReceivedMessageNode } from './SQSReceivedMessageNode';

export class SQSReceiveGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "inbox";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        
        // Attach event handlers
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        
        this.SetContextValue();
    }

    public GetQueueNode(): SQSQueueNode | undefined {
        if (this.Parent instanceof SQSQueueNode) {
            return this.Parent;
        }
        return undefined;
    }

    private async handleNodeRefresh(): Promise<void> {
        // Clear existing message nodes
        this.ClearReceivedMessages();
    }

    public ClearReceivedMessages(): void {
        // Remove all child nodes that are received messages
        const messagesToRemove = this.Children.filter(child => child instanceof SQSReceivedMessageNode);
        for (const msg of messagesToRemove) {
            msg.Remove();
        }
    }

    private async handleNodeRun(): Promise<void> {
        ui.logToOutput('SQSReceiveGroupNode.handleNodeRun Started');

        const queueNode = this.GetQueueNode();
        if (!queueNode || !queueNode.QueueUrl || !queueNode.Region) {
            ui.showWarningMessage('Queue information is not available.');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        // Prompt for number of messages to receive
        const maxMessagesStr = await vscode.window.showInputBox({
            value: '10',
            placeHolder: 'Number of messages (1-10)',
            prompt: 'How many messages to receive?'
        });

        if (maxMessagesStr === undefined) {
            return;
        }

        const maxMessages = parseInt(maxMessagesStr, 10);
        if (isNaN(maxMessages) || maxMessages < 1 || maxMessages > 10) {
            ui.showWarningMessage('Please enter a number between 1 and 10');
            return;
        }

        // Prompt for wait time (long polling)
        const waitTimeStr = await vscode.window.showInputBox({
            value: '0',
            placeHolder: 'Wait time in seconds (0-20)',
            prompt: 'Wait time for long polling (0 for short polling)'
        });

        if (waitTimeStr === undefined) {
            return;
        }

        const waitTime = parseInt(waitTimeStr, 10);
        if (isNaN(waitTime) || waitTime < 0 || waitTime > 20) {
            ui.showWarningMessage('Please enter a number between 0 and 20');
            return;
        }

        this.StartWorking();

        try {
            const result = await api.ReceiveMessages(
                queueNode.Region,
                queueNode.QueueUrl,
                maxMessages,
                waitTime
            );

            if (!result.isSuccessful) {
                ui.logToOutput('api.ReceiveMessages Error !!!', result.error);
                ui.showErrorMessage('Receive Messages Error !!!', result.error);
                this.StopWorking();
                return;
            }

            if (!result.result || result.result.length === 0) {
                ui.showInfoMessage('No messages available in the queue');
                this.StopWorking();
                return;
            }

            // Create nodes for received messages
            for (const message of result.result) {
                new SQSReceivedMessageNode(message, this);
            }

            ui.showInfoMessage(`Received ${result.result.length} message(s)`);
            ui.logToOutput('Messages received: ' + result.result.length);

        } catch (error: any) {
            ui.logToOutput('SQSReceiveGroupNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Receive Messages Error !!!', error);
        }

        this.StopWorking();
    }
}

