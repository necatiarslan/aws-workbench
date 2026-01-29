"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SNSPublishFileNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const TreeState_1 = require("../tree/TreeState");
const TreeProvider_1 = require("../tree/TreeProvider");
const path = require("path");
class SNSPublishFileNode extends NodeBase_1.NodeBase {
    constructor(filePath, fileId, parent) {
        super(path.basename(filePath), parent);
        this.Icon = "file";
        this.FilePath = filePath;
        this.FileId = fileId;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.tooltip = filePath;
        // Attach event handlers
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.SetContextValue();
    }
    FilePath = "";
    FileId = "";
    async handleNodeRun() {
        ui.logToOutput('SNSPublishFileNode.handleNodeRun Started');
        const topicNode = this.GetAwsResourceNode();
        if (!topicNode || !topicNode.TopicArn || !topicNode.Region) {
            ui.showWarningMessage('Topic ARN or region is not set.');
            return;
        }
        if (!this.FilePath) {
            ui.showWarningMessage('File path is not set.');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            // Read file content
            const fileUri = vscode.Uri.file(this.FilePath);
            const document = await vscode.workspace.openTextDocument(fileUri);
            const message = document.getText();
            if (!message || message.trim().length === 0) {
                ui.showWarningMessage('File is empty.');
                this.StopWorking();
                return;
            }
            const result = await api.PublishMessage(topicNode.Region, topicNode.TopicArn, message);
            if (!result.isSuccessful) {
                ui.logToOutput('api.PublishMessage Error !!!', result.error);
                ui.showErrorMessage('Publish Message Error !!!', result.error);
                return;
            }
            ui.logToOutput('api.PublishMessage Success - MessageId: ' + result.result?.MessageId);
            ui.showInfoMessage('Message published from file successfully. MessageId: ' + result.result?.MessageId);
        }
        catch (error) {
            ui.logToOutput('SNSPublishFileNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Publish Message Error !!!', error);
        }
        finally {
            this.StopWorking();
        }
    }
    async handleNodeOpen() {
        ui.logToOutput('SNSPublishFileNode.handleNodeOpen Started');
        if (!this.FilePath) {
            ui.showWarningMessage('File path is not set.');
            return;
        }
        try {
            ui.openFile(this.FilePath);
        }
        catch (error) {
            ui.logToOutput('SNSPublishFileNode.handleNodeOpen Error !!!', error);
            ui.showErrorMessage('Open File Error !!!', error);
        }
    }
    handleNodeRemove() {
        ui.logToOutput('SNSPublishFileNode.handleNodeRemove Started');
        // Remove from parent's MessageFiles array
        const topicNode = this.GetAwsResourceNode();
        if (topicNode) {
            topicNode.MessageFiles = topicNode.MessageFiles.filter(f => f.id !== this.FileId);
        }
        this.Remove();
        TreeState_1.TreeState.save();
        TreeProvider_1.TreeProvider.Current.Refresh(this.Parent);
    }
}
exports.SNSPublishFileNode = SNSPublishFileNode;
//# sourceMappingURL=SNSPublishFileNode.js.map