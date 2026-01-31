import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { SNSTopicNode } from './SNSTopicNode';

export class SNSSubscriptionNode extends NodeBase {

    public Protocol: string = "";
    public Endpoint: string = "";
    public SubscriptionArn: string = "";

    constructor(protocol: string, endpoint: string, subscriptionArn: string, parent?: NodeBase) {
        // Build label with pending status indicator
        const isPending = api.IsSubscriptionPending(subscriptionArn);
        const label = isPending 
            ? `${protocol.toUpperCase()}: ${endpoint} (pending)`
            : `${protocol.toUpperCase()}: ${endpoint}`;
        
        super(label, parent);
        
        this.Protocol = protocol;
        this.Endpoint = endpoint;
        this.SubscriptionArn = subscriptionArn;
        
        // Set icon based on protocol
        this.Icon = this.getIconForProtocol(protocol);
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.tooltip = `Protocol: ${protocol}\nEndpoint: ${endpoint}\nARN: ${subscriptionArn}`;

        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        
        this.SetContextValue();
    }

    private getIconForProtocol(protocol: string): string {
        switch (protocol.toLowerCase()) {
            case 'email':
            case 'email-json':
                return 'mail';
            case 'sqs':
                return 'inbox';
            case 'lambda':
                return 'symbol-function';
            case 'http':
            case 'https':
                return 'globe';
            default:
                return 'person';
        }
    }

    public get IsPending(): boolean {
        return api.IsSubscriptionPending(this.SubscriptionArn);
    }

    private async handleNodeRemove(): Promise<void> {
        ui.logToOutput('SNSSubscriptionNode.handleNodeRemove Started');

        // If pending, just remove from tree without calling API
        if (this.IsPending) {
            ui.showInfoMessage('Pending subscription removed from view. It will be deleted automatically if not confirmed.');
            this.Remove();
            this.RefreshTree(this.Parent);
            return;
        }

        // Confirm deletion
        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to unsubscribe "${this.Protocol}: ${this.Endpoint}"?`,
            { modal: true },
            'Yes', 'No'
        );

        if (confirm !== 'Yes') { return; }

        const topicNode = this.GetAwsResourceNode() as SNSTopicNode;
        if (!topicNode || !topicNode.Region) {
            ui.showWarningMessage('Region is not set.');
            return;
        }

        this.StartWorking();

        try {
            const result = await api.Unsubscribe(topicNode.Region, this.SubscriptionArn);

            if (!result.isSuccessful) {
                ui.logToOutput('api.Unsubscribe Error !!!', result.error);
                ui.showErrorMessage('Unsubscribe Error !!!', result.error);
                return;
            }

            ui.logToOutput('api.Unsubscribe Success');
            ui.showInfoMessage('Subscription removed successfully.');

            this.Remove();
            this.RefreshTree(this.Parent);
        } catch (error: any) {
            ui.logToOutput('SNSSubscriptionNode.handleNodeRemove Error !!!', error);
            ui.showErrorMessage('Unsubscribe Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }

    private async handleNodeInfo(): Promise<void> {
        ui.logToOutput('SNSSubscriptionNode.handleNodeInfo Started');

        const info = {
            Protocol: this.Protocol,
            Endpoint: this.Endpoint,
            SubscriptionArn: this.SubscriptionArn,
            Status: this.IsPending ? 'Pending Confirmation' : 'Confirmed'
        };

        ui.showOutputMessage(JSON.stringify(info, null, 2), 'Subscription info printed to OUTPUT');
    }
}
