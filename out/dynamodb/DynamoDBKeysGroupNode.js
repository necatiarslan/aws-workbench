"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBKeysGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const DynamoDBKeyNode_1 = require("./DynamoDBKeyNode");
class DynamoDBKeysGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "key";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('DynamoDBKeysGroupNode.handleNodeRefresh Started');
        const tableNode = this.Parent;
        if (!tableNode || !tableNode.TableName) {
            ui.logToOutput('DynamoDBKeysGroupNode.handleNodeRefresh - Parent table node not found');
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
            // Clear existing children
            this.Children = [];
            // Add partition key
            if (details.partitionKey) {
                const keyNode = new DynamoDBKeyNode_1.DynamoDBKeyNode(`${details.partitionKey.name} (${details.partitionKey.type})`, this);
                keyNode.KeyName = details.partitionKey.name;
                keyNode.KeyType = details.partitionKey.type;
                keyNode.KeyRole = 'HASH';
            }
            // Add sort key if exists
            if (details.sortKey) {
                const keyNode = new DynamoDBKeyNode_1.DynamoDBKeyNode(`${details.sortKey.name} (${details.sortKey.type})`, this);
                keyNode.KeyName = details.sortKey.name;
                keyNode.KeyType = details.sortKey.type;
                keyNode.KeyRole = 'RANGE';
            }
            if (this.Children.length > 0) {
                this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBKeysGroupNode.handleNodeRefresh Error !!!', error);
            ui.showErrorMessage('Load Keys Error !!!', error);
        }
        finally {
            this.StopWorking();
            this.RefreshTree();
        }
    }
}
exports.DynamoDBKeysGroupNode = DynamoDBKeysGroupNode;
//# sourceMappingURL=DynamoDBKeysGroupNode.js.map