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
exports.StateMachineNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const StateMachineDefinitionGroupNode_1 = require("./StateMachineDefinitionGroupNode");
const StateMachineTriggerGroupNode_1 = require("./StateMachineTriggerGroupNode");
const StateMachineExecutionsGroupNode_1 = require("./StateMachineExecutionsGroupNode");
const StateMachineLogsGroupNode_1 = require("./StateMachineLogsGroupNode");
const StateMachineStudioView_1 = require("./StateMachineStudioView");
const Session_1 = require("../common/Session");
const StateMachineExecutionNode_1 = require("./StateMachineExecutionNode");
const StateMachineInfoGroupNode_1 = require("./StateMachineInfoGroupNode");
const StateMachineTagsGroupNode_1 = require("./StateMachineTagsGroupNode");
const fs = require("fs");
class StateMachineNode extends NodeBase_1.NodeBase {
    constructor(stateMachineName, parent) {
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
    StateMachineName = "";
    Region = "";
    StateMachineArn = "";
    CodePath = "";
    PayloadFiles = [];
    LogGroupName = "";
    ExecutionFilters = [];
    _definition = undefined;
    AddExecutionFilter(NodeId, startDate, executionName, statusFilter) {
        this.ExecutionFilters.push({ NodeId, startDate: startDate.getTime(), executionName, statusFilter });
        this.TreeSave();
    }
    RemoveExecutionFilter(NodeId) {
        this.ExecutionFilters = this.ExecutionFilters.filter(filter => {
            return filter.NodeId !== NodeId;
        });
        this.TreeSave();
    }
    async GetDefinition() {
        if (!this._definition) {
            if (!this.StateMachineArn) {
                await this.ResolveArn();
            }
            if (!this.StateMachineArn) {
                return undefined;
            }
            const response = await api.GetStateMachineDefinition(this.Region, this.StateMachineArn);
            if (response.isSuccessful && response.result) {
                this._definition = response.result;
                // Extract log group if logging is configured
                if (response.result.loggingConfiguration?.destinations) {
                    const logArn = response.result.loggingConfiguration.destinations[0]?.cloudWatchLogsLogGroup?.logGroupArn;
                    if (logArn) {
                        // Extract log group name from ARN
                        const parts = logArn.split(':');
                        if (parts.length >= 7) {
                            this.LogGroupName = parts[6];
                        }
                    }
                }
            }
            else {
                ui.logToOutput('api.GetStateMachineDefinition Error !!!', response.error);
                ui.showErrorMessage('Get State Machine Definition Error !!!', response.error);
            }
        }
        return this._definition;
    }
    async ResolveArn() {
        // Build ARN from region and name if not already set
        if (!this.StateMachineArn && this.Region && this.StateMachineName) {
            const result = await api.GetStateMachineList(this.Region, this.StateMachineName);
            if (result.isSuccessful && result.result && Array.isArray(result.result)) {
                const match = result.result.find((sm) => sm.name === this.StateMachineName);
                if (match && match.stateMachineArn) {
                    this.StateMachineArn = match.stateMachineArn;
                }
            }
        }
    }
    async LoadDefaultChildren() {
        new StateMachineInfoGroupNode_1.StateMachineInfoGroupNode("Info", this);
        new StateMachineDefinitionGroupNode_1.StateMachineDefinitionGroupNode("Definition", this);
        new StateMachineTriggerGroupNode_1.StateMachineTriggerGroupNode("Trigger", this);
        new StateMachineExecutionsGroupNode_1.StateMachineExecutionsGroupNode("Executions", this);
        new StateMachineLogsGroupNode_1.StateMachineLogsGroupNode("Logs", this);
        new StateMachineTagsGroupNode_1.StateMachineTagsGroupNode("Tags", this);
    }
    handleNodeRemove() {
        this.Remove();
        this.TreeSave();
    }
    async handleNodeInfo() {
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
            }
            else {
                ui.showWarningMessage('Failed to load state machine definition');
            }
        }
        catch (error) {
            ui.logToOutput('StateMachineNode.NodeInfo Error !!!', error);
            ui.showErrorMessage('Failed to open definition', error);
        }
        this.StopWorking();
    }
    async handleNodeView() {
        ui.logToOutput('StateMachineNode.NodeView Started');
        if (!this.StateMachineName || !this.Region) {
            ui.showWarningMessage('State machine name or region is not set.');
            return;
        }
        if (this.CodePath.trim().length === 0) {
            ui.showWarningMessage('Please set definition file path first');
            return;
        }
        StateMachineStudioView_1.StateMachineStudioView.Render(Session_1.Session.Current.ExtensionUri, this.StateMachineName, this.CodePath);
    }
    async Trigger(filePath, node) {
        if (this.IsWorking) {
            ui.showInfoMessage('Execution already in progress');
            return;
        }
        let inputJson = '{}';
        if (filePath) {
            // Read input from the provided file path
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                if (!ui.isJsonString(content)) {
                    ui.showErrorMessage('Invalid JSON file', new Error('File must contain valid JSON'));
                    return;
                }
                inputJson = content;
            }
            catch (error) {
                ui.logToOutput('Failed to read payload file', error);
                ui.showErrorMessage('Failed to read payload file', error);
                return;
            }
        }
        else {
            // Prompt for execution input type
            const inputType = await vscode.window.showQuickPick(['Empty', 'Enter JSON', 'Select File'], { placeHolder: 'Select execution input type' });
            if (!inputType)
                return;
            if (inputType === 'Enter JSON') {
                const input = await vscode.window.showInputBox({
                    placeHolder: 'Enter execution input as JSON',
                    value: '{}'
                });
                if (input === undefined)
                    return;
                if (!ui.isJsonString(input)) {
                    ui.showErrorMessage('Invalid JSON input', new Error('Input must be valid JSON'));
                    return;
                }
                inputJson = input;
            }
            else if (inputType === 'Select File') {
                const fileUri = await vscode.window.showOpenDialog({
                    canSelectMany: false,
                    filters: { 'JSON': ['json'] }
                });
                if (!fileUri || fileUri.length === 0)
                    return;
                try {
                    const content = fs.readFileSync(fileUri[0].fsPath, 'utf-8');
                    if (!ui.isJsonString(content)) {
                        ui.showErrorMessage('Invalid JSON file', new Error('File must contain valid JSON'));
                        return;
                    }
                    inputJson = content;
                }
                catch (error) {
                    ui.logToOutput('Failed to read payload file', error);
                    ui.showErrorMessage('Failed to read payload file', error);
                    return;
                }
            }
        }
        this.StartWorking();
        try {
            if (!this.StateMachineArn) {
                await this.ResolveArn();
            }
            if (!this.StateMachineArn) {
                ui.showWarningMessage('State machine ARN not available');
                this.StopWorking();
                return;
            }
            const result = await api.StartExecution(this.Region, this.StateMachineArn, inputJson);
            if (result.isSuccessful && result.result) {
                ui.showInfoMessage('Execution started successfully. Execution ARN: ' + result.result);
                if (node) {
                    const executionNameParts = result.result.split(':');
                    const executionName = executionNameParts[executionNameParts.length - 1];
                    const newExecutionNode = new StateMachineExecutionNode_1.StateMachineExecutionNode(executionName, node);
                    newExecutionNode.ExecutionArn = result.result;
                    newExecutionNode.Status = 'RUNNING';
                    newExecutionNode.StartDate = new Date().toLocaleString();
                    newExecutionNode.StopDate = '';
                    this.RefreshTree(this.Parent);
                }
            }
            else {
                ui.logToOutput('api.StartExecution Error !!!', result.error);
                ui.showErrorMessage('Failed to start execution', result.error);
            }
        }
        catch (error) {
            ui.logToOutput('StateMachineNode.NodeRun Error !!!', error);
            ui.showErrorMessage('Failed to start execution', error);
        }
        this.StopWorking();
    }
}
exports.StateMachineNode = StateMachineNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], StateMachineNode.prototype, "StateMachineName", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], StateMachineNode.prototype, "Region", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], StateMachineNode.prototype, "StateMachineArn", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], StateMachineNode.prototype, "CodePath", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", Array)
], StateMachineNode.prototype, "PayloadFiles", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], StateMachineNode.prototype, "LogGroupName", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", Array)
], StateMachineNode.prototype, "ExecutionFilters", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('StateMachineNode', StateMachineNode);
//# sourceMappingURL=StateMachineNode.js.map