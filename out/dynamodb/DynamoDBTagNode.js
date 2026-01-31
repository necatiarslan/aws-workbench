"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBTagNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
class DynamoDBTagNode extends NodeBase_1.NodeBase {
    constructor(Key, Value, parent) {
        super(Key, parent);
        this.Icon = "circle-outline";
        this.Key = Key;
        this.Value = Value;
        this.description = Value;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }
    Key = "";
    Value = "";
    handleNodeOpen() {
        const info = `${this.Key}: ${this.Value}`;
        vscode.env.clipboard.writeText(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }
    async handleNodeRemove() {
        ui.logToOutput('DynamoDBTagNode.NodeRemove Started');
        if (!this.Key) {
            return;
        }
        const confirmation = await vscode.window.showWarningMessage(`Are you sure you want to remove tag "${this.Key}"?`, { modal: true }, 'Yes', 'No');
        if (confirmation !== 'Yes') {
            return;
        }
        // Resolve the parent DynamoDB table node
        const tableNode = this.GetAwsResourceNode();
        if (!tableNode || !tableNode.TableName || !tableNode.Region) {
            ui.logToOutput('DynamoDBTagNode.NodeRemove - Parent DynamoDB table node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // Get table ARN
        const tableResult = await api.DescribeTable(tableNode.Region, tableNode.TableName);
        if (!tableResult.isSuccessful || !tableResult.result?.Table?.TableArn) {
            ui.logToOutput('api.DescribeTable Error !!!', tableResult.error);
            ui.showErrorMessage('Get Table Error !!!', tableResult.error);
            this.StopWorking();
            return;
        }
        const tableArn = tableResult.result.Table.TableArn;
        // Remove tag
        const result = await api.RemoveDynamoDBTag(tableNode.Region, tableArn, this.Key);
        if (!result.isSuccessful) {
            ui.logToOutput('api.RemoveDynamoDBTag Error !!!', result.error);
            ui.showErrorMessage('Remove Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }
        ui.showInfoMessage('Tag Removed Successfully');
        // Refresh the parent tags group to reflect changes
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }
    async handleNodeRefresh() {
        this.Parent?.NodeRefresh();
    }
    async handleNodeEdit() {
        ui.logToOutput('DynamoDBTagNode.NodeEdit Started');
        // Prompt for new value (allow empty string, but not undefined/cancel)
        const newValue = await vscode.window.showInputBox({
            value: this.Value,
            placeHolder: 'Enter New Value for ' + this.Key
        });
        if (newValue === undefined) {
            return;
        }
        if (!this.Key) {
            return;
        }
        // Resolve the parent DynamoDB table node
        const tableNode = this.GetAwsResourceNode();
        if (!tableNode || !tableNode.TableName || !tableNode.Region) {
            ui.logToOutput('DynamoDBTagNode.NodeEdit - Parent DynamoDB table node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // Get table ARN
        const tableResult = await api.DescribeTable(tableNode.Region, tableNode.TableName);
        if (!tableResult.isSuccessful || !tableResult.result?.Table?.TableArn) {
            ui.logToOutput('api.DescribeTable Error !!!', tableResult.error);
            ui.showErrorMessage('Get Table Error !!!', tableResult.error);
            this.StopWorking();
            return;
        }
        const tableArn = tableResult.result.Table.TableArn;
        // Update tag (same API as add; overwrites existing)
        const result = await api.UpdateDynamoDBTag(tableNode.Region, tableArn, this.Key, newValue);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateDynamoDBTag Error !!!', result.error);
            ui.showErrorMessage('Update Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }
        ui.showInfoMessage('Tag Updated Successfully');
        // Refresh the parent tags group to show updated values
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }
}
exports.DynamoDBTagNode = DynamoDBTagNode;
//# sourceMappingURL=DynamoDBTagNode.js.map