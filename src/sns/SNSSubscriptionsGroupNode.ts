import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { SNSTopicNode } from './SNSTopicNode';
import { SNSSubscriptionNode } from './SNSSubscriptionNode';

export class SNSSubscriptionsGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "organization";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Attach event handlers
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeLoadChildren());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        
        this.SetContextValue();
    }

    private async handleNodeLoadChildren(): Promise<void> {
        await this.loadSubscriptions();
    }

    private async handleNodeRefresh(): Promise<void> {
        // Clear existing subscription children (keep only this node's structure)
        this.ClearSubscriptionChildren();
        await this.loadSubscriptions();
    }

    private ClearSubscriptionChildren(): void {
        // Remove all SNSSubscriptionNode children
        const subscriptionNodes = this.Children.filter(c => c instanceof SNSSubscriptionNode);
        for (const node of subscriptionNodes) {
            node.Remove();
        }
    }

    private async loadSubscriptions(): Promise<void> {
        ui.logToOutput('SNSSubscriptionsGroupNode.loadSubscriptions Started');

        const topicNode = this.Parent as SNSTopicNode;
        if (!topicNode || !topicNode.TopicArn || !topicNode.Region) {
            ui.showWarningMessage('Topic ARN or region is not set.');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        try {
            const result = await api.GetSubscriptions(topicNode.Region, topicNode.TopicArn);

            if (!result.isSuccessful) {
                ui.logToOutput('api.GetSubscriptions Error !!!', result.error);
                ui.showErrorMessage('Get Subscriptions Error !!!', result.error);
                return;
            }

            const subscriptions = result.result || [];
            ui.logToOutput('api.GetSubscriptions Success - Found ' + subscriptions.length + ' subscriptions');

            for (const sub of subscriptions) {
                if (sub.SubscriptionArn && sub.Protocol && sub.Endpoint) {
                    new SNSSubscriptionNode(
                        sub.Protocol,
                        sub.Endpoint,
                        sub.SubscriptionArn,
                        this
                    );
                }
            }

            this.RefreshTree()
        } catch (error: any) {
            ui.logToOutput('SNSSubscriptionsGroupNode.loadSubscriptions Error !!!', error);
            ui.showErrorMessage('Load Subscriptions Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }

    private async handleNodeAdd(): Promise<void> {
        ui.logToOutput('SNSSubscriptionsGroupNode.handleNodeAdd Started');

        const topicNode = this.Parent as SNSTopicNode;
        if (!topicNode || !topicNode.TopicArn || !topicNode.Region) {
            ui.showWarningMessage('Topic ARN or region is not set.');
            return;
        }

        // Show quick pick for protocol selection
        const protocolItems = api.SUBSCRIPTION_PROTOCOLS.map(p => ({
            label: p.label,
            description: p.description,
            value: p.value
        }));

        const selectedProtocol = await vscode.window.showQuickPick(protocolItems, {
            placeHolder: 'Select subscription protocol',
            canPickMany: false
        });

        if (!selectedProtocol) { return; }

        // Prompt for endpoint based on protocol
        let endpointPlaceholder: string;
        let endpointPrompt: string;

        switch (selectedProtocol.value) {
            case 'email':
            case 'email-json':
                endpointPlaceholder = 'user@example.com';
                endpointPrompt = 'Enter email address';
                break;
            case 'sqs':
                endpointPlaceholder = 'arn:aws:sqs:region:account-id:queue-name';
                endpointPrompt = 'Enter SQS queue ARN';
                break;
            case 'lambda':
                endpointPlaceholder = 'arn:aws:lambda:region:account-id:function:function-name';
                endpointPrompt = 'Enter Lambda function ARN';
                break;
            case 'http':
                endpointPlaceholder = 'http://example.com/endpoint';
                endpointPrompt = 'Enter HTTP endpoint URL';
                break;
            case 'https':
                endpointPlaceholder = 'https://example.com/endpoint';
                endpointPrompt = 'Enter HTTPS endpoint URL';
                break;
            default:
                endpointPlaceholder = 'Enter endpoint';
                endpointPrompt = 'Enter endpoint';
        }

        const endpoint = await vscode.window.showInputBox({
            placeHolder: endpointPlaceholder,
            prompt: endpointPrompt,
            ignoreFocusOut: true
        });

        if (!endpoint || endpoint.trim().length === 0) { return; }

        this.StartWorking();

        try {
            const result = await api.Subscribe(
                topicNode.Region,
                topicNode.TopicArn,
                selectedProtocol.value,
                endpoint.trim()
            );

            if (!result.isSuccessful) {
                ui.logToOutput('api.Subscribe Error !!!', result.error);
                ui.showErrorMessage('Subscribe Error !!!', result.error);
                return;
            }

            const subscriptionArn = result.result?.SubscriptionArn || 'PendingConfirmation';
            
            // Create the new subscription node
            new SNSSubscriptionNode(
                selectedProtocol.value,
                endpoint.trim(),
                subscriptionArn,
                this
            );

            this.RefreshTree()

            if (api.IsSubscriptionPending(subscriptionArn)) {
                ui.showInfoMessage('Subscription created. Confirmation pending - check email/endpoint for confirmation link.');
            } else {
                ui.showInfoMessage('Subscription created successfully.');
            }
        } catch (error: any) {
            ui.logToOutput('SNSSubscriptionsGroupNode.handleNodeAdd Error !!!', error);
            ui.showErrorMessage('Subscribe Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }
}