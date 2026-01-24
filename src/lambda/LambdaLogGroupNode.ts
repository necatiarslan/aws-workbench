import { NodeBase } from '../tree/NodeBase';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { LambdaFunctionNode } from './LambdaFunctionNode';
import * as ui from '../common/UI';
import { CloudWatchLogGroupNode } from '../cloudwatch-logs/CloudWatchLogGroupNode';

export class LambdaLogGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "list-unordered";

        this.ShouldBeSaved = false;
        this.EnableNodeRefresh = true;
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async NodeAdd(): Promise<void> {}

    public NodeRemove(): void {}

    public async NodeRefresh(): Promise<void> {
        ui.logToOutput('LambdaLogGroupNode.NodeRefresh Started');

        // Get the parent Lambda function node
        const lambdaNode = this.Parent as LambdaFunctionNode;
        if (!lambdaNode || !lambdaNode.FunctionName) {
            ui.logToOutput('LambdaLogGroupNode.NodeRefresh - Parent Lambda node not found');
            return;
        }
        //  "LoggingConfig": {
        // "LogFormat": "Text",
        // "LogGroup": "/aws/lambda/my-lambda"

        const LoggingConfig = (await lambdaNode.Configuration)?.["LoggingConfig"];
        if (!LoggingConfig) {
            ui.logToOutput('LambdaLogGroupNode.NodeRefresh - No logging configuration found');
            return;
        }

        let logGroupName = LoggingConfig["LogGroup"];
        if (!logGroupName) {
            ui.logToOutput('LambdaLogGroupNode.NodeRefresh - No log group name found in logging configuration');
            return;
        }

        new CloudWatchLogGroupNode(logGroupName, this).Region = lambdaNode.Region;

    }

    public NodeView(): void {}

    public async NodeEdit(): Promise<void> {}

    public NodeRun(): void {}

    public NodeStop(): void {}

    public NodeOpen(): void {}

    public NodeInfo(): void {}

    public NodeLoaded(): void {}

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('LambdaLogGroupNode', LambdaLogGroupNode);