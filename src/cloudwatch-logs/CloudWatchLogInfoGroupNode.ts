import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { CloudWatchLogGroupNode } from './CloudWatchLogGroupNode';
import { CloudWatchLogInfoNode } from './CloudWatchLogInfoNode';

export class CloudWatchLogInfoGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "info";
        
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeRefresh(): Promise<void> {
        ui.logToOutput('CloudWatchLogInfoGroupNode.NodeRefresh Started');

        // Get the parent CloudWatchLogGroup node
        const logGroupNode = this.Parent as CloudWatchLogGroupNode;
        if (!logGroupNode || !logGroupNode.LogGroup) {
            ui.logToOutput('CloudWatchLogInfoGroupNode.NodeRefresh - Parent CloudWatchLogGroup node not found');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        // Get log group info using the Info property
        const logGroupInfo = await logGroupNode.Info;
        if (!logGroupInfo) {
            ui.logToOutput('CloudWatchLogInfoGroupNode.NodeRefresh - Failed to get log group info');
            ui.showErrorMessage('Failed to get log group info', new Error('Log group info is undefined'));
            this.StopWorking();
            return;
        }

        // Clear existing children
        this.Children = [];

        // Add info items as children
        const infoItems = [
            { key: 'Log Group Name', value: logGroupInfo.logGroupName || 'N/A' },
            { key: 'ARN', value: logGroupInfo.arn || 'N/A' },
            { key: 'Region', value: logGroupNode.Region || 'N/A' },
            { key: 'Creation Time', value: logGroupInfo.creationTime ? new Date(logGroupInfo.creationTime).toLocaleString() : 'N/A' },
            { key: 'Retention Days', value: logGroupInfo.retentionInDays?.toString() || 'Never Expire' },
            { key: 'Stored Bytes', value: logGroupInfo.storedBytes ? `${(logGroupInfo.storedBytes / 1024 / 1024).toFixed(2)} MB` : 'N/A' },
            { key: 'KMS Key ID', value: logGroupInfo.kmsKeyId || 'N/A' },
            { key: 'Data Protection Status', value: logGroupInfo.dataProtectionStatus || 'N/A' }
        ];

        for (const item of infoItems) {
            new CloudWatchLogInfoNode(item.key, item.value, this);
        }

        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }

        this.StopWorking();
        this.RefreshTree();
    }
}
