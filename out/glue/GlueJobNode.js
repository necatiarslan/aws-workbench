"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueJobNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const TreeState_1 = require("../tree/TreeState");
const GlueCodeGroupNode_1 = require("./GlueCodeGroupNode");
const GlueTriggerGroupNode_1 = require("./GlueTriggerGroupNode");
const GlueInfoGroupNode_1 = require("./GlueInfoGroupNode");
const GlueRunsGroupNode_1 = require("./GlueRunsGroupNode");
const GlueLogsGroupNode_1 = require("./GlueLogsGroupNode");
const GlueJobRunView_1 = require("./GlueJobRunView");
class GlueJobNode extends NodeBase_1.NodeBase {
    constructor(JobName, parent) {
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
    JobName = "";
    Region = "";
    CodePath = "";
    TriggerFiles = [];
    _jobConfig = undefined;
    get JobConfig() {
        return this.getJobConfig();
    }
    async getJobConfig() {
        if (!this._jobConfig) {
            const response = await api.GetGlueJob(this.Region, this.JobName);
            if (response.isSuccessful) {
                this._jobConfig = response.result;
            }
            else {
                ui.logToOutput('api.GetGlueJob Error !!!', response.error);
                ui.showErrorMessage('Get Glue Job Error !!!', response.error);
            }
        }
        return this._jobConfig;
    }
    set JobConfig(value) {
        this._jobConfig = value;
    }
    async LoadDefaultChildren() {
        new GlueCodeGroupNode_1.GlueCodeGroupNode("Code", this);
        new GlueTriggerGroupNode_1.GlueTriggerGroupNode("Trigger", this);
        new GlueInfoGroupNode_1.GlueInfoGroupNode("Info", this);
        new GlueRunsGroupNode_1.GlueRunsGroupNode("Runs", this);
        new GlueLogsGroupNode_1.GlueLogsGroupNode("Logs", this);
    }
    handleNodeRemove() {
        this.Remove();
        TreeState_1.TreeState.save();
    }
    async handleNodeRun() {
        // Open the Job Run View webview
        GlueJobRunView_1.GlueJobRunView.Render(this.Region, this.JobName);
    }
    async TriggerJob(filePath) {
        ui.logToOutput('GlueJobNode.TriggerJob Started');
        if (!this.JobName || !this.Region) {
            ui.showWarningMessage('Glue job or region is not set.');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        let payloadInput;
        let payloadObj = {};
        if (filePath) {
            // If filePath is provided, read content and use as payload
            try {
                const fileUri = vscode.Uri.file(filePath);
                const document = await vscode.workspace.openTextDocument(fileUri);
                payloadInput = document.getText();
            }
            catch (error) {
                ui.logToOutput('GlueJobNode.TriggerJob Error reading payload file!!!', error);
                ui.showErrorMessage('Failed to read payload file', error);
                return;
            }
        }
        else {
            // Prompt for payload JSON (optional)
            payloadInput = await vscode.window.showInputBox({
                value: '',
                placeHolder: 'Enter Arguments JSON or leave empty'
            });
            if (payloadInput === undefined) {
                return;
            }
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
            const result = await api.StartGlueJob(this.Region, this.JobName, Object.keys(payloadObj).length > 0 ? payloadObj : undefined);
            if (!result.isSuccessful) {
                ui.logToOutput('api.StartGlueJob Error !!!', result.error);
                ui.showErrorMessage('Start Glue Job Error !!!', result.error);
                return;
            }
            ui.logToOutput('api.StartGlueJob Success !!!');
            ui.logToOutput('JobRunId: ' + result.result);
            ui.showInfoMessage(`Glue Job Started Successfully. Run ID: ${result.result}`);
        }
        catch (error) {
            ui.logToOutput('GlueJobNode.TriggerJob Error !!!', error);
            ui.showErrorMessage('Trigger Glue Job Error !!!', error);
        }
        finally {
            this.StopWorking();
        }
    }
    async handleNodeInfo() {
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
            }
            else {
                ui.showWarningMessage('Failed to load Glue job configuration');
            }
        }
        catch (error) {
            ui.logToOutput('GlueJobNode.NodeInfo Error !!!', error);
            ui.showErrorMessage('Failed to open configuration', error);
        }
        this.StopWorking();
    }
}
exports.GlueJobNode = GlueJobNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], GlueJobNode.prototype, "JobName", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], GlueJobNode.prototype, "Region", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], GlueJobNode.prototype, "CodePath", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", Array)
], GlueJobNode.prototype, "TriggerFiles", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('GlueJobNode', GlueJobNode);
//# sourceMappingURL=GlueJobNode.js.map