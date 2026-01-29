import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { TreeProvider } from '../tree/TreeProvider';
import { DynamoDBTableNode } from './DynamoDBTableNode';
import { DynamoDBIndexNode } from './DynamoDBIndexNode';

export class DynamoDBIndexesGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) {
        super(Label, parent);
        this.Icon = "list-tree";
        
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeRefresh(): Promise<void> {
        ui.logToOutput('DynamoDBIndexesGroupNode.handleNodeRefresh Started');

        const tableNode = this.Parent as DynamoDBTableNode;
        if (!tableNode || !tableNode.TableName) {
            ui.logToOutput('DynamoDBIndexesGroupNode.handleNodeRefresh - Parent table node not found');
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

            // Add Global Secondary Indexes
            if (details.globalSecondaryIndexes && details.globalSecondaryIndexes.length > 0) {
                for (const gsi of details.globalSecondaryIndexes) {
                    const indexNode = new DynamoDBIndexNode(
                        `GSI: ${gsi.name}`,
                        this
                    );
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
                    const indexNode = new DynamoDBIndexNode(
                        `LSI: ${lsi.name}`,
                        this
                    );
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
            } else {
                this.label = `Indexes (${this.Children.length})`;
                this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
            }

        } catch (error: any) {
            ui.logToOutput('DynamoDBIndexesGroupNode.handleNodeRefresh Error !!!', error);
            ui.showErrorMessage('Load Indexes Error !!!', error);
        } finally {
            this.StopWorking();
            TreeProvider.Current.Refresh(this);
        }
    }
}
