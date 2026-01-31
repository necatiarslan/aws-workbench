import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { StateMachineNode } from './StateMachineNode';
import * as fs from 'fs';
import { StateMachineStudioView } from './StateMachineStudioView';
import { Session } from '../common/Session';

export class StateMachineDefinitionFileNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "file-code";

        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeLoaded.subscribe(() => this.handleNodeLoaded());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        
        this.SetContextValue();
    }

    public async handleNodeLoaded(): Promise<void> {
        //TODO: do not work
        const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if (stateMachineNode.CodePath && stateMachineNode.CodePath.trim().length > 0) {
            this.label = stateMachineNode.CodePath;
        } else {
            this.label = 'Select File';
        }
    }

    public async handleNodeView(): Promise<void> {
        const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if(!stateMachineNode) return;

        if(!stateMachineNode.CodePath) {
            ui.showWarningMessage('Please set definition file first');
            return;
        }

        StateMachineStudioView.Render(Session.Current.ExtensionUri, stateMachineNode.StateMachineName, stateMachineNode.CodePath);
    }

    private async handleNodeAdd(): Promise<void> {
        const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if(!stateMachineNode) return;

        //ask user to select a json file and update stateMachineNode.CodePath
        const uri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select File',
            filters: { 'JSON': ['json'] }
        });

        if(uri && uri.length > 0) {
            const filePath = uri[0].fsPath;
            stateMachineNode.CodePath = filePath;
            this.label = `File: ${stateMachineNode.CodePath}`;
            this.TreeSave();
            ui.logToOutput('File: ' + stateMachineNode.CodePath);
            ui.showInfoMessage('Definition file set successfully');
            this.RefreshTree()
        }
    }

    private async handleNodeEdit(): Promise<void> {
        const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if(!stateMachineNode) return;

        if(!stateMachineNode.CodePath) {
            ui.showWarningMessage('Please set definition file first');
            return;
        }

        this.StartWorking();
        try {
            if(fs.existsSync(stateMachineNode.CodePath)) {
                ui.openFile(stateMachineNode.CodePath);
            } else {
                ui.showWarningMessage('Definition file not found');
            }
        } catch (error: any) {
            ui.logToOutput('StateMachineDefinitionFileNode.handleNodeEdit Error !!!', error);
            ui.showErrorMessage('Failed to view definition', error);
        }
        this.StopWorking();
    }
    
    private async handleNodeRemove(): Promise<void> {
        const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if(!stateMachineNode) return;

        stateMachineNode.CodePath = '';
        this.label = 'Select File';
        this.TreeSave();
        ui.logToOutput('Definition file removed: ' + stateMachineNode.CodePath);
        ui.showInfoMessage('Definition file removed successfully');
        this.RefreshTree()
    }
}
