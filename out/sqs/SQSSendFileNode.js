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
exports.SQSSendFileNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const uuid_1 = require("uuid");
const TreeState_1 = require("../tree/TreeState");
const SQSSendGroupNode_1 = require("./SQSSendGroupNode");
const fs = require("fs");
const path = require("path");
class SQSSendFileNode extends NodeBase_1.NodeBase {
    constructor(filePath, parent, fileId) {
        const fileName = path.basename(filePath);
        super(fileName, parent);
        this.Icon = "mail";
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.FilePath = filePath;
        this.FileId = fileId || (0, uuid_1.v4)();
        // Attach event handlers
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.SetContextValue();
    }
    FilePath = "";
    FileId = "";
    GetQueueNode() {
        if (this.Parent instanceof SQSSendGroupNode_1.SQSSendGroupNode) {
            return this.Parent.GetQueueNode();
        }
        return undefined;
    }
    async handleNodeOpen() {
        if (this.FilePath && fs.existsSync(this.FilePath)) {
            const document = await vscode.workspace.openTextDocument(this.FilePath);
            await vscode.window.showTextDocument(document);
        }
        else {
            ui.showWarningMessage('File not found: ' + this.FilePath);
        }
    }
    handleNodeRemove() {
        const queueNode = this.GetQueueNode();
        if (queueNode) {
            queueNode.MessageFiles = queueNode.MessageFiles.filter(f => f.id !== this.FileId);
        }
        this.Remove();
        TreeState_1.TreeState.save();
    }
    async handleNodeRun() {
        ui.logToOutput('SQSSendFileNode.handleNodeRun Started');
        const queueNode = this.GetQueueNode();
        if (!queueNode || !queueNode.QueueUrl || !queueNode.Region) {
            ui.showWarningMessage('Queue information is not available.');
            return;
        }
        if (!this.FilePath || !fs.existsSync(this.FilePath)) {
            ui.showWarningMessage('Message file not found: ' + this.FilePath);
            return;
        }
        if (this.IsWorking) {
            return;
        }
        // Read file content
        let messageBody;
        try {
            messageBody = fs.readFileSync(this.FilePath, 'utf-8');
        }
        catch (error) {
            ui.showErrorMessage('Failed to read file', error);
            return;
        }
        // Validate JSON if file is .json
        if (this.FilePath.endsWith('.json') && !ui.isJsonString(messageBody)) {
            ui.showWarningMessage('File contains invalid JSON');
            return;
        }
        let messageGroupId;
        let messageDeduplicationId;
        // If FIFO queue, prompt for MessageGroupId (required) and DeduplicationId (optional)
        if (queueNode.IsFifo) {
            messageGroupId = await vscode.window.showInputBox({
                value: 'default',
                placeHolder: 'Message Group ID (required for FIFO)',
                prompt: 'Messages with the same group ID are processed in order'
            });
            if (messageGroupId === undefined || messageGroupId.trim().length === 0) {
                ui.showWarningMessage('Message Group ID is required for FIFO queues.');
                return;
            }
            messageDeduplicationId = await vscode.window.showInputBox({
                value: '',
                placeHolder: 'Message Deduplication ID (optional)',
                prompt: 'Leave empty for content-based deduplication (if enabled)'
            });
            if (messageDeduplicationId === '') {
                messageDeduplicationId = undefined;
            }
        }
        this.StartWorking();
        try {
            const result = await api.SendMessage(queueNode.Region, queueNode.QueueUrl, messageBody, messageGroupId, messageDeduplicationId);
            if (!result.isSuccessful) {
                ui.logToOutput('api.SendMessage Error !!!', result.error);
                ui.showErrorMessage('Send Message Error !!!', result.error);
                this.StopWorking();
                return;
            }
            ui.showInfoMessage(`Message sent successfully! MessageId: ${result.result?.MessageId}`);
            ui.logToOutput('Message sent successfully: ' + result.result?.MessageId);
        }
        catch (error) {
            ui.logToOutput('SQSSendFileNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Send Message Error !!!', error);
        }
        this.StopWorking();
    }
}
exports.SQSSendFileNode = SQSSendFileNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], SQSSendFileNode.prototype, "FilePath", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], SQSSendFileNode.prototype, "FileId", void 0);
//# sourceMappingURL=SQSSendFileNode.js.map