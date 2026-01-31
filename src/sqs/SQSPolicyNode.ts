import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { SQSQueueNode } from './SQSQueueNode';

export class SQSPolicyNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "shield";
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        
        // Attach event handlers
        this.OnNodeView.subscribe(() => this.handleNodeView());
        
        this.SetContextValue();
    }

    public GetQueueNode(): SQSQueueNode | undefined {
        if (this.Parent instanceof SQSQueueNode) {
            return this.Parent;
        }
        return undefined;
    }

    private async handleNodeView(): Promise<void> {
        ui.logToOutput('SQSPolicyNode.handleNodeView Started');

        const queueNode = this.GetQueueNode();
        if (!queueNode || !queueNode.QueueUrl || !queueNode.Region) {
            ui.showWarningMessage('Queue information is not available.');
            return;
        }

        this.StartWorking();

        try {
            const result = await api.GetQueuePolicy(queueNode.Region, queueNode.QueueUrl);

            if (!result.isSuccessful) {
                ui.logToOutput('api.GetQueuePolicy Error !!!', result.error);
                ui.showErrorMessage('Get Queue Policy Error !!!', result.error);
                this.StopWorking();
                return;
            }

            let policyContent: string;
            if (result.result) {
                // Try to format the policy JSON
                try {
                    const policyObj = JSON.parse(result.result);
                    policyContent = JSON.stringify(policyObj, null, 2);
                } catch {
                    policyContent = result.result;
                }
            } else {
                policyContent = JSON.stringify({
                    message: "No policy configured for this queue"
                }, null, 2);
            }

            const document = await vscode.workspace.openTextDocument({
                content: policyContent,
                language: 'json'
            });
            await vscode.window.showTextDocument(document);

        } catch (error: any) {
            ui.logToOutput('SQSPolicyNode.handleNodeView Error !!!', error);
            ui.showErrorMessage('Get Queue Policy Error !!!', error);
        }

        this.StopWorking();
    }
}
