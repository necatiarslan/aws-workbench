import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { LambdaFunctionNode } from './LambdaFunctionNode';

export class LambdaTagNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "circle-filled";

        this.ShouldBeSaved = false;
        this.EnableNodeRefresh = true;
        this.EnableNodeEdit = true;
        this.EnableNodeRemove = true;
        this.SetContextValue();
    }

    public Key: string = "";

    public Value: string = "";

    public async NodeAdd(): Promise<void> {
    }

    public async NodeRemove(): Promise<void> {
        ui.logToOutput('LambdaTagNode.NodeRemove Started');

        if (!this.Key) { return; }

        const confirmation = await vscode.window.showWarningMessage(
            `Are you sure you want to remove tag "${this.Key}"?`,
            { modal: true },
            'Yes',
            'No'
        );

        if (confirmation !== 'Yes') { return; }

        // Resolve the parent Lambda function node
        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        if (!lambdaNode || !lambdaNode.FunctionName) {
            ui.logToOutput('LambdaTagNode.NodeRemove - Parent Lambda node not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        // Get Lambda ARN
        const lambdaResult = await api.GetLambda(lambdaNode.Region, lambdaNode.FunctionName);
        if (!lambdaResult.isSuccessful || !lambdaResult.result.Configuration?.FunctionArn) {
            ui.logToOutput('api.GetLambda Error !!!', lambdaResult.error);
            ui.showErrorMessage('Get Lambda Error !!!', lambdaResult.error);
            this.StopWorking();
            return;
        }

        const lambdaArn = lambdaResult.result.Configuration.FunctionArn;

        // Remove tag
        const result = await api.RemoveLambdaTag(lambdaNode.Region, lambdaArn, this.Key);
        if (!result.isSuccessful) {
            ui.logToOutput('api.RemoveLambdaTag Error !!!', result.error);
            ui.showErrorMessage('Remove Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Removed Successfully');

        // Refresh the parent tags group to reflect changes
        this.Parent?.NodeRefresh();

        this.StopWorking();
    }

    public NodeRefresh(): void {
        this.Parent?.NodeRefresh();
    }

    public NodeView(): void {
    }

    public async NodeEdit(): Promise<void> {
        ui.logToOutput('LambdaTagNode.NodeEdit Started');

        // Prompt for new value (allow empty string, but not undefined/cancel)
        const newValue = await vscode.window.showInputBox({
            value: this.Value,
            placeHolder: 'Enter New Value for ' + this.Key
        });
        if (newValue === undefined) { return; }

        if (!this.Key) { return; }

        // Resolve the parent Lambda function node
        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        if (!lambdaNode || !lambdaNode.FunctionName) {
            ui.logToOutput('LambdaTagNode.NodeEdit - Parent Lambda node not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        // Get Lambda ARN
        const lambdaResult = await api.GetLambda(lambdaNode.Region, lambdaNode.FunctionName);
        if (!lambdaResult.isSuccessful || !lambdaResult.result.Configuration?.FunctionArn) {
            ui.logToOutput('api.GetLambda Error !!!', lambdaResult.error);
            ui.showErrorMessage('Get Lambda Error !!!', lambdaResult.error);
            this.StopWorking();
            return;
        }

        const lambdaArn = lambdaResult.result.Configuration.FunctionArn;

        // Update tag (same API as add; overwrites existing)
        const result = await api.UpdateLambdaTag(lambdaNode.Region, lambdaArn, this.Key, newValue);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateLambdaTag Error !!!', result.error);
            ui.showErrorMessage('Update Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Updated Successfully');

        // Refresh the parent tags group to show updated values
        this.Parent?.NodeRefresh();

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

    public NodeLoaded(): void {}

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('LambdaTagNode', LambdaTagNode);