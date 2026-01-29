import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { TreeProvider } from '../tree/TreeProvider';
import { DynamoDBTableNode } from './DynamoDBTableNode';

export class DynamoDBCapacityNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) {
        super(Label, parent);
        this.Icon = "dashboard";
        
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }

    public BillingMode: string = "";
    public ReadCapacity: number = 0;
    public WriteCapacity: number = 0;

    public async handleNodeRefresh(): Promise<void> {
        ui.logToOutput('DynamoDBCapacityNode.handleNodeRefresh Started');

        const tableNode = this.Parent as DynamoDBTableNode;
        if (!tableNode || !tableNode.TableName) {
            ui.logToOutput('DynamoDBCapacityNode.handleNodeRefresh - Parent table node not found');
            return;
        }

        if (this.IsWorking) { return; }

        this.StartWorking();

        try {
            const details = await tableNode.TableDetails;
            if (!details) {
                this.StopWorking();
                return;
            }

            this.BillingMode = details.billingMode || 'PROVISIONED';
            this.ReadCapacity = details.readCapacity || 0;
            this.WriteCapacity = details.writeCapacity || 0;

            if (this.BillingMode === 'PAY_PER_REQUEST') {
                this.label = "Capacity: On-Demand";
            } else {
                this.label = `Capacity: RCU=${this.ReadCapacity}, WCU=${this.WriteCapacity}`;
            }

        } catch (error: any) {
            ui.logToOutput('DynamoDBCapacityNode.handleNodeRefresh Error !!!', error);
            ui.showErrorMessage('Load Capacity Error !!!', error);
        } finally {
            this.StopWorking();
            TreeProvider.Current.Refresh(this);
        }
    }

    private handleNodeOpen(): void {
        const info = this.BillingMode === 'PAY_PER_REQUEST' 
            ? 'Billing Mode: On-Demand (PAY_PER_REQUEST)'
            : `Billing Mode: Provisioned (RCU: ${this.ReadCapacity}, WCU: ${this.WriteCapacity})`;
        vscode.env.clipboard.writeText(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }
}
