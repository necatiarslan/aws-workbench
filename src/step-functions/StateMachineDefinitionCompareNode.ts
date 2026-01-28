import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as ui from '../common/UI';
import { StateMachineNode } from './StateMachineNode';

export class StateMachineDefinitionCompareNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "diff";

        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        
        this.SetContextValue();
    }

    private async handleNodeRun(): Promise<void> {
        const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if(!stateMachineNode || !stateMachineNode.CodePath) {
            ui.showWarningMessage('Please download definition first');
            return;
        }

        if(!fs.existsSync(stateMachineNode.CodePath)) {
            ui.showWarningMessage('Local definition file not found');
            return;
        }

        this.StartWorking();
        try {
            const definition = await stateMachineNode.GetDefinition();
            
            if(definition && definition.definition) {
                const remoteDefString = typeof definition.definition === 'string' 
                    ? definition.definition 
                    : JSON.stringify(definition.definition, null, 2);
                
                const remoteDef = ui.isJsonString(remoteDefString) 
                    ? JSON.stringify(JSON.parse(remoteDefString), null, 2)
                    : remoteDefString;

                // Create temp file for remote definition
                const tempPath = path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', '.aws-workbench-temp-remote.json');
                fs.writeFileSync(tempPath, remoteDef);

                // Open diff
                const localUri = vscode.Uri.file(stateMachineNode.CodePath);
                const remoteUri = vscode.Uri.file(tempPath);
                
                await vscode.commands.executeCommand('vscode.diff', 
                    localUri, 
                    remoteUri, 
                    `${stateMachineNode.StateMachineName} (Local ↔ Remote)`
                );

                // Clean up temp file after a delay
                setTimeout(() => {
                    if(fs.existsSync(tempPath)) {
                        fs.unlinkSync(tempPath);
                    }
                }, 30000);
            }
        } catch (error: any) {
            ui.logToOutput('StateMachineDefinitionCompareNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Failed to compare definitions', error);
        }
        this.StopWorking();
    }
}
