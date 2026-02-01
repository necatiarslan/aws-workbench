"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3NotificationGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const S3BucketNode_1 = require("./S3BucketNode");
const S3ConfigPropertyNode_1 = require("./S3ConfigPropertyNode");
class S3NotificationGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = 'bell';
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeLoadChildren());
        this.OnNodeRefresh.subscribe(() => this.handleNodeLoadChildren());
        this.SetContextValue();
    }
    GetBucketNode() {
        if (this.Parent instanceof S3BucketNode_1.S3BucketNode) {
            return this.Parent;
        }
        return undefined;
    }
    async handleNodeLoadChildren() {
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
                new S3ConfigPropertyNode_1.S3ConfigPropertyNode(`SNS Topic ${i + 1}`, topicArn, this);
                new S3ConfigPropertyNode_1.S3ConfigPropertyNode(`  Events`, events, this);
            }
            // Add SQS queue configurations
            for (let i = 0; i < queueConfigs.length; i++) {
                const queue = queueConfigs[i];
                const queueArn = queue.QueueArn || 'N/A';
                const events = (queue.Events || []).join(', ') || 'N/A';
                new S3ConfigPropertyNode_1.S3ConfigPropertyNode(`SQS Queue ${i + 1}`, queueArn, this);
                new S3ConfigPropertyNode_1.S3ConfigPropertyNode(`  Events`, events, this);
            }
            // Add Lambda function configurations
            for (let i = 0; i < lambdaConfigs.length; i++) {
                const lambda = lambdaConfigs[i];
                const lambdaArn = lambda.LambdaFunctionArn || 'N/A';
                const events = (lambda.Events || []).join(', ') || 'N/A';
                new S3ConfigPropertyNode_1.S3ConfigPropertyNode(`Lambda Function ${i + 1}`, lambdaArn, this);
                new S3ConfigPropertyNode_1.S3ConfigPropertyNode(`  Events`, events, this);
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
        }
        catch (error) {
            ui.logToOutput('S3NotificationGroupNode Error !!!', error);
            this.StopWorking();
        }
    }
}
exports.S3NotificationGroupNode = S3NotificationGroupNode;
//# sourceMappingURL=S3NotificationGroupNode.js.map