import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { TreeState } from '../tree/TreeState';
import { SNSTopicNode } from './SNSTopicNode';
import * as path from 'path';

export class SNSPublishFileNode extends NodeBase {

    constructor(filePath: string, fileId: string, parent?: NodeBase) {
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

    public FilePath: string = "";

    public FileId: string = "";

    private async handleNodeRun(): Promise<void> {
        ui.logToOutput('SNSPublishFileNode.handleNodeRun Started');

        const topicNode = this.GetAwsResourceNode() as SNSTopicNode;
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
        } catch (error: any) {
            ui.logToOutput('SNSPublishFileNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Publish Message Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }

    private async handleNodeOpen(): Promise<void> {
        ui.logToOutput('SNSPublishFileNode.handleNodeOpen Started');

        if (!this.FilePath) {
            ui.showWarningMessage('File path is not set.');
            return;
        }

        try {
            ui.openFile(this.FilePath);
        } catch (error: any) {
            ui.logToOutput('SNSPublishFileNode.handleNodeOpen Error !!!', error);
            ui.showErrorMessage('Open File Error !!!', error);
        }
    }

    private handleNodeRemove(): void {
        ui.logToOutput('SNSPublishFileNode.handleNodeRemove Started');

        // Remove from parent's MessageFiles array
        const topicNode = this.GetAwsResourceNode() as SNSTopicNode;
        if (topicNode) {
            topicNode.MessageFiles = topicNode.MessageFiles.filter(f => f.id !== this.FileId);
        }

        this.Remove();
        this.TreeSave();
        this.RefreshTree(this.Parent);
    }
}
