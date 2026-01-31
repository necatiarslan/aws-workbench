import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import * as fs from 'fs';
import { StateMachineNode } from './StateMachineNode';
import { TreeState } from '../tree/TreeState';
import { StateMachineTriggerFileNode } from './StateMachineTriggerFileNode';

export class StateMachineTriggerGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "play";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        
        this.SetContextValue();
    }

    public handleNodeRefresh(): void {
        ui.logToOutput('StateMachineTriggerGroupNode.NodeRefresh Started');
        
        // Refresh children based on parent StateMachineNode's PayloadFiles
        const stateMachine = this.GetAwsResourceNode() as StateMachineNode;
        this.Children = [];
        for (const triggerFile of stateMachine.PayloadFiles) {
            const fileName = ui.getFileNameWithExtension(triggerFile.path);
            const node = new StateMachineTriggerFileNode(fileName, this);
            node.FilePath = triggerFile.path;
        }
    }

    private async handleNodeRun(): Promise<void> {
        const stateMachine = this.Parent as StateMachineNode;
        if(!stateMachine) return;

        stateMachine.Trigger(undefined, this);
    }

    private async handleNodeAdd(): Promise<void> {
        const stateMachineNode = this.GetAwsResourceNode() as StateMachineNode;
        if(!stateMachineNode) return;

        const fileUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: { 'JSON': ['json'] }
        });
        if(!fileUri || fileUri.length === 0) return;

        try {
            const filePath = fileUri[0].fsPath;
            const fileName = ui.getFileNameWithExtension(filePath);
            const content = fs.readFileSync(filePath, 'utf-8');
            if(!ui.isJsonString(content)) {
                ui.showErrorMessage('Invalid JSON file', new Error('File must contain valid JSON'));
                return;
            }

            const newNode = new StateMachineTriggerFileNode(fileName, this);
            newNode.FilePath = filePath;

            const payloadEntry = {
                id: newNode.id || '',
                path: filePath
            };

            stateMachineNode.PayloadFiles.push(payloadEntry);
            
            TreeState.save();
            this.RefreshTree(stateMachineNode);
        } catch (error: any) {
            ui.logToOutput('Failed to add payload file', error);
            ui.showErrorMessage('Failed to add payload file', error);
        }
    }
}
