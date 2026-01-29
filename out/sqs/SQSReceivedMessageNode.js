"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSReceivedMessageNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const SQSReceiveGroupNode_1 = require("./SQSReceiveGroupNode");
const SQSMessageView_1 = require("./SQSMessageView");
const ServiceHub_1 = require("../tree/ServiceHub");
class SQSReceivedMessageNode extends NodeBase_1.NodeBase {
    MessageId = "";
    ReceiptHandle = "";
    Body = "";
    Attributes = {};
    IsDeleted = false;
    constructor(message, parent) {
        const msgId = message.MessageId || 'Unknown';
        const shortId = msgId.length > 20 ? msgId.substring(0, 20) + '...' : msgId;
        super(shortId, parent);
        this.Icon = "mail";
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.MessageId = message.MessageId || '';
        this.ReceiptHandle = message.ReceiptHandle || '';
        this.Body = message.Body || '';
        this.Attributes = message.Attributes || {};
        // Set description to show preview of body
        const bodyPreview = this.Body.length > 50 ? this.Body.substring(0, 50) + '...' : this.Body;
        this.description = bodyPreview;
        // Attach event handlers
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.SetContextValue();
    }
    GetQueueNode() {
        if (this.Parent instanceof SQSReceiveGroupNode_1.SQSReceiveGroupNode) {
            return this.Parent.GetQueueNode();
        }
        return undefined;
    }
    async handleNodeOpen() {
        // Open message body in a new text document
        const content = this.formatMessageContent();
        const document = await vscode.workspace.openTextDocument({
            content: content,
            language: 'json'
        });
        await vscode.window.showTextDocument(document);
    }
    async handleNodeView() {
        // Open in webview for better viewing experience
        SQSMessageView_1.SQSMessageView.Render(ServiceHub_1.ServiceHub.Current.Context.extensionUri, this);
    }
    formatMessageContent() {
        const messageData = {
            MessageId: this.MessageId,
            Body: this.tryParseJson(this.Body),
            Attributes: this.Attributes,
            ReceiptHandle: this.ReceiptHandle
        };
        return JSON.stringify(messageData, null, 2);
    }
    tryParseJson(str) {
        try {
            return JSON.parse(str);
        }
        catch {
            return str;
        }
    }
    async handleNodeRemove() {
        ui.logToOutput('SQSReceivedMessageNode.handleNodeRemove Started');
        const queueNode = this.GetQueueNode();
        if (!queueNode || !queueNode.QueueUrl || !queueNode.Region) {
            ui.showWarningMessage('Queue information is not available.');
            return;
        }
        if (!this.ReceiptHandle) {
            ui.showWarningMessage('Receipt handle is not available.');
            this.Remove();
            return;
        }
        // Ask for confirmation
        const confirm = await vscode.window.showWarningMessage(`Delete message ${this.MessageId} from queue?`, { modal: true }, 'Delete');
        if (confirm !== 'Delete') {
            return;
        }
        this.StartWorking();
        try {
            const result = await api.DeleteMessage(queueNode.Region, queueNode.QueueUrl, this.ReceiptHandle);
            if (!result.isSuccessful) {
                ui.logToOutput('api.DeleteMessage Error !!!', result.error);
                ui.showErrorMessage('Delete Message Error !!!', result.error);
                this.StopWorking();
                return;
            }
            this.IsDeleted = true;
            this.Icon = "mail-read";
            this.Remove();
            ui.showInfoMessage('Message deleted successfully');
            ui.logToOutput('Message deleted: ' + this.MessageId);
        }
        catch (error) {
            ui.logToOutput('SQSReceivedMessageNode.handleNodeRemove Error !!!', error);
            ui.showErrorMessage('Delete Message Error !!!', error);
        }
        this.StopWorking();
    }
}
exports.SQSReceivedMessageNode = SQSReceivedMessageNode;
//# sourceMappingURL=SQSReceivedMessageNode.js.map