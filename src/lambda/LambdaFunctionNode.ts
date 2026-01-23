import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { TextDecoder } from 'util';
import { ServiceHub } from '../tree/ServiceHub';
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

export class LambdaFunctionNode extends NodeBase {

    constructor(FunctionName: string, parent?: NodeBase) 
    {
        super(FunctionName, parent);
        this.Icon = "lambda-function";
        this.FunctionName = FunctionName;

        this.EnableNodeRemove = true;
        this.EnableNodeRun = true;
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;
        this.SetContextValue();
        this.LoadDefaultChildren();
    }

    @Serialize()
    public FunctionName: string = "";

    @Serialize()
    public Region: string = "";

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

    public async NodeAdd(): Promise<void> {

    }

    public NodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

    public NodeRefresh(): void {
    }

    public NodeView(): void {
        //TODO: Implement Lambda function details viewing logic here
    }

    public async NodeEdit(): Promise<void> {
         
    }

    public async NodeRun(): Promise<void> {
       ui.logToOutput('LambdaFunctionNode.NodeRun Started');

        if (!this.FunctionName || !this.Region) {
            ui.showWarningMessage('Lambda function or region is not set.');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        // Prompt for payload JSON (optional)
        const payloadInput = await vscode.window.showInputBox({
            value: '',
            placeHolder: 'Enter Payload JSON or leave empty'
        });

        if (payloadInput === undefined) { return; }

        let payloadObj: any = {};
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

    public NodeStop(): void {
        //TODO: Implement Lambda function stop logic here
    }

    public NodeOpen(): void {
    }

    public NodeInfo(): void {
        //TODO: Implement Lambda function info display logic here
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('LambdaFunctionNode', LambdaFunctionNode);