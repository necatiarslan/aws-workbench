import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { DynamoDBTableNode } from './DynamoDBTableNode';
import { DynamoDBKeyNode } from './DynamoDBKeyNode';

export class DynamoDBKeysGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) {
        super(Label, parent);
        this.Icon = "key";
        
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeRefresh(): Promise<void> {
        ui.logToOutput('DynamoDBKeysGroupNode.handleNodeRefresh Started');

        const tableNode = this.Parent as DynamoDBTableNode;
        if (!tableNode || !tableNode.TableName) {
            ui.logToOutput('DynamoDBKeysGroupNode.handleNodeRefresh - Parent table node not found');
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

            // Clear existing children
            this.Children = [];

            // Add partition key
            if (details.partitionKey) {
                const keyNode = new DynamoDBKeyNode(
                    `${details.partitionKey.name} (${details.partitionKey.type})`,
                    this
                );
                keyNode.KeyName = details.partitionKey.name;
                keyNode.KeyType = details.partitionKey.type;
                keyNode.KeyRole = 'HASH';
            }

            // Add sort key if exists
            if (details.sortKey) {
                const keyNode = new DynamoDBKeyNode(
                    `${details.sortKey.name} (${details.sortKey.type})`,
                    this
                );
                keyNode.KeyName = details.sortKey.name;
                keyNode.KeyType = details.sortKey.type;
                keyNode.KeyRole = 'RANGE';
            }

            if (this.Children.length > 0) {
                this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
            }

        } catch (error: any) {
            ui.logToOutput('DynamoDBKeysGroupNode.handleNodeRefresh Error !!!', error);
            ui.showErrorMessage('Load Keys Error !!!', error);
        } finally {
            this.StopWorking();
            this.RefreshTree()
        }
    }
}
