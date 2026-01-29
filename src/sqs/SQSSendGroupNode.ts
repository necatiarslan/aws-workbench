import { NodeBase } from '../tree/NodeBase';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { v4 as uuidv4 } from 'uuid';
import { TreeState } from '../tree/TreeState';
import { SQSSendAdhocNode } from './SQSSendAdhocNode';
import { SQSSendFileNode } from './SQSSendFileNode';
import { SQSQueueNode } from './SQSQueueNode';

export class SQSSendGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "send";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        
        // Attach event handlers
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        
        this.LoadDefaultChildren();
        this.SetContextValue();
    }

    public async LoadDefaultChildren(): Promise<void> {
        new SQSSendAdhocNode("Adhoc", this);
        
        // Load any saved message files from parent queue node
        const queueNode = this.GetQueueNode();
        if (queueNode && queueNode.MessageFiles) {
            for (const file of queueNode.MessageFiles) {
                new SQSSendFileNode(file.path, this, file.id);
            }
        }
    }

    public GetQueueNode(): SQSQueueNode | undefined {
        if (this.Parent instanceof SQSQueueNode) {
            return this.Parent;
        }
        return undefined;
    }

    private async handleNodeAdd(): Promise<void> {
        ui.logToOutput('SQSSendGroupNode.handleNodeAdd Started');

        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: 'Select Message File',
            filters: {
                'JSON Files': ['json'],
                'Text Files': ['txt'],
                'All Files': ['*']
            }
        };

        const fileUri = await vscode.window.showOpenDialog(options);
        if (!fileUri || fileUri.length === 0) {
            return;
        }

        const filePath = fileUri[0].fsPath;
        const queueNode = this.GetQueueNode();
        
        if (queueNode) {
            const id = uuidv4();
            queueNode.MessageFiles.push({ id, path: filePath });
            new SQSSendFileNode(filePath, this, id);
            TreeState.save();
        }
    }
}

