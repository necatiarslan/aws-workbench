"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineTagNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
class StateMachineTagNode extends NodeBase_1.NodeBase {
    constructor(Key, Value, parent) {
        super(Key, parent);
        this.Icon = "circle-outline";
        this.Key = Key;
        this.Value = Value;
        this.description = Value;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.OnNodeCopy.subscribe(() => this.handleNodeCopy());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
    }
    Key = "";
    Value = "";
    async handleNodeCopy() {
        const info = `${this.Key}: ${this.Value}`;
        ui.CopyToClipboard(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }
    async handleNodeRemove() {
        ui.logToOutput('StateMachineTagNode.NodeRemove Started');
        if (!this.Key) {
            return;
        }
        const confirmation = await vscode.window.showWarningMessage(`Are you sure you want to remove tag "${this.Key}"?`, { modal: true }, 'Yes', 'No');
        if (confirmation !== 'Yes') {
            return;
        }
        const stateMachineNode = this.GetAwsResourceNode();
        if (!stateMachineNode || !stateMachineNode.StateMachineArn || !stateMachineNode.Region) {
            ui.logToOutput('StateMachineTagNode.NodeRemove - Parent StateMachine node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        const result = await api.RemoveStateMachineTag(stateMachineNode.Region, stateMachineNode.StateMachineArn, this.Key);
        if (!result.isSuccessful) {
            ui.logToOutput('api.RemoveStateMachineTag Error !!!', result.error);
            ui.showErrorMessage('Remove Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }
        ui.showInfoMessage('Tag Removed Successfully');
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }
    async handleNodeRefresh() {
        this.Parent?.NodeRefresh();
    }
    async handleNodeEdit() {
        ui.logToOutput('StateMachineTagNode.NodeEdit Started');
        const newValue = await vscode.window.showInputBox({
            value: this.Value,
            placeHolder: 'Enter New Value for ' + this.Key
        });
        if (newValue === undefined) {
            return;
        }
        if (!this.Key) {
            return;
        }
        const stateMachineNode = this.GetAwsResourceNode();
        if (!stateMachineNode || !stateMachineNode.StateMachineArn || !stateMachineNode.Region) {
            ui.logToOutput('StateMachineTagNode.NodeEdit - Parent StateMachine node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        const result = await api.UpdateStateMachineTag(stateMachineNode.Region, stateMachineNode.StateMachineArn, this.Key, newValue);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateStateMachineTag Error !!!', result.error);
            ui.showErrorMessage('Update Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }
        ui.showInfoMessage('Tag Updated Successfully');
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }
}
exports.StateMachineTagNode = StateMachineTagNode;
//# sourceMappingURL=StateMachineTagNode.js.map