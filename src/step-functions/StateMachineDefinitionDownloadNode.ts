import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as ui from '../common/UI';
import { StateMachineNode } from './StateMachineNode';

export class StateMachineDefinitionDownloadNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "cloud-download";

        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        
        this.SetContextValue();
    }

    private async handleNodeRun(): Promise<void> {
        const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if(!stateMachineNode) return;

        this.StartWorking();
        try {
            const definition = await stateMachineNode.GetDefinition();
            if(definition && definition.definition) {
                const defString = typeof definition.definition === 'string' 
                    ? definition.definition 
                    : JSON.stringify(definition.definition, null, 2);
                
                const prettyDef = ui.isJsonString(defString) 
                    ? JSON.stringify(JSON.parse(defString), null, 2)
                    : defString;

                const uri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file(`${stateMachineNode.StateMachineName}.asl.json`),
                    filters: { 'JSON': ['json'] }
                });

                if(uri) {
                    fs.writeFileSync(uri.fsPath, prettyDef);
                    stateMachineNode.CodePath = uri.fsPath;
                    this.TreeSave();
                    ui.showInfoMessage('Definition downloaded successfully');
                    
                    const openFile = await vscode.window.showQuickPick(['Yes', 'No'], {
                        placeHolder: 'Open downloaded file?'
                    });
                    if(openFile === 'Yes') {
                        ui.openFile(uri.fsPath);
                    }
                }
            }
        } catch (error: any) {
            ui.logToOutput('StateMachineDefinitionDownloadNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Failed to download definition', error);
        }
        this.StopWorking();
    }
}
