"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaTagGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const TreeProvider_1 = require("../tree/TreeProvider");
const LambdaTagNode_1 = require("./LambdaTagNode");
class LambdaTagGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "tag";
        this.ShouldBeSaved = false;
        this.EnableNodeRefresh = true;
        this.EnableNodeAdd = true;
        this.SetContextValue();
    }
    async NodeAdd() {
        ui.logToOutput('LambdaTagGroupNode.NodeAdd Started');
        // Get the parent Lambda function node
        const lambdaNode = this.Parent;
        if (!lambdaNode || !lambdaNode.FunctionName) {
            ui.logToOutput('LambdaTagGroupNode.NodeAdd - Parent Lambda node not found');
            return;
        }
        // Prompt for tag key
        const tagKey = await vscode.window.showInputBox({
            placeHolder: 'Enter Tag Key (e.g., Environment)'
        });
        if (!tagKey) {
            return;
        }
        // Prompt for tag value (allow empty string, but not undefined/cancel)
        const tagValue = await vscode.window.showInputBox({
            placeHolder: 'Enter Tag Value (e.g., Production)'
        });
        if (tagValue === undefined) {
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // First get the Lambda ARN
        const lambdaResult = await api.GetLambda(lambdaNode.Region, lambdaNode.FunctionName);
        if (!lambdaResult.isSuccessful || !lambdaResult.result.Configuration?.FunctionArn) {
            ui.logToOutput('api.GetLambda Error !!!', lambdaResult.error);
            ui.showErrorMessage('Get Lambda Error !!!', lambdaResult.error);
            this.StopWorking();
            return;
        }
        const lambdaArn = lambdaResult.result.Configuration.FunctionArn;
        // Add the tag
        const addResult = await api.AddLambdaTag(lambdaNode.Region, lambdaArn, tagKey, tagValue);
        if (!addResult.isSuccessful) {
            ui.logToOutput('api.AddLambdaTag Error !!!', addResult.error);
            ui.showErrorMessage('Add Tag Error !!!', addResult.error);
            this.StopWorking();
            return;
        }
        ui.showInfoMessage('Tag Added Successfully');
        // Reset working state before refresh
        this.StopWorking();
        await this.NodeRefresh();
    }
    NodeRemove() {
    }
    async NodeRefresh() {
        ui.logToOutput('LambdaTagGroupNode.NodeRefresh Started');
        // Get the parent Lambda function node
        const lambdaNode = this.Parent;
        if (!lambdaNode || !lambdaNode.FunctionName) {
            ui.logToOutput('LambdaTagGroupNode.NodeRefresh - Parent Lambda node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // First get the Lambda ARN
        const lambdaResult = await api.GetLambda(lambdaNode.Region, lambdaNode.FunctionName);
        if (!lambdaResult.isSuccessful || !lambdaResult.result.Configuration?.FunctionArn) {
            ui.logToOutput('api.GetLambda Error !!!', lambdaResult.error);
            ui.showErrorMessage('Get Lambda Error !!!', lambdaResult.error);
            this.StopWorking();
            return;
        }
        const lambdaArn = lambdaResult.result.Configuration.FunctionArn;
        // Get tags
        const tagsResult = await api.GetLambdaTags(lambdaNode.Region, lambdaArn);
        if (!tagsResult.isSuccessful) {
            ui.logToOutput('api.GetLambdaTags Error !!!', tagsResult.error);
            ui.showErrorMessage('Get Lambda Tags Error !!!', tagsResult.error);
            this.StopWorking();
            return;
        }
        // Clear existing children
        this.Children = [];
        // Add tags as children
        if (tagsResult.result) {
            for (const key in tagsResult.result) {
                const value = tagsResult.result[key];
                const tagNode = new LambdaTagNode_1.LambdaTagNode(`${key} = ${value}`, this);
                tagNode.Key = key;
                tagNode.Value = value || '';
            }
        }
        // Optionally control collapsible state
        // if (this.Children.length > 0) {
        //     this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        // } else {
        //     this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        // }
        this.StopWorking();
        TreeProvider_1.TreeProvider.Current.Refresh(this);
    }
    NodeView() {
    }
    async NodeEdit() {
    }
    NodeRun() {
    }
    NodeStop() {
    }
    NodeOpen() {
    }
    NodeInfo() {
    }
}
exports.LambdaTagGroupNode = LambdaTagGroupNode;
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaTagGroupNode', LambdaTagGroupNode);
//# sourceMappingURL=LambdaTagGroupNode.js.map