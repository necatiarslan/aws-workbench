import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { S3BucketNode } from './S3BucketNode';
import { S3InfoNode } from './S3InfoNode';

export class S3InfoGroupNode extends NodeBase {
    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = 'info';
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeRefresh(): Promise<void> {
        ui.logToOutput('S3InfoGroupNode.NodeRefresh Started');
        const bucketNode = this.Parent as S3BucketNode;
        if (!bucketNode || !bucketNode.BucketName) {
            ui.logToOutput('S3InfoGroupNode.NodeRefresh - Parent S3BucketNode not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        const bucketInfo = await bucketNode.Info;
        if (!bucketInfo) {
            ui.logToOutput('S3InfoGroupNode.NodeRefresh - Failed to get bucket info');
            ui.showErrorMessage('Failed to get bucket info', new Error('Bucket info is undefined'));
            this.StopWorking();
            return;
        }
        this.Children = [];
        const infoItems = [
            { key: 'Bucket ARN', value: bucketInfo.BucketArn || 'N/A' },
            { key: 'Bucket Region', value: bucketInfo.BucketRegion || 'N/A' },
            { key: 'Location Name', value: bucketInfo.BucketLocationName || 'N/A' },
            { key: 'Location Type', value: bucketInfo.BucketLocationType || 'N/A' },
        ];
        for (const item of infoItems) {
            new S3InfoNode(item.key, item.value, this);
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        this.StopWorking();
        this.RefreshTree();
    }
}
