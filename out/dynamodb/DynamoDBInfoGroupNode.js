"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBInfoGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const TreeProvider_1 = require("../tree/TreeProvider");
const DynamoDBInfoNode_1 = require("./DynamoDBInfoNode");
class DynamoDBInfoGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "info";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('DynamoDBInfoGroupNode.handleNodeRefresh Started');
        const tableNode = this.Parent;
        if (!tableNode || !tableNode.TableName) {
            ui.logToOutput('DynamoDBInfoGroupNode.handleNodeRefresh - Parent table node not found');
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
            // Add info items
            const infoItems = [
                { key: 'Status', value: details.tableStatus || 'N/A' },
                { key: 'Table Class', value: details.tableClass || 'STANDARD' },
                { key: 'Item Count', value: details.itemCount?.toLocaleString() || '0' },
                { key: 'Table Size', value: this.formatBytes(details.tableSize || 0) },
                { key: 'Avg Item Size', value: details.averageItemSize ? this.formatBytes(details.averageItemSize) : 'N/A' },
                { key: 'Created', value: details.creationDateTime ? new Date(details.creationDateTime).toLocaleString() : 'N/A' },
                { key: 'ARN', value: details.tableArn || 'N/A' }
            ];
            for (const item of infoItems) {
                const infoNode = new DynamoDBInfoNode_1.DynamoDBInfoNode(`${item.key}: ${item.value}`, this);
                infoNode.InfoKey = item.key;
                infoNode.InfoValue = item.value;
            }
            if (this.Children.length > 0) {
                this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBInfoGroupNode.handleNodeRefresh Error !!!', error);
            ui.showErrorMessage('Load Info Error !!!', error);
        }
        finally {
            this.StopWorking();
            TreeProvider_1.TreeProvider.Current.Refresh(this);
        }
    }
    formatBytes(bytes) {
        if (bytes === 0) {
            return '0 Bytes';
        }
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
exports.DynamoDBInfoGroupNode = DynamoDBInfoGroupNode;
//# sourceMappingURL=DynamoDBInfoGroupNode.js.map