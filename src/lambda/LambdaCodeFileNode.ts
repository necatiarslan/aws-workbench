import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { TreeState } from '../tree/TreeState';
import { LambdaFunctionNode } from './LambdaFunctionNode';

export class LambdaCodeFileNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "file-code";
        
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeLoaded.subscribe(() => this.handleNodeLoaded());

        this.SetContextValue();
    }

    private async handleNodeAdd(): Promise<void> {
        ui.logToOutput('LambdaCodeFileNode.NodeAdd Started');

        const selectedPath = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select Code File or Folder',
            canSelectFiles: true,
            canSelectFolders: true,
            filters: {
                'All Files': ['*'],
                'ZIP Files': ['zip'],
                'Python Files': ['py'],
                'JavaScript Files': ['js'],
                'TypeScript Files': ['ts']
            }
        });

        if (!selectedPath || selectedPath.length === 0) { return; }

        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        lambdaNode.CodePath = selectedPath[0].fsPath;
        this.label = `Code Path: ${lambdaNode.CodePath}`;
        TreeState.save();
        ui.logToOutput('Code Path: ' + lambdaNode.CodePath);
        ui.showInfoMessage('Code Path Set Successfully');
        this.RefreshTree()
    }

    private async handleNodeRemove(): Promise<void> {
        ui.logToOutput('LambdaCodeFileNode.handleNodeRemove Started');

        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        lambdaNode.CodePath = '';
        this.label = 'Select File';
        TreeState.save();
        ui.logToOutput('Code Path: ' + lambdaNode.CodePath);
        ui.showInfoMessage('Code Path Removed Successfully');
        this.RefreshTree()
    }

    private async handleNodeEdit(): Promise<void> {
        ui.logToOutput('LambdaCodeFileNode.NodeEdit Started');

        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        if (!lambdaNode.CodePath || lambdaNode.CodePath.trim().length === 0) {
            ui.showWarningMessage('No file path set. Please add a code path first.');
            return;
        }

        try {
            const fileUri = vscode.Uri.file(lambdaNode.CodePath);
            const document = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(document);
            ui.logToOutput('Opened file for editing: ' + lambdaNode.CodePath);
        } catch (error: any) {
            ui.logToOutput('LambdaCodeFileNode.NodeEdit Error !!!', error);
            ui.showErrorMessage('Failed to open file for editing', error);
        }
    }

    public async handleNodeLoaded(): Promise<void> {
        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        if (lambdaNode.CodePath && lambdaNode.CodePath.trim().length > 0) {
            this.label = lambdaNode.CodePath;
        } else {
            this.label = 'Select File';
        }
    }

}
