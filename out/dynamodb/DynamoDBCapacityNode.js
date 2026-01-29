"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBCapacityNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const TreeProvider_1 = require("../tree/TreeProvider");
class DynamoDBCapacityNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "dashboard";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }
    BillingMode = "";
    ReadCapacity = 0;
    WriteCapacity = 0;
    async handleNodeRefresh() {
        ui.logToOutput('DynamoDBCapacityNode.handleNodeRefresh Started');
        const tableNode = this.Parent;
        if (!tableNode || !tableNode.TableName) {
            ui.logToOutput('DynamoDBCapacityNode.handleNodeRefresh - Parent table node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
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
            }
            else {
                this.label = `Capacity: RCU=${this.ReadCapacity}, WCU=${this.WriteCapacity}`;
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBCapacityNode.handleNodeRefresh Error !!!', error);
            ui.showErrorMessage('Load Capacity Error !!!', error);
        }
        finally {
            this.StopWorking();
            TreeProvider_1.TreeProvider.Current.Refresh(this);
        }
    }
    handleNodeOpen() {
        const info = this.BillingMode === 'PAY_PER_REQUEST'
            ? 'Billing Mode: On-Demand (PAY_PER_REQUEST)'
            : `Billing Mode: Provisioned (RCU: ${this.ReadCapacity}, WCU: ${this.WriteCapacity})`;
        vscode.env.clipboard.writeText(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }
}
exports.DynamoDBCapacityNode = DynamoDBCapacityNode;
//# sourceMappingURL=DynamoDBCapacityNode.js.map