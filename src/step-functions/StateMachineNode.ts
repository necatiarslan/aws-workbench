import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { TreeState } from '../tree/TreeState';
import { StateMachineDefinitionGroupNode } from './StateMachineDefinitionGroupNode';
import { StateMachineTriggerGroupNode } from './StateMachineTriggerGroupNode';
import { StateMachineExecutionsGroupNode } from './StateMachineExecutionsGroupNode';
import { StateMachineLogsGroupNode } from './StateMachineLogsGroupNode';
import { StateMachineStudioView } from './StateMachineStudioView';
import { Session } from '../common/Session';
import { StateMachineExecutionNode } from './StateMachineExecutionNode';
import * as fs from 'fs';

export class StateMachineNode extends NodeBase {

    constructor(stateMachineName: string, parent?: NodeBase) 
    {
        super(stateMachineName, parent);
        this.Icon = "step-functions";
        this.StateMachineName = stateMachineName;
        
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;

        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        
        this.LoadDefaultChildren();
        this.SetContextValue();
    }

    @Serialize()
    public StateMachineName: string = "";

    @Serialize()
    public Region: string = "";

    @Serialize()
    public StateMachineArn: string = "";

    @Serialize()
    public CodePath: string = "";

    @Serialize()
    public PayloadFiles: { id: string; path: string }[] = [];

    @Serialize()
    public LogGroupName: string = "";

    private _definition: any | undefined = undefined;

    public async GetDefinition(): Promise<any | undefined> {
        if(!this._definition) {
            if(!this.StateMachineArn) {
                await this.ResolveArn();
            }
            
            if(!this.StateMachineArn) {
                return undefined;
            }

            const response = await api.GetStateMachineDefinition(this.Region, this.StateMachineArn);
            if (response.isSuccessful && response.result) {
                this._definition = response.result;
                
                // Extract log group if logging is configured
                if(response.result.loggingConfiguration?.destinations) {
                    const logArn = response.result.loggingConfiguration.destinations[0]?.cloudWatchLogsLogGroup?.logGroupArn;
                    if(logArn) {
                        // Extract log group name from ARN
                        const parts = logArn.split(':');
                        if(parts.length >= 7) {
                            this.LogGroupName = parts[6];
                        }
                    }
                }
            } else {
                ui.logToOutput('api.GetStateMachineDefinition Error !!!', response.error);
                ui.showErrorMessage('Get State Machine Definition Error !!!', response.error);
            }
        }
        return this._definition;
    }

    private async ResolveArn(): Promise<void> {
        // Build ARN from region and name if not already set
        if(!this.StateMachineArn && this.Region && this.StateMachineName) {
            const result = await api.GetStateMachineList(this.Region, this.StateMachineName);
            if(result.isSuccessful && result.result && Array.isArray(result.result)) {
                const match = result.result.find((sm: any) => sm.name === this.StateMachineName) as any;
                if(match && match.stateMachineArn) {
                    this.StateMachineArn = match.stateMachineArn;
                }
            }
        }
    }

    public async LoadDefaultChildren(): Promise<void> {
        new StateMachineDefinitionGroupNode("Definition", this);
        new StateMachineTriggerGroupNode("Trigger", this);
        new StateMachineExecutionsGroupNode("Executions", this);
        new StateMachineLogsGroupNode("Logs", this);
    }

    private handleNodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

    private async handleNodeInfo(): Promise<void> {
        ui.logToOutput('StateMachineNode.NodeInfo Started');

        if (!this.StateMachineName || !this.Region) {
            ui.showWarningMessage('State machine name or region is not set.');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        try {
            const definition = await this.GetDefinition();
            if (definition) {
                const jsonContent = JSON.stringify(definition, null, 2);
                const document = await vscode.workspace.openTextDocument({
                    content: jsonContent,
                    language: 'json'
                });
                await vscode.window.showTextDocument(document);
            } else {
                ui.showWarningMessage('Failed to load state machine definition');
            }
        } catch (error: any) {
            ui.logToOutput('StateMachineNode.NodeInfo Error !!!', error);
            ui.showErrorMessage('Failed to open definition', error);
        }
        this.StopWorking();
    }

    private async handleNodeView(): Promise<void> {
        ui.logToOutput('StateMachineNode.NodeView Started');

        if (!this.StateMachineName || !this.Region) {
            ui.showWarningMessage('State machine name or region is not set.');
            return;
        }

        if(this.CodePath.trim().length === 0) {
            ui.showWarningMessage('Please set definition file path first');
            return;
        }

        StateMachineStudioView.Render(Session.Current.ExtensionUri, this.StateMachineName, this.CodePath);
    }

    public async Trigger(filePath?: string, node?: NodeBase): Promise<void> {
        
        if (this.IsWorking) {
            ui.showInfoMessage('Execution already in progress');
            return;
        }

        let inputJson = '{}';

        if(filePath) {
            // Read input from the provided file path
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                if(!ui.isJsonString(content)) {
                    ui.showErrorMessage('Invalid JSON file', new Error('File must contain valid JSON'));
                    return;
                }
                inputJson = content;
            } catch (error: any) {
                ui.logToOutput('Failed to read payload file', error);
                ui.showErrorMessage('Failed to read payload file', error);
                return;
            }
        } 
        else 
        {

       // Prompt for execution input type
        const inputType = await vscode.window.showQuickPick(
            ['Empty', 'Enter JSON', 'Select File'], 
            { placeHolder: 'Select execution input type' }
        );
        if(!inputType) return;

        if(inputType === 'Enter JSON') {
            const input = await vscode.window.showInputBox({
                placeHolder: 'Enter execution input as JSON',
                value: '{}'
            });
            if(input === undefined) return;
            
            if(!ui.isJsonString(input)) {
                ui.showErrorMessage('Invalid JSON input', new Error('Input must be valid JSON'));
                return;
            }
            inputJson = input;
        } else if(inputType === 'Select File') {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectMany: false,
                filters: { 'JSON': ['json'] }
            });
            if(!fileUri || fileUri.length === 0) return;

            try {
                const content = fs.readFileSync(fileUri[0].fsPath, 'utf-8');
                if(!ui.isJsonString(content)) {
                    ui.showErrorMessage('Invalid JSON file', new Error('File must contain valid JSON'));
                    return;
                }
                inputJson = content;
            } catch (error: any) {
                ui.logToOutput('Failed to read payload file', error);
                ui.showErrorMessage('Failed to read payload file', error);
                return;
            }

        }
        }
        
        this.StartWorking();

        try {
            if(!this.StateMachineArn) {
                await this.ResolveArn();
            }
            if(!this.StateMachineArn) {
                ui.showWarningMessage('State machine ARN not available');
                this.StopWorking();
                return;
            }

            const result = await api.StartExecution(
                this.Region,
                this.StateMachineArn,
                inputJson
            );

            if(result.isSuccessful && result.result) {
                ui.showInfoMessage('Execution started successfully. Execution ARN: ' + result.result);
                
                if(node) {
                    const executionNameParts = result.result.split(':');
                    const executionName = executionNameParts[executionNameParts.length - 1];
                    const newExecutionNode = new StateMachineExecutionNode(executionName, node);
                    newExecutionNode.ExecutionArn = result.result;
                    newExecutionNode.Status = 'RUNNING';
                    newExecutionNode.StartDate = new Date().toLocaleString();
                    newExecutionNode.StopDate = '';
                    this.RefreshTree(this.Parent);
                }
            } else {
                ui.logToOutput('api.StartExecution Error !!!', result.error);
                ui.showErrorMessage('Failed to start execution', result.error);
            }
        } catch (error: any) {
            ui.logToOutput('StateMachineNode.NodeRun Error !!!', error);
            ui.showErrorMessage('Failed to start execution', error);
        }
        this.StopWorking();
 
    }
}

// Register with NodeRegistry for deserialization
NodeRegistry.register('StateMachineNode', StateMachineNode);
