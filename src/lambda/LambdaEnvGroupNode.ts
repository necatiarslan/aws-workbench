import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
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
        this.Label = Label;

        this.ShouldBeSaved = false;
        this.EnableNodeRefresh = true;
        this.EnableNodeAdd = true;
        this.SetContextValue();
    }

    @Serialize()
    public Label: string = "";

    public async NodeAdd(): Promise<void> {
        //TODO: Implement adding new environment variable logic here
    }

    public NodeRemove(): void {
    }

    public async NodeRefresh(): Promise<void> {
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

    public NodeView(): void {
    }

    public async NodeEdit(): Promise<void> {
    }

    public NodeRun(): void {
    }

    public NodeStop(): void {
    }

    public NodeOpen(): void {
    }

    public NodeInfo(): void {
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('LambdaEnvGroupNode', LambdaEnvGroupNode);