import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { LambdaEnvNode } from './LambdaEnvNode';
import { TreeProvider } from '../tree/TreeProvider';
import { LambdaFunctionNode } from './LambdaFunctionNode';

export class LambdaEnvGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "symbol-property";
        
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeAdd(): Promise<void> {
        //TODO: Implement adding new environment variable logic here
    }

    public async handleNodeRefresh(): Promise<void> {
        ui.logToOutput('LambdaEnvGroupNode.NodeRefresh Started');
        
        // Get the parent Lambda function node
        let lambdaNode = this.Parent as LambdaFunctionNode;
        if (!lambdaNode || !lambdaNode.FunctionName) {
            ui.logToOutput('LambdaEnvGroupNode.NodeRefresh - Parent Lambda node not found');
            return;
        }

        if (this.IsWorking) { 
            return; 
        }
        
        this.StartWorking();
        let result = await api.GetLambdaConfiguration(lambdaNode.Region, lambdaNode.FunctionName);
        
        if (!result.isSuccessful) {
            ui.logToOutput("api.GetLambdaConfiguration Error !!!", result.error);
            ui.showErrorMessage('Get Lambda Configuration Error !!!', result.error);
            this.StopWorking();
            return;
        }

        // Clear existing children
        this.Children = [];
        
        // Add environment variables as children
        if (result.result.Environment && result.result.Environment.Variables) {
            const envVars = result.result.Environment.Variables;
            for (let key in envVars) {
                let envVarNode = new LambdaEnvNode(`${key} = ${envVars[key]}`, this);
                envVarNode.Key = key;
                envVarNode.Value = envVars[key] || "";
            }
        }

        // if (this.Children.length > 0) {
        //     this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        // } else {
        //     this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        // }

        this.StopWorking();
        TreeProvider.Current.Refresh(this);
    }

}
