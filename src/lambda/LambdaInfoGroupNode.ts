import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { LambdaFunctionNode } from './LambdaFunctionNode';
import { LambdaInfoNode } from './LambdaInfoNode';

export class LambdaInfoGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "info";
        
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeRefresh(): Promise<void> {
        ui.logToOutput('LambdaInfoGroupNode.NodeRefresh Started');

        // Get the parent Lambda function node
        const lambdaNode = this.Parent as LambdaFunctionNode;
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
            const infoNode = new LambdaInfoNode(item.key, item.value, this);
            infoNode.InfoKey = item.key;
            infoNode.InfoValue = item.value;
        }

        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }

        this.StopWorking();
        this.RefreshTree()
    }

}
