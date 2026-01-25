"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaInfoGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const TreeProvider_1 = require("../tree/TreeProvider");
const LambdaInfoNode_1 = require("./LambdaInfoNode");
class LambdaInfoGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "info";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('LambdaInfoGroupNode.NodeRefresh Started');
        // Get the parent Lambda function node
        const lambdaNode = this.Parent;
        if (!lambdaNode || !lambdaNode.FunctionName) {
            ui.logToOutput('LambdaInfoGroupNode.NodeRefresh - Parent Lambda node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // Get Lambda configuration
        const result = await api.GetLambdaConfiguration(lambdaNode.Region, lambdaNode.FunctionName);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetLambdaConfiguration Error !!!', result.error);
            ui.showErrorMessage('Get Lambda Configuration Error !!!', result.error);
            this.StopWorking();
            return;
        }
        // Clear existing children
        this.Children = [];
        // Add info items as children
        const config = result.result;
        const infoItems = [
            { key: 'Description', value: config.Description || 'N/A' },
            { key: 'Runtime', value: config.Runtime || 'N/A' },
            { key: 'FunctionArn', value: config.FunctionArn || 'N/A' },
            { key: 'MemorySize', value: config.MemorySize?.toString() || 'N/A' },
            { key: 'Timeout', value: config.Timeout?.toString() || 'N/A' },
            { key: 'State', value: config.State || 'N/A' },
            { key: 'LastModified', value: config.LastModified || 'N/A' },
            { key: 'LastUpdateStatus', value: config.LastUpdateStatus || 'N/A' },
            { key: 'LogFormat', value: config.LoggingConfig?.LogFormat || 'N/A' },
            { key: 'LogGroup', value: config.LoggingConfig?.LogGroup || 'N/A' },
            { key: 'Version', value: config.Version || 'N/A' }
        ];
        for (const item of infoItems) {
            const infoNode = new LambdaInfoNode_1.LambdaInfoNode(`${item.key}: ${item.value}`, this);
            infoNode.Key = item.key;
            infoNode.Value = item.value;
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        this.StopWorking();
        TreeProvider_1.TreeProvider.Current.Refresh(this);
    }
}
exports.LambdaInfoGroupNode = LambdaInfoGroupNode;
//# sourceMappingURL=LambdaInfoGroupNode.js.map