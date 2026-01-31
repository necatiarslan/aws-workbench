"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineTagsGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const StateMachineTagNode_1 = require("./StateMachineTagNode");
class StateMachineTagsGroupNode extends NodeBase_1.NodeBase {
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
        ui.logToOutput('StateMachineTagsGroupNode.NodeRefresh Started');
        const stateMachineNode = this.Parent;
        if (!stateMachineNode || !stateMachineNode.StateMachineArn || !stateMachineNode.Region) {
            ui.logToOutput('StateMachineTagsGroupNode.NodeRefresh - Parent StateMachine node not found');
            return;
        }
        // if (this.IsWorking) {
        //     return;
        // }
        this.StartWorking();
        const result = await api.GetStateMachineTags(stateMachineNode.Region, stateMachineNode.StateMachineArn);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetStateMachineTags Error !!!', result.error);
            ui.showErrorMessage('Get State Machine Tags Error !!!', result.error);
            this.StopWorking();
            return;
        }
        this.Children = [];
        const tags = result.result || [];
        for (const tag of tags) {
            new StateMachineTagNode_1.StateMachineTagNode(tag.key, tag.value, this);
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        this.StopWorking();
        this.RefreshTree();
    }
    async handleNodeAdd() {
        ui.logToOutput('StateMachineTagsGroupNode.NodeAdd Started');
        const stateMachineNode = this.Parent;
        if (!stateMachineNode || !stateMachineNode.StateMachineArn || !stateMachineNode.Region) {
            ui.logToOutput('StateMachineTagsGroupNode.NodeAdd - Parent StateMachine node not found');
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
        const result = await api.UpdateStateMachineTag(stateMachineNode.Region, stateMachineNode.StateMachineArn, key, value);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateStateMachineTag Error !!!', result.error);
            ui.showErrorMessage('Add Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }
        ui.showInfoMessage('Tag Added Successfully');
        await this.handleNodeRefresh();
    }
}
exports.StateMachineTagsGroupNode = StateMachineTagsGroupNode;
//# sourceMappingURL=StateMachineTagsGroupNode.js.map