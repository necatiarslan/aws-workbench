import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { LambdaFunctionNode } from './LambdaFunctionNode';

export class LambdaCodeUploadNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "cloud-upload";

        this.ShouldBeSaved = false;
        this.EnableNodeRun = true;
        this.SetContextValue();
    }

    public async NodeAdd(): Promise<void> {
    }

    public NodeRemove(): void {
    }

    public NodeRefresh(): void {
    }

    public NodeView(): void {
    }

    public async NodeEdit(): Promise<void> {
    }

    public async NodeRun(): Promise<void> {
        ui.logToOutput('LambdaCodeUploadNode.NodeRun Started');

        // Get parent Lambda function node
        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        if (!lambdaNode || !lambdaNode.FunctionName || !lambdaNode.Region) {
            ui.logToOutput('LambdaCodeUploadNode.NodeRun - Parent Lambda node not found');
            return;
        }

        if (this.IsWorking) { return; }

        // Check if code path is set, if not prompt user
        let codePath = (this.GetAwsResourceNode() as LambdaFunctionNode).CodePath;
        if (!codePath || codePath.trim().length === 0) {
            // Prompt user to select file or folder
            const selectedPath = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select Lambda Code File or Folder',
                filters: {
                    'All Files': ['*'],
                    'ZIP Files': ['zip'],
                    'Python Files': ['py'],
                    'JavaScript Files': ['js'],
                    'TypeScript Files': ['ts']
                }
            });

            if (!selectedPath || selectedPath.length === 0) {
                ui.showWarningMessage('Please Set Code Path First');
                return;
            }

            codePath = selectedPath[0].fsPath;
            (this.GetAwsResourceNode() as LambdaFunctionNode).CodePath = codePath;
        }

        this.StartWorking();

        try {
            const result = await api.UpdateLambdaCode(lambdaNode.Region, lambdaNode.FunctionName, codePath);

            if (!result.isSuccessful) {
                ui.logToOutput('api.UpdateLambdaCode Error !!!', result.error);
                ui.showErrorMessage('Update Lambda Code Error !!!', result.error);
                return;
            }

            ui.logToOutput('api.UpdateLambdaCode Success !!!');
            ui.showInfoMessage('Lambda Code Updated Successfully');
        } catch (error: any) {
            ui.logToOutput('LambdaCodeUploadNode.NodeRun Error !!!', error);
            ui.showErrorMessage('Update Lambda Code Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }

    public NodeStop(): void {
    }

    public NodeOpen(): void {
    }

    public NodeInfo(): void {
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('LambdaCodeUploadNode', LambdaCodeUploadNode);