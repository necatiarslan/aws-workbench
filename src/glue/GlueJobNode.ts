import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { TreeState } from '../tree/TreeState';
import { GlueCodeGroupNode } from './GlueCodeGroupNode';
import { GlueTriggerGroupNode } from './GlueTriggerGroupNode';
import { GlueInfoGroupNode } from './GlueInfoGroupNode';
import { GlueRunsGroupNode } from './GlueRunsGroupNode';
import { GlueLogsGroupNode } from './GlueLogsGroupNode';
import { GlueJobRunView } from './GlueJobRunView';
import { Job } from '@aws-sdk/client-glue';
import { ServiceHub } from '../tree/ServiceHub';

export class GlueJobNode extends NodeBase {

    constructor(JobName: string, parent?: NodeBase) {
        super(JobName, parent);
        this.Icon = "glue-job";
        this.JobName = JobName;
        
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;

        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        
        this.LoadDefaultChildren();
        this.SetContextValue();
    }

    @Serialize()
    public JobName: string = "";

    @Serialize()
    public Region: string = "";

    @Serialize()
    public CodePath: string = "";

    @Serialize()
    public TriggerFiles: { id: string; path: string }[] = [];

    private _jobConfig: Job | undefined = undefined;

    public get JobConfig(): Promise<Job | undefined> {
        return this.getJobConfig();
    }

    private async getJobConfig(): Promise<Job | undefined> {
        if (!this._jobConfig) {
            const response = await api.GetGlueJob(this.Region, this.JobName);
            if (response.isSuccessful) {
                this._jobConfig = response.result;
            } else {
                ui.logToOutput('api.GetGlueJob Error !!!', response.error);
                ui.showErrorMessage('Get Glue Job Error !!!', response.error);
            }
        }
        return this._jobConfig;
    }

    public set JobConfig(value: Job | undefined) {
        this._jobConfig = value;
    }

    public async LoadDefaultChildren(): Promise<void> {
        new GlueCodeGroupNode("Code", this);
        new GlueTriggerGroupNode("Trigger", this);
        new GlueInfoGroupNode("Info", this);
        new GlueRunsGroupNode("Runs", this);
        new GlueLogsGroupNode("Logs", this);
    }

    private handleNodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

    private async handleNodeRun(): Promise<void> {
        // Open the Job Run View webview
        GlueJobRunView.Render(
            this.Region,
            this.JobName
        );
    }

    public async TriggerJob(filePath?: string): Promise<void> {
        ui.logToOutput('GlueJobNode.TriggerJob Started');

        if (!this.JobName || !this.Region) {
            ui.showWarningMessage('Glue job or region is not set.');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        let payloadInput: string | undefined;
        let payloadObj: Record<string, string> = {};

        if (filePath) {
            // If filePath is provided, read content and use as payload
            try {
                const fileUri = vscode.Uri.file(filePath);
                const document = await vscode.workspace.openTextDocument(fileUri);
                payloadInput = document.getText();
            } catch (error: any) {
                ui.logToOutput('GlueJobNode.TriggerJob Error reading payload file!!!', error);
                ui.showErrorMessage('Failed to read payload file', error);
                return;
            }
        } else {
            // Prompt for payload JSON (optional)
            payloadInput = await vscode.window.showInputBox({
                value: '',
                placeHolder: 'Enter Arguments JSON or leave empty'
            });

            if (payloadInput === undefined) { return; }
        }

        if (payloadInput && payloadInput.trim().length > 0) {
            if (!ui.isJsonString(payloadInput)) {
                ui.showInfoMessage('Arguments should be a valid JSON object');
                return;
            }

            payloadObj = JSON.parse(payloadInput);
        }

        this.StartWorking();

        try {
            const result = await api.StartGlueJob(
                this.Region, 
                this.JobName, 
                Object.keys(payloadObj).length > 0 ? payloadObj : undefined
            );

            if (!result.isSuccessful) {
                ui.logToOutput('api.StartGlueJob Error !!!', result.error);
                ui.showErrorMessage('Start Glue Job Error !!!', result.error);
                return;
            }

            ui.logToOutput('api.StartGlueJob Success !!!');
            ui.logToOutput('JobRunId: ' + result.result);
            ui.showInfoMessage(`Glue Job Started Successfully. Run ID: ${result.result}`);
        } catch (error: any) {
            ui.logToOutput('GlueJobNode.TriggerJob Error !!!', error);
            ui.showErrorMessage('Trigger Glue Job Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }

    private async handleNodeInfo(): Promise<void> {
        ui.logToOutput('GlueJobNode.NodeInfo Started');

        if (!this.JobName || !this.Region) {
            ui.showWarningMessage('Glue job or region is not set.');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        try {
            const config = await this.JobConfig;
            if (config) {
                const jsonContent = JSON.stringify(config, null, 2);
                const document = await vscode.workspace.openTextDocument({
                    content: jsonContent,
                    language: 'json'
                });
                await vscode.window.showTextDocument(document);
            } else {
                ui.showWarningMessage('Failed to load Glue job configuration');
            }
        } catch (error: any) {
            ui.logToOutput('GlueJobNode.NodeInfo Error !!!', error);
            ui.showErrorMessage('Failed to open configuration', error);
        }
        this.StopWorking();
    }
}

// Register with NodeRegistry for deserialization
NodeRegistry.register('GlueJobNode', GlueJobNode);
