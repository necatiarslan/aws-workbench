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
exports.SQSQueueNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const uuid_1 = require("uuid");
const SQSSendGroupNode_1 = require("./SQSSendGroupNode");
const SQSReceiveGroupNode_1 = require("./SQSReceiveGroupNode");
const SQSInfoGroupNode_1 = require("./SQSInfoGroupNode");
const SQSPolicyNode_1 = require("./SQSPolicyNode");
const SQSTagsGroupNode_1 = require("./SQSTagsGroupNode");
class SQSQueueNode extends NodeBase_1.NodeBase {
    constructor(QueueName, parent) {
        super(QueueName, parent);
        this.Icon = "sqs-queue";
        this.QueueName = QueueName;
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;
        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        this.LoadDefaultChildren();
        this.SetContextValue();
    }
    QueueName = "";
    QueueUrl = "";
    QueueArn = "";
    Region = "";
    IsFifo = false;
    DlqQueueArn;
    MessageFiles = [];
    async LoadDefaultChildren() {
        new SQSInfoGroupNode_1.SQSInfoGroupNode("Info", this);
        new SQSSendGroupNode_1.SQSSendGroupNode("Send", this);
        new SQSReceiveGroupNode_1.SQSReceiveGroupNode("Receive", this);
        new SQSPolicyNode_1.SQSPolicyNode("Policy", this);
        new SQSTagsGroupNode_1.SQSTagsGroupNode("Tags", this);
    }
    handleNodeRemove() {
        this.Remove();
        this.TreeSave();
    }
    async handleNodeInfo() {
        ui.logToOutput('SQSQueueNode.handleNodeInfo Started');
        if (!this.QueueUrl || !this.Region) {
            ui.showWarningMessage('Queue URL or region is not set.');
            return;
        }
        this.StartWorking();
        try {
            const result = await api.GetQueueAttributes(this.Region, this.QueueUrl);
            if (!result.isSuccessful || !result.result) {
                ui.logToOutput('api.GetQueueAttributes Error !!!', result.error);
                ui.showErrorMessage('Get Queue Attributes Error !!!', result.error);
                this.StopWorking();
                return;
            }
            // Create a formatted JSON document with queue info
            const queueInfo = {
                QueueName: this.QueueName,
                QueueUrl: this.QueueUrl,
                QueueArn: result.result.QueueArn,
                Region: this.Region,
                Type: result.result.IsFifo ? 'FIFO' : 'Standard',
                ApproximateNumberOfMessages: result.result.ApproximateNumberOfMessages,
                ApproximateNumberOfMessagesNotVisible: result.result.ApproximateNumberOfMessagesNotVisible,
                ApproximateNumberOfMessagesDelayed: result.result.ApproximateNumberOfMessagesDelayed,
                VisibilityTimeout: result.result.VisibilityTimeout + ' seconds',
                MaximumMessageSize: result.result.MaximumMessageSize + ' bytes',
                MessageRetentionPeriod: result.result.MessageRetentionPeriod + ' seconds',
                DelaySeconds: result.result.DelaySeconds + ' seconds',
                ContentBasedDeduplication: result.result.ContentBasedDeduplication,
                DeadLetterQueue: result.result.DlqQueueArn || 'Not configured',
                CreatedTimestamp: result.result.CreatedTimestamp,
                LastModifiedTimestamp: result.result.LastModifiedTimestamp
            };
            const content = JSON.stringify(queueInfo, null, 2);
            const document = await vscode.workspace.openTextDocument({
                content: content,
                language: 'json'
            });
            await vscode.window.showTextDocument(document);
        }
        catch (error) {
            ui.logToOutput('SQSQueueNode.handleNodeInfo Error !!!', error);
            ui.showErrorMessage('Get Queue Info Error !!!', error);
        }
        this.StopWorking();
    }
    AddMessageFile(filePath) {
        const id = (0, uuid_1.v4)();
        this.MessageFiles.push({ id, path: filePath });
        this.TreeSave();
    }
    RemoveMessageFile(id) {
        this.MessageFiles = this.MessageFiles.filter(f => f.id !== id);
        this.TreeSave();
    }
}
exports.SQSQueueNode = SQSQueueNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], SQSQueueNode.prototype, "QueueName", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], SQSQueueNode.prototype, "QueueUrl", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], SQSQueueNode.prototype, "QueueArn", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], SQSQueueNode.prototype, "Region", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", Boolean)
], SQSQueueNode.prototype, "IsFifo", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], SQSQueueNode.prototype, "DlqQueueArn", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", Array)
], SQSQueueNode.prototype, "MessageFiles", void 0);
NodeRegistry_1.NodeRegistry.register('SQSQueueNode', SQSQueueNode);
//# sourceMappingURL=SQSQueueNode.js.map