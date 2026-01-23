import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import * as api from './API';
import { LambdaFunctionNode } from './LambdaFunctionNode';
import { TreeProvider } from '../tree/TreeProvider';

export class LambdaEnvNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "circle-filled";
        this.Label = Label;

        this.ShouldBeSaved = false;
        this.EnableNodeRefresh = true;
        this.EnableNodeEdit = true;
        this.EnableNodeRemove = true;
        this.SetContextValue();
    }

    @Serialize()
    public Label: string = "";

    @Serialize()
    public Key: string = "";

    @Serialize()
    public Value: string = "";

    public async NodeAdd(): Promise<void> {
    }

    public NodeRemove(): void {
        //TODO: Implement environment variable removal logic here
    }

    public NodeRefresh(): void {
        this.Parent?.NodeRefresh();
    }

    public NodeView(): void {
    }

    public async NodeEdit(): Promise<void> {
        ui.logToOutput('LambdaEnvNode.NodeEdit Started');

        // Resolve the parent Lambda function node to get region/name
        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        if (!lambdaNode || !lambdaNode.FunctionName) {
            ui.logToOutput('LambdaEnvNode.NodeEdit - Parent Lambda node not found');
            return;
        }

        if (!this.Key) {
            ui.logToOutput('LambdaEnvNode.NodeEdit - Environment variable key missing');
            return;
        }

        const newValue = await vscode.window.showInputBox({
            value: this.Value,
            placeHolder: 'Enter New Value for ' + this.Key
        });

        // User canceled input
        if (newValue === undefined) { return; }

        if (this.IsWorking) { return; }

        this.StartWorking();
        const result = await api.UpdateLambdaEnvironmentVariable(
            lambdaNode.Region,
            lambdaNode.FunctionName,
            this.Key,
            newValue
        );

        if (!result.isSuccessful) {
            ui.logToOutput("api.UpdateLambdaEnvironmentVariable Error !!!", result.error);
            ui.showErrorMessage('Update Environment Variable Error !!!', result.error);
            this.StopWorking();
            return;
        }

        // Update local state and UI
        this.Value = newValue;
        this.Label = `${this.Key} = ${newValue}`;
        ui.showInfoMessage('Environment Variable Updated Successfully');

        // Refresh parent group to reload variables
        if (this.Parent) {
            this.Parent.NodeRefresh();
        } else {
            TreeProvider.Current.Refresh(this);
        }

        this.StopWorking();
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
NodeRegistry.register('LambdaEnvNode', LambdaEnvNode);