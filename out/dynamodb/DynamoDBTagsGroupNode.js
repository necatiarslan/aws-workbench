"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBTagsGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const DynamoDBTagNode_1 = require("./DynamoDBTagNode");
class DynamoDBTagsGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "tag";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('DynamoDBTagsGroupNode.handleNodeRefresh Started');
        const tableNode = this.Parent;
        if (!tableNode || !tableNode.TableName) {
            ui.logToOutput('DynamoDBTagsGroupNode.handleNodeRefresh - Parent table node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
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
                    const tagNode = new DynamoDBTagNode_1.DynamoDBTagNode(`${tag.key}: ${tag.value}`, this);
                    tagNode.TagKey = tag.key;
                    tagNode.TagValue = tag.value;
                }
                this.label = `Tags (${tagsResult.result.length})`;
                this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
            }
            else {
                this.label = "Tags (none)";
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBTagsGroupNode.handleNodeRefresh Error !!!', error);
        }
        finally {
            this.StopWorking();
            this.RefreshTree();
        }
    }
}
exports.DynamoDBTagsGroupNode = DynamoDBTagsGroupNode;
//# sourceMappingURL=DynamoDBTagsGroupNode.js.map