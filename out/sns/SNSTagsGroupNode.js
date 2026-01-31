"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SNSTagsGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const SNSTagNode_1 = require("./SNSTagNode");
class SNSTagsGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "tag";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('SNSTagsGroupNode.NodeRefresh Started');
        const topicNode = this.Parent;
        if (!topicNode || !topicNode.TopicArn || !topicNode.Region) {
            ui.logToOutput('SNSTagsGroupNode.NodeRefresh - Parent SNS topic node not found');
            return;
        }
        // if (this.IsWorking) {
        //     return;
        // }
        this.StartWorking();
        const result = await api.GetTopicTags(topicNode.Region, topicNode.TopicArn);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetTopicTags Error !!!', result.error);
            ui.showErrorMessage('Get Topic Tags Error !!!', result.error);
            this.StopWorking();
            return;
        }
        this.Children = [];
        const tags = result.result || [];
        for (const tag of tags) {
            new SNSTagNode_1.SNSTagNode(tag.key, tag.value, this);
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        this.StopWorking();
        this.RefreshTree();
    }
    async handleNodeAdd() {
        ui.logToOutput('SNSTagsGroupNode.NodeAdd Started');
        const topicNode = this.Parent;
        if (!topicNode || !topicNode.TopicArn || !topicNode.Region) {
            ui.logToOutput('SNSTagsGroupNode.NodeAdd - Parent SNS topic node not found');
            return;
        }
        const key = await vscode.window.showInputBox({
            placeHolder: 'Enter Tag Key'
        });
        if (!key) {
            return;
        }
        const value = await vscode.window.showInputBox({
            placeHolder: 'Enter Tag Value'
        });
        if (value === undefined) {
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        const result = await api.UpdateSNSTopicTag(topicNode.Region, topicNode.TopicArn, key, value);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateSNSTopicTag Error !!!', result.error);
            ui.showErrorMessage('Add Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }
        ui.showInfoMessage('Tag Added Successfully');
        await this.handleNodeRefresh();
    }
}
exports.SNSTagsGroupNode = SNSTagsGroupNode;
//# sourceMappingURL=SNSTagsGroupNode.js.map