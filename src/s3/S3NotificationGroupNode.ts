import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { S3BucketNode } from './S3BucketNode';
import { S3ConfigPropertyNode } from './S3ConfigPropertyNode';

export class S3NotificationGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = 'bell';
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
        ui.logToOutput('S3NotificationGroupNode.handleNodeLoadChildren Started');

        const bucketNode = this.GetBucketNode();
        if (!bucketNode || !bucketNode.BucketName) {
            ui.logToOutput('S3NotificationGroupNode - Parent S3BucketNode not found');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        try {
            const result = await api.GetBucketNotificationConfiguration(bucketNode.BucketName);

            if (!result.isSuccessful) {
                ui.logToOutput('api.GetBucketNotificationConfiguration Error !!!', result.error);
                this.StopWorking();
                return;
            }

            this.Children = [];
            const config = result.result || {};
            const topicConfigs = config.TopicConfigurations || [];
            const queueConfigs = config.QueueConfigurations || [];
            const lambdaConfigs = config.LambdaFunctionConfigurations || [];

            // Add SNS topic configurations
            for (let i = 0; i < topicConfigs.length; i++) {
                const topic = topicConfigs[i];
                const topicArn = topic.TopicArn || 'N/A';
                const events = (topic.Events || []).join(', ') || 'N/A';
                new S3ConfigPropertyNode(`SNS Topic ${i + 1}`, topicArn, this);
                new S3ConfigPropertyNode(`  Events`, events, this);
            }

            // Add SQS queue configurations
            for (let i = 0; i < queueConfigs.length; i++) {
                const queue = queueConfigs[i];
                const queueArn = queue.QueueArn || 'N/A';
                const events = (queue.Events || []).join(', ') || 'N/A';
                new S3ConfigPropertyNode(`SQS Queue ${i + 1}`, queueArn, this);
                new S3ConfigPropertyNode(`  Events`, events, this);
            }

            // Add Lambda function configurations
            for (let i = 0; i < lambdaConfigs.length; i++) {
                const lambda = lambdaConfigs[i];
                const lambdaArn = lambda.LambdaFunctionArn || 'N/A';
                const events = (lambda.Events || []).join(', ') || 'N/A';
                new S3ConfigPropertyNode(`Lambda Function ${i + 1}`, lambdaArn, this);
                new S3ConfigPropertyNode(`  Events`, events, this);
            }

            const totalConfigs = topicConfigs.length + queueConfigs.length + lambdaConfigs.length;
            if (totalConfigs === 0) {
                this.collapsibleState = vscode.TreeItemCollapsibleState.None;
                this.StopWorking();
                this.RefreshTree();
                return;
            }

            if (this.Children.length > 0) {
                this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
            }

            this.StopWorking();
            this.RefreshTree();
        } catch (error: any) {
            ui.logToOutput('S3NotificationGroupNode Error !!!', error);
            this.StopWorking();
        }
    }
}
