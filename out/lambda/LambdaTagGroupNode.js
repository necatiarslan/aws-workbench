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
exports.LambdaTagGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const LambdaTagNode_1 = require("./LambdaTagNode");
class LambdaTagGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "tag";
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeAdd() {
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
        await this.handleNodeRefresh();
    }
    async handleNodeRefresh() {
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
                const tagNode = new LambdaTagNode_1.LambdaTagNode(key, value || '', this);
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
        this.RefreshTree();
    }
}
exports.LambdaTagGroupNode = LambdaTagGroupNode;
//# sourceMappingURL=LambdaTagGroupNode.js.map