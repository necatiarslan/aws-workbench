"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBIndexesGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const DynamoDBIndexNode_1 = require("./DynamoDBIndexNode");
class DynamoDBIndexesGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "list-tree";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('DynamoDBIndexesGroupNode.handleNodeRefresh Started');
        const tableNode = this.Parent;
        if (!tableNode || !tableNode.TableName) {
            ui.logToOutput('DynamoDBIndexesGroupNode.handleNodeRefresh - Parent table node not found');
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
            // Add Global Secondary Indexes
            if (details.globalSecondaryIndexes && details.globalSecondaryIndexes.length > 0) {
                for (const gsi of details.globalSecondaryIndexes) {
                    const indexNode = new DynamoDBIndexNode_1.DynamoDBIndexNode(`GSI: ${gsi.name}`, this);
                    indexNode.IndexName = gsi.name;
                    indexNode.IndexType = 'GSI';
                    indexNode.Keys = gsi.keys;
                    indexNode.KeySchema = gsi.keySchema;
                    indexNode.Region = tableNode.Region;
                    indexNode.TableName = tableNode.TableName;
                    indexNode.TableDetails = details;
                    indexNode.updateDescription();
                }
            }
            // Add Local Secondary Indexes
            if (details.localSecondaryIndexes && details.localSecondaryIndexes.length > 0) {
                for (const lsi of details.localSecondaryIndexes) {
                    const indexNode = new DynamoDBIndexNode_1.DynamoDBIndexNode(`LSI: ${lsi.name}`, this);
                    indexNode.IndexName = lsi.name;
                    indexNode.IndexType = 'LSI';
                    indexNode.Keys = lsi.keys;
                    indexNode.KeySchema = lsi.keySchema;
                    indexNode.Region = tableNode.Region;
                    indexNode.TableName = tableNode.TableName;
                    indexNode.TableDetails = details;
                    indexNode.updateDescription();
                }
            }
            if (this.Children.length === 0) {
                // No indexes, update label
                this.label = "Indexes (none)";
            }
            else {
                this.label = `Indexes (${this.Children.length})`;
                this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBIndexesGroupNode.handleNodeRefresh Error !!!', error);
            ui.showErrorMessage('Load Indexes Error !!!', error);
        }
        finally {
            this.StopWorking();
            this.RefreshTree();
        }
    }
}
exports.DynamoDBIndexesGroupNode = DynamoDBIndexesGroupNode;
//# sourceMappingURL=DynamoDBIndexesGroupNode.js.map