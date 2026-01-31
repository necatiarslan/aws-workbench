"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueTagsGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const GlueTagNode_1 = require("./GlueTagNode");
class GlueTagsGroupNode extends NodeBase_1.NodeBase {
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
        ui.logToOutput('GlueTagsGroupNode.NodeRefresh Started');
        const jobNode = this.Parent;
        if (!jobNode || !jobNode.JobName || !jobNode.Region) {
            ui.logToOutput('GlueTagsGroupNode.NodeRefresh - Parent Glue job node not found');
            return;
        }
        // if (this.IsWorking) {
        //     return;
        // }
        this.StartWorking();
        const result = await api.GetGlueJobTags(jobNode.Region, jobNode.JobName);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetGlueJobTags Error !!!', result.error);
            ui.showErrorMessage('Get Glue Job Tags Error !!!', result.error);
            this.StopWorking();
            return;
        }
        this.Children = [];
        const tags = result.result || [];
        for (const tag of tags) {
            new GlueTagNode_1.GlueTagNode(tag.key, tag.value, this);
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        this.StopWorking();
        this.RefreshTree();
    }
    async handleNodeAdd() {
        ui.logToOutput('GlueTagsGroupNode.NodeAdd Started');
        const jobNode = this.Parent;
        if (!jobNode || !jobNode.JobName || !jobNode.Region) {
            ui.logToOutput('GlueTagsGroupNode.NodeAdd - Parent Glue job node not found');
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
        const result = await api.UpdateGlueJobTag(jobNode.Region, jobNode.JobName, key, value);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateGlueJobTag Error !!!', result.error);
            ui.showErrorMessage('Add Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }
        ui.showInfoMessage('Tag Added Successfully');
        await this.handleNodeRefresh();
    }
}
exports.GlueTagsGroupNode = GlueTagsGroupNode;
//# sourceMappingURL=GlueTagsGroupNode.js.map