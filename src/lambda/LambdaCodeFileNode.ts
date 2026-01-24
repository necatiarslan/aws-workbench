import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { TreeProvider } from '../tree/TreeProvider';
import { TreeState } from '../tree/TreeState';
import { LambdaFunctionNode } from './LambdaFunctionNode';

export class LambdaCodeFileNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "file-code";

        this.ShouldBeSaved = false;
        this.EnableNodeAdd = true;
        this.EnableNodeRemove = true;
        this.EnableNodeEdit = true;
        this.SetContextValue();
    }

    public async NodeAdd(): Promise<void> {
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
        TreeProvider.Current.Refresh(this);
    }

    public NodeRemove(): void {
        ui.logToOutput('LambdaCodeFileNode.NodeRemove Started');

        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        lambdaNode.CodePath = '';
        this.label = 'Select File';
        TreeState.save();
        ui.logToOutput('Code Path: ' + lambdaNode.CodePath);
        ui.showInfoMessage('Code Path Removed Successfully');
        TreeProvider.Current.Refresh(this);
    }

    public NodeRefresh(): void {}

    public NodeView(): void {}

    public async NodeEdit(): Promise<void> {
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

    public NodeRun(): void {}

    public NodeStop(): void {}

    public NodeOpen(): void {}

    public NodeInfo(): void {}

    public NodeLoaded(): void {
        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        if (lambdaNode.CodePath && lambdaNode.CodePath.trim().length > 0) {
            this.label = `Code Path: ${lambdaNode.CodePath}`;
        } else {
            this.label = 'Select File';
        }
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('LambdaCodeFileNode', LambdaCodeFileNode);