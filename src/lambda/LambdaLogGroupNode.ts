import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { LambdaFunctionNode } from './LambdaFunctionNode';
import * as ui from '../common/UI';
import { CloudWatchLogGroupNode } from '../cloudwatch-logs/CloudWatchLogGroupNode';

export class LambdaLogGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "cloudwatch-loggroup";
        
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeRefresh(): Promise<void> {
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

        new CloudWatchLogGroupNode(logGroupName, this).Region = lambdaNode.Region;
    }

}
