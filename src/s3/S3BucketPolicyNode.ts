import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { S3BucketNode } from './S3BucketNode';

export class S3BucketPolicyNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = 'shield';
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;

        this.OnNodeView.subscribe(() => this.handleNodeView());

        this.SetContextValue();
    }

    public GetBucketNode(): S3BucketNode | undefined {
        if (this.Parent instanceof S3BucketNode) {
            return this.Parent;
        }
        return undefined;
    }

    private async handleNodeView(): Promise<void> {
        ui.logToOutput('S3BucketPolicyNode.handleNodeView Started');

        const bucketNode = this.GetBucketNode();
        if (!bucketNode || !bucketNode.BucketName) {
            ui.showWarningMessage('Bucket information is not available.');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        try {
            const result = await api.GetBucketPolicy(bucketNode.BucketName);

            if (!result.isSuccessful) {
                ui.logToOutput('api.GetBucketPolicy Error !!!', result.error);
                ui.showErrorMessage('Get Bucket Policy Error !!!', result.error);
                return;
            }

            if (!result.result) {
                ui.showInfoMessage('No policy configured for this bucket.');
                return;
            }

            let policyContent: string;
            try {
                const policyObj = JSON.parse(result.result);
                policyContent = JSON.stringify(policyObj, null, 2);
            } catch {
                policyContent = result.result;
            }

            const document = await vscode.workspace.openTextDocument({
                content: policyContent,
                language: 'json'
            });
            await vscode.window.showTextDocument(document);

        } catch (error: any) {
            ui.logToOutput('S3BucketPolicyNode.handleNodeView Error !!!', error);
            ui.showErrorMessage('Get Bucket Policy Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }
}
