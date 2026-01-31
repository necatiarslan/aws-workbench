import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { TreeState } from '../tree/TreeState';
import { SNSTopicNode } from './SNSTopicNode';
import { SNSPublishAdhocNode } from './SNSPublishAdhocNode';
import { SNSPublishFileNode } from './SNSPublishFileNode';

export class SNSPublishGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "send";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        // Attach event handlers
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeLoaded.subscribe(() => this.handleNodeLoaded());
        
        this.LoadDefaultChildren();
        this.SetContextValue();
    }

    private LoadDefaultChildren(): void {
        new SNSPublishAdhocNode("Adhoc", this);
    }

    private handleNodeLoaded(): void {
        // Restore message file nodes from parent's MessageFiles array
        const topicNode = this.Parent as SNSTopicNode;
        if (topicNode && topicNode.MessageFiles) {
            for (const file of topicNode.MessageFiles) {
                new SNSPublishFileNode(file.path, file.id, this);
            }
        }
    }

    private async handleNodeAdd(): Promise<void> {
        ui.logToOutput('SNSPublishGroupNode.handleNodeAdd Started');

        const selectedPath = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select Message File',
            canSelectFiles: true,
            filters: {
                'JSON files': ['json'],
                'Text files': ['txt'],
                'All files': ['*']
            }
        });

        if (!selectedPath || selectedPath.length === 0) { return; }

        const filePath = selectedPath[0].fsPath;
        
        // Add to parent's MessageFiles array
        const topicNode = this.Parent as SNSTopicNode;
        if (topicNode) {
            const id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
            topicNode.MessageFiles.push({ id, path: filePath });
            
            // Create the file node
            new SNSPublishFileNode(filePath, id, this);
            
            TreeState.save();
            this.RefreshTree()
            ui.showInfoMessage('Message file added successfully');
        }
    }
}
