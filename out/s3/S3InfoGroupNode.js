"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3InfoGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const S3InfoNode_1 = require("./S3InfoNode");
class S3InfoGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = 'info';
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('S3InfoGroupNode.NodeRefresh Started');
        const bucketNode = this.Parent;
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
            new S3InfoNode_1.S3InfoNode(item.key, item.value, this);
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        this.StopWorking();
        this.RefreshTree();
    }
}
exports.S3InfoGroupNode = S3InfoGroupNode;
//# sourceMappingURL=S3InfoGroupNode.js.map