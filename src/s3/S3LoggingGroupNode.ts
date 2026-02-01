import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { S3BucketNode } from './S3BucketNode';
import { S3ConfigPropertyNode } from './S3ConfigPropertyNode';

export class S3LoggingGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = 'file-binary';
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        this.OnNodeLoadChildren.subscribe(() => this.handleNodeLoadChildren());
        this.OnNodeRefresh.subscribe(() => this.handleNodeLoadChildren());

        this.SetContextValue();
    }

    public GetBucketNode(): S3BucketNode | undefined {
        if (this.Parent instanceof S3BucketNode) {
            return this.Parent;
        }
        return undefined;
    }

    private async handleNodeLoadChildren(): Promise<void> {
        ui.logToOutput('S3LoggingGroupNode.handleNodeLoadChildren Started');

        const bucketNode = this.GetBucketNode();
        if (!bucketNode || !bucketNode.BucketName) {
            ui.logToOutput('S3LoggingGroupNode - Parent S3BucketNode not found');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        try {
            const result = await api.GetBucketLogging(bucketNode.BucketName);

            if (!result.isSuccessful) {
                ui.logToOutput('api.GetBucketLogging Error !!!', result.error);
                this.StopWorking();
                return;
            }

            this.Children = [];
            const loggingConfig = result.result;

            if (!loggingConfig) {
                this.collapsibleState = vscode.TreeItemCollapsibleState.None;
                this.StopWorking();
                this.RefreshTree();
                return;
            }

            const targetBucket = loggingConfig.TargetBucket || 'N/A';
            const targetPrefix = loggingConfig.TargetPrefix || 'N/A';

            new S3ConfigPropertyNode('Target Bucket', targetBucket, this);
            new S3ConfigPropertyNode('Target Prefix', targetPrefix, this);

            if (this.Children.length > 0) {
                this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
            }

            this.StopWorking();
            this.RefreshTree();
        } catch (error: any) {
            ui.logToOutput('S3LoggingGroupNode Error !!!', error);
            this.StopWorking();
        }
    }
}
