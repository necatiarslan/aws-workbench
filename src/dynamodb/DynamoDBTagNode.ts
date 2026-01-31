import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { DynamoDBTableNode } from './DynamoDBTableNode';

export class DynamoDBTagNode extends NodeBase {

    constructor(Key: string, Value: string, parent?: NodeBase) {
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

    public Key: string = "";
    public Value: string = "";

    private handleNodeOpen(): void {
        const info = `${this.Key}: ${this.Value}`;
        vscode.env.clipboard.writeText(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }

    public async handleNodeRemove(): Promise<void> {
        ui.logToOutput('DynamoDBTagNode.NodeRemove Started');

        if (!this.Key) { return; }

        const confirmation = await vscode.window.showWarningMessage(
            `Are you sure you want to remove tag "${this.Key}"?`,
            { modal: true },
            'Yes',
            'No'
        );

        if (confirmation !== 'Yes') { return; }

        // Resolve the parent DynamoDB table node
        const tableNode = this.GetAwsResourceNode() as DynamoDBTableNode;
        if (!tableNode || !tableNode.TableName || !tableNode.Region) {
            ui.logToOutput('DynamoDBTagNode.NodeRemove - Parent DynamoDB table node not found');
            return;
        }

        if (this.IsWorking) { return; }
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

    public async handleNodeRefresh(): Promise<void> {
        this.Parent?.NodeRefresh();
    }

    public async handleNodeEdit(): Promise<void> {
        ui.logToOutput('DynamoDBTagNode.NodeEdit Started');

        // Prompt for new value (allow empty string, but not undefined/cancel)
        const newValue = await vscode.window.showInputBox({
            value: this.Value,
            placeHolder: 'Enter New Value for ' + this.Key
        });
        if (newValue === undefined) { return; }

        if (!this.Key) { return; }

        // Resolve the parent DynamoDB table node
        const tableNode = this.GetAwsResourceNode() as DynamoDBTableNode;
        if (!tableNode || !tableNode.TableName || !tableNode.Region) {
            ui.logToOutput('DynamoDBTagNode.NodeEdit - Parent DynamoDB table node not found');
            return;
        }

        if (this.IsWorking) { return; }
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
