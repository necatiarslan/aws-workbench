"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaLogGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const CloudWatchLogGroupNode_1 = require("../cloudwatch-logs/CloudWatchLogGroupNode");
class LambdaLogGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "cloudwatch-loggroup";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('LambdaLogGroupNode.NodeRefresh Started');
        // Get the parent Lambda function node
        const lambdaNode = this.Parent;
        if (!lambdaNode || !lambdaNode.FunctionName) {
            ui.logToOutput('LambdaLogGroupNode.NodeRefresh - Parent Lambda node not found');
            return;
        }
        //  "LoggingConfig": {
        // "LogFormat": "Text",
        // "LogGroup": "/aws/lambda/my-lambda"
        const LoggingConfig = (await lambdaNode.Info)?.["LoggingConfig"];
        if (!LoggingConfig) {
            ui.logToOutput('LambdaLogGroupNode.NodeRefresh - No logging configuration found');
            return;
        }
        let logGroupName = LoggingConfig["LogGroup"];
        if (!logGroupName) {
            ui.logToOutput('LambdaLogGroupNode.NodeRefresh - No log group name found in logging configuration');
            return;
        }
        new CloudWatchLogGroupNode_1.CloudWatchLogGroupNode(logGroupName, this).Region = lambdaNode.Region;
    }
}
exports.LambdaLogGroupNode = LambdaLogGroupNode;
//# sourceMappingURL=LambdaLogGroupNode.js.map