import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { SQSQueueNode } from './SQSQueueNode';

export class SQSDlqLinkNode extends NodeBase {

    public DlqArn: string = "";

    constructor(label: string, dlqArn: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "warning";
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.DlqArn = dlqArn;
        
        // Extract queue name from ARN for description
        const parts = dlqArn.split(':');
        const queueName = parts[parts.length - 1];
        this.description = queueName;
        
        // Attach event handlers
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        
        this.SetContextValue();
    }

    private async handleNodeRun(): Promise<void> {
        ui.logToOutput('SQSDlqLinkNode.handleNodeRun Started');

        // Try to find the DLQ in the tree and reveal it
        const dlqNode = this.findDlqInTree();
        
        if (dlqNode) {
            // Reveal the node in the tree
            this.RefreshTree();
            ui.showInfoMessage(`Found DLQ: ${dlqNode.label}`);
        } else {
            // DLQ not in tree, show info with ARN
            const action = await vscode.window.showInformationMessage(
                `Dead Letter Queue: ${this.DlqArn}`,
                'Copy ARN'
            );
            
            if (action === 'Copy ARN') {
                await vscode.env.clipboard.writeText(this.DlqArn);
                ui.showInfoMessage('DLQ ARN copied to clipboard');
            }
        }
    }

    private findDlqInTree(): SQSQueueNode | undefined {
        // Search through root nodes to find a queue with matching ARN
        for (const rootNode of NodeBase.RootNodes) {
            const found = this.searchNodeTree(rootNode);
            if (found) {
                return found;
            }
        }
        return undefined;
    }

    private searchNodeTree(node: NodeBase): SQSQueueNode | undefined {
        if (node instanceof SQSQueueNode && node.QueueArn === this.DlqArn) {
            return node;
        }
        for (const child of node.Children) {
            const found = this.searchNodeTree(child);
            if (found) {
                return found;
            }
        }
        return undefined;
    }
}

