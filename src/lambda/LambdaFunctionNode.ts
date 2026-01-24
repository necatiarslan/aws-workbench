import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { TextDecoder } from 'util';
import { TreeState } from '../tree/TreeState';
import { LambdaCodeGroupNode } from './LambdaCodeGroupNode';
import { LambdaEnvGroupNode } from './LambdaEnvGroupNode';
import { LambdaInfoGroupNode } from './LambdaInfoGroupNode';
import { LambdaLogGroupNode } from './LambdaLogGroupNode';
import { LambdaTagGroupNode } from './LambdaTagGroupNode';
import { LambdaTriggerGroupNode } from './LambdaTriggerGroupNode';
import { LambdaCodeFileNode } from './LambdaCodeFileNode';
import { LambdaCodeUploadNode } from './LambdaCodeUploadNode';
import { LambdaCodeDownloadNode } from './LambdaCodeDownloadNode';
import { FunctionConfiguration } from '@aws-sdk/client-lambda';

export class LambdaFunctionNode extends NodeBase {

    constructor(FunctionName: string, parent?: NodeBase) 
    {
        super(FunctionName, parent);
        this.Icon = "lambda-function";
        this.FunctionName = FunctionName;

        this.EnableNodeRemove = true;
        this.EnableNodeRun = true;
        this.EnableNodeAlias = true;
        this.EnableNodeInfo = true;
        this.IsAwsResourceNode = true;
        this.SetContextValue();
        
        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeRun.subscribe((arg) => this.handleNodeRun());
        this.OnNodeInfo.subscribe((arg) => this.handleNodeInfo());
        
        this.LoadDefaultChildren();
    }

    @Serialize()
    public FunctionName: string = "";

    @Serialize()
    public Region: string = "";

    @Serialize()
    public CodePath: string = "";

    @Serialize()
    public TriggerFiles: { id: string; path: string }[] = [];

    public _configuration: FunctionConfiguration | undefined = undefined;

    public get Configuration(): Promise<FunctionConfiguration | undefined> {
        return this.getConfiguration();
    }

    private async getConfiguration(): Promise<FunctionConfiguration | undefined> {
        if(!this._configuration) {
            const response = await api.GetLambdaConfiguration(this.Region, this.FunctionName);
            if (response.isSuccessful) {
                this._configuration = response.result;
            } else {
                ui.logToOutput('api.GetLambdaConfiguration Error !!!', response.error);
                ui.showErrorMessage('Get Lambda Configuration Error !!!', response.error);
            }
        }
        return this._configuration;
    }

    public set Configuration(value: FunctionConfiguration | undefined) {
        this._configuration = value;
    }

    public async LoadDefaultChildren(): Promise<void> {
        const code = new LambdaCodeGroupNode("Code", this);
        new LambdaCodeFileNode("Select File", code);
        new LambdaCodeDownloadNode("Download", code);
        new LambdaCodeUploadNode("Upload", code);

        new LambdaEnvGroupNode("Env", this);
        new LambdaInfoGroupNode("Info", this);
        new LambdaLogGroupNode("Logs", this);
        new LambdaTagGroupNode("Tags", this);
        new LambdaTriggerGroupNode("Triggers", this);
    }

    private handleNodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

    private async handleNodeRun(): Promise<void> {
        ui.logToOutput('LambdaFunctionNode.NodeRun Started');

        if (!this.FunctionName || !this.Region) {
            ui.showWarningMessage('Lambda function or region is not set.');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        let payloadInput: string | undefined;
        let payloadObj: any = {};

        // Prompt for payload JSON (optional)
        payloadInput = await vscode.window.showInputBox({
            value: '',
            placeHolder: 'Enter Payload JSON or leave empty'
        });

        if (payloadInput === undefined) { return; }

        if (payloadInput.trim().length > 0) {
            if (!ui.isJsonString(payloadInput)) {
                ui.showInfoMessage('Payload should be a valid JSON');
                return;
            }

            payloadObj = JSON.parse(payloadInput);
        }

        this.StartWorking();

        try {
            const result = await api.TriggerLambda(this.Region, this.FunctionName, payloadObj);

            if (!result.isSuccessful) {
                ui.logToOutput('api.TriggerLambda Error !!!', result.error);
                ui.showErrorMessage('Trigger Lambda Error !!!', result.error);
                return;
            }

            ui.logToOutput('api.TriggerLambda Success !!!');

            if (result.result?.$metadata?.requestId) {
                ui.logToOutput('RequestId: ' + result.result.$metadata.requestId);
            }

            const payloadBuffer = result.result?.Payload;
            if (payloadBuffer) {
                const payloadString = new TextDecoder('utf-8').decode(payloadBuffer);
                let prettyPayload = payloadString;

                try {
                    prettyPayload = JSON.stringify(JSON.parse(payloadString), null, 2);
                } catch {
                    // If not valid JSON, keep raw string
                }

                ui.logToOutput('api.TriggerLambda PayLoad \n' + prettyPayload);
            }

            ui.showInfoMessage('Lambda Triggered Successfully');
        } catch (error: any) {
            ui.logToOutput('LambdaFunctionNode.NodeRun Error !!!', error);
            ui.showErrorMessage('Trigger Lambda Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }

    private async handleNodeInfo(): Promise<void> {
        ui.logToOutput('LambdaFunctionNode.NodeInfo Started');

        if (!this.FunctionName || !this.Region) {
            ui.showWarningMessage('Lambda function or region is not set.');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        try {
            const config = await this.Configuration;
            if (config) {
            const jsonContent = JSON.stringify(config, null, 2);
            const document = await vscode.workspace.openTextDocument({
                content: jsonContent,
                language: 'json'
            });
            await vscode.window.showTextDocument(document);
            } else {
            ui.showWarningMessage('Failed to load Lambda configuration');
            }
        } catch (error: any) {
            ui.logToOutput('LambdaFunctionNode.NodeInfo Error !!!', error);
            ui.showErrorMessage('Failed to open configuration', error);
        }
        this.StopWorking();
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('LambdaFunctionNode', LambdaFunctionNode);