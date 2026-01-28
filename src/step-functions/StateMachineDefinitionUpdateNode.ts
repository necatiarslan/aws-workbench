import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as ui from '../common/UI';
import { StateMachineNode } from './StateMachineNode';
import * as api from './API';

export class StateMachineDefinitionUpdateNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "cloud-upload";

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

        const confirm = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Update state machine definition from local file?'
        });
        if(confirm !== 'Yes') return;

        this.StartWorking();
        try {
            if(!stateMachineNode.StateMachineArn) {
                ui.showWarningMessage('State machine ARN not available');
                this.StopWorking();
                return;
            }

            const localContent = fs.readFileSync(stateMachineNode.CodePath, 'utf-8');
            
            if(!ui.isJsonString(localContent)) {
                ui.showWarningMessage('Local file is not valid JSON');
                this.StopWorking();
                return;
            }

            const result = await api.UpdateStateMachineDefinition(
                stateMachineNode.Region,
                stateMachineNode.StateMachineArn,
                localContent
            );

            if(result.isSuccessful) {
                ui.showInfoMessage('State machine definition updated successfully');
                // Clear cached definition
                (stateMachineNode as any)._definition = undefined;
            }
        } catch (error: any) {
            ui.logToOutput('StateMachineDefinitionUpdateNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Failed to update definition', error);
        }
        this.StopWorking();
    }
}
