"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBTagsGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const DynamoDBTagNode_1 = require("./DynamoDBTagNode");
class DynamoDBTagsGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "tag";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeAdd() {
        ui.logToOutput('DynamoDBTagsGroupNode.handleNodeAdd Started');
        const tableNode = this.Parent;
        if (!tableNode || !tableNode.TableName) {
            ui.logToOutput('DynamoDBTagsGroupNode.handleNodeAdd - Parent table node not found');
            return;
        }
        const key = await await vscode.window.showInputBox({ prompt: 'Enter tag key:' });
        if (!key) {
            ui.showWarningMessage('Tag key is required.');
            return;
        }
        const value = await vscode.window.showInputBox({ prompt: 'Enter tag value:' });
        if (value === undefined) {
            ui.showWarningMessage('Tag value is required.');
            return;
        }
        this.StartWorking();
        try {
            const details = await tableNode.TableDetails;
            if (!details || !details.tableArn) {
                this.StopWorking();
                return;
            }
            // Add tag
            const tagResult = await api.UpdateDynamoDBTag(tableNode.Region, details.tableArn, key, value);
            if (tagResult.isSuccessful) {
                ui.showInfoMessage(`Tag "${key}" added successfully.`);
                this.RefreshTree();
            }
            else {
                ui.logToOutput('DynamoDBTagsGroupNode.handleNodeAdd - TagTable Error !!!', tagResult.error);
                ui.showErrorMessage('Failed to add tag.', tagResult.error);
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBTagsGroupNode.handleNodeAdd Error !!!', error);
            ui.showErrorMessage('Error adding tag.', error);
        }
        finally {
            this.StopWorking();
        }
    }
    async handleNodeRefresh() {
        ui.logToOutput('DynamoDBTagsGroupNode.handleNodeRefresh Started');
        const tableNode = this.Parent;
        if (!tableNode || !tableNode.TableName) {
            ui.logToOutput('DynamoDBTagsGroupNode.handleNodeRefresh - Parent table node not found');
            return;
        }
        // if (this.IsWorking) { return; }
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
                    const tagNode = new DynamoDBTagNode_1.DynamoDBTagNode(tag.key || '', tag.value || '', this);
                    tagNode.Key = tag.key;
                    tagNode.Value = tag.value;
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