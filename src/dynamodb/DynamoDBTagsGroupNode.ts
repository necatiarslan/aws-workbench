import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { DynamoDBTableNode } from './DynamoDBTableNode';
import { DynamoDBTagNode } from './DynamoDBTagNode';

export class DynamoDBTagsGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) {
        super(Label, parent);
        this.Icon = "tag";
        
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeRefresh(): Promise<void> {
        ui.logToOutput('DynamoDBTagsGroupNode.handleNodeRefresh Started');

        const tableNode = this.Parent as DynamoDBTableNode;
        if (!tableNode || !tableNode.TableName) {
            ui.logToOutput('DynamoDBTagsGroupNode.handleNodeRefresh - Parent table node not found');
            return;
        }

        if (this.IsWorking) { return; }

        this.StartWorking();

        try {
            const details = await tableNode.TableDetails;
            if (!details || !details.tableArn) {
                this.StopWorking();
                return;
            }

            // Get tags
            const tagsResult = await api.GetTableTags(tableNode.Region, details.tableArn);
            
            // Clear existing children
            this.Children = [];

            if (tagsResult.isSuccessful && tagsResult.result.length > 0) {
                for (const tag of tagsResult.result) {
                    const tagNode = new DynamoDBTagNode(`${tag.key}: ${tag.value}`, this);
                    tagNode.TagKey = tag.key;
                    tagNode.TagValue = tag.value;
                }
                this.label = `Tags (${tagsResult.result.length})`;
                this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
            } else {
                this.label = "Tags (none)";
            }

        } catch (error: any) {
            ui.logToOutput('DynamoDBTagsGroupNode.handleNodeRefresh Error !!!', error);
        } finally {
            this.StopWorking();
            this.RefreshTree()
        }
    }
}
