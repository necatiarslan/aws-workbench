import { NodeBase } from '../tree/NodeBase';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { SNSTopicNode } from './SNSTopicNode';

export class SNSPublishAdhocNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "edit";
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;

        // Attach event handlers
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        
        this.SetContextValue();
    }

    private async handleNodeRun(): Promise<void> {
        ui.logToOutput('SNSPublishAdhocNode.handleNodeRun Started');

        const topicNode = this.GetAwsResourceNode() as SNSTopicNode;
        if (!topicNode || !topicNode.TopicArn || !topicNode.Region) {
            ui.showWarningMessage('Topic ARN or region is not set.');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        // Prompt for message
        const message = await vscode.window.showInputBox({
            placeHolder: 'Enter message to publish',
            prompt: 'Message content to publish to SNS topic',
            ignoreFocusOut: true
        });

        if (message === undefined || message.trim().length === 0) {
            return;
        }

        // Optional: prompt for subject (useful for email subscriptions)
        const subject = await vscode.window.showInputBox({
            placeHolder: 'Enter subject (optional, press Enter to skip)',
            prompt: 'Subject for email subscriptions (optional)'
        });

        this.StartWorking();

        try {
            const result = await api.PublishMessage(
                topicNode.Region, 
                topicNode.TopicArn, 
                message, 
                subject && subject.trim().length > 0 ? subject : undefined
            );

            if (!result.isSuccessful) {
                ui.logToOutput('api.PublishMessage Error !!!', result.error);
                ui.showErrorMessage('Publish Message Error !!!', result.error);
                return;
            }

            ui.logToOutput('api.PublishMessage Success - MessageId: ' + result.result?.MessageId);
            ui.showInfoMessage('Message published successfully. MessageId: ' + result.result?.MessageId);
        } catch (error: any) {
            ui.logToOutput('SNSPublishAdhocNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Publish Message Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }
}
