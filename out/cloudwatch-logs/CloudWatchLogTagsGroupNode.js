"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudWatchLogTagsGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const CloudWatchLogTagNode_1 = require("./CloudWatchLogTagNode");
const CloudWatchLogGroupNode_1 = require("./CloudWatchLogGroupNode");
class CloudWatchLogTagsGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "tag";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
    }
    async handleNodeRefresh() {
        ui.logToOutput('CloudWatchLogTagsGroupNode.NodeRefresh Started');
        const awsResourceNode = this.GetAwsResourceNode();
        if (!(awsResourceNode instanceof CloudWatchLogGroupNode_1.CloudWatchLogGroupNode)) {
            ui.logToOutput('CloudWatchLogTagsGroupNode.NodeRefresh - Parent CloudWatch Log Group not found');
            return;
        }
        // if (this.IsWorking) {
        //     return;
        // }
        this.StartWorking();
        const result = await api.GetLogGroupTags(awsResourceNode.Region, awsResourceNode.LogGroup);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetLogGroupTags Error !!!', result.error);
            ui.showErrorMessage('Get Log Group Tags Error !!!', result.error);
            this.StopWorking();
            return;
        }
        this.Children = [];
        const tags = result.result || [];
        for (const tag of tags) {
            new CloudWatchLogTagNode_1.CloudWatchLogTagNode(tag.key, tag.value, this);
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        this.StopWorking();
        this.RefreshTree();
    }
    async handleNodeAdd() {
        ui.logToOutput('CloudWatchLogTagsGroupNode.NodeAdd Started');
        const key = await vscode.window.showInputBox({
            prompt: 'Tag Key',
            placeHolder: 'Enter tag key'
        });
        if (!key) {
            return;
        }
        const value = await vscode.window.showInputBox({
            prompt: 'Tag Value',
            placeHolder: 'Enter tag value'
        });
        if (value === undefined) {
            return;
        }
        const awsResourceNode = this.GetAwsResourceNode();
        if (!(awsResourceNode instanceof CloudWatchLogGroupNode_1.CloudWatchLogGroupNode)) {
            ui.logToOutput('CloudWatchLogTagsGroupNode.NodeAdd - Parent CloudWatch Log Group not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        const result = await api.UpdateCloudWatchLogGroupTag(awsResourceNode.Region, awsResourceNode.LogGroup, key, value);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateCloudWatchLogGroupTag Error !!!', result.error);
            ui.showErrorMessage('Add Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }
        ui.showInfoMessage('Tag Added Successfully');
        this.StopWorking();
        await this.handleNodeRefresh();
    }
}
exports.CloudWatchLogTagsGroupNode = CloudWatchLogTagsGroupNode;
//# sourceMappingURL=CloudWatchLogTagsGroupNode.js.map