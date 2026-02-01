"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudWatchLogTagNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const api = require("./API");
const ui = require("../common/UI");
const vscode = require("vscode");
const CloudWatchLogGroupNode_1 = require("./CloudWatchLogGroupNode");
class CloudWatchLogTagNode extends NodeBase_1.NodeBase {
    Key = "";
    Value = "";
    constructor(key, value, parent) {
        super(key, parent);
        this.Key = key;
        this.Value = value;
        this.description = value;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.Icon = "circle-outline";
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
    }
    SetContextValue() {
        this.contextValue = "AwsWorkbenchCloudWatchLogTagNode";
        this.contextValue += "#CanRefresh#";
        this.contextValue += "#CanEdit#";
        this.contextValue += "#CanRemove#";
        this.contextValue += "#CanCopyToClipboard#";
    }
    async handleNodeOpen() {
        const info = `${this.Key}: ${this.Value}`;
        await vscode.env.clipboard.writeText(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }
    async handleNodeRemove() {
        const confirmation = await vscode.window.showWarningMessage(`Are you sure you want to remove tag "${this.Key}"?`, { modal: true }, 'Yes', 'No');
        if (confirmation !== 'Yes') {
            return;
        }
        const logGroupNode = this.GetAwsResourceNode();
        if (!(logGroupNode instanceof CloudWatchLogGroupNode_1.CloudWatchLogGroupNode)) {
            ui.logToOutput('CloudWatchLogTagNode.NodeRemove - Parent CloudWatch Log Group not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        const result = await api.RemoveCloudWatchLogGroupTag(logGroupNode.Region, logGroupNode.LogGroup, this.Key);
        if (!result.isSuccessful) {
            ui.logToOutput('api.RemoveCloudWatchLogGroupTag Error !!!', result.error);
            ui.showErrorMessage('Remove Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }
        ui.showInfoMessage('Tag Removed Successfully');
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }
    async handleNodeEdit() {
        const newValue = await vscode.window.showInputBox({
            prompt: `Edit tag value for '${this.Key}'`,
            value: this.Value
        });
        if (newValue === undefined) {
            return;
        }
        const awsResourceNode = this.GetAwsResourceNode();
        if (!(awsResourceNode instanceof CloudWatchLogGroupNode_1.CloudWatchLogGroupNode)) {
            ui.logToOutput('CloudWatchLogTagNode.NodeEdit - Parent CloudWatch Log Group not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        const result = await api.UpdateCloudWatchLogGroupTag(awsResourceNode.Region, awsResourceNode.LogGroup, this.Key, newValue);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateCloudWatchLogGroupTag Error !!!', result.error);
            ui.showErrorMessage('Update Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }
        this.Value = newValue;
        this.description = newValue;
        ui.showInfoMessage('Tag Updated Successfully');
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }
    async handleNodeRefresh() {
        const awsResourceNode = this.GetAwsResourceNode();
        if (!(awsResourceNode instanceof CloudWatchLogGroupNode_1.CloudWatchLogGroupNode)) {
            ui.logToOutput('CloudWatchLogTagNode.NodeRefresh - Parent CloudWatch Log Group not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        const result = await api.GetLogGroupTags(awsResourceNode.Region, awsResourceNode.LogGroup);
        this.StopWorking();
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetLogGroupTags Error !!!', result.error);
            ui.showErrorMessage('Refresh Tag Error !!!', result.error);
            return;
        }
        const tag = result.result?.find(t => t.key === this.Key);
        if (tag) {
            this.Value = tag.value;
            this.description = tag.value;
            this.Parent?.NodeRefresh();
        }
        else {
            ui.showWarningMessage(`Tag '${this.Key}' no longer exists`);
            this.Parent?.NodeRefresh();
        }
    }
}
exports.CloudWatchLogTagNode = CloudWatchLogTagNode;
//# sourceMappingURL=CloudWatchLogTagNode.js.map