"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamTagNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
class IamTagNode extends NodeBase_1.NodeBase {
    constructor(Key, Value, parent) {
        super(Key, parent);
        this.Icon = "circle-outline";
        this.Key = Key;
        this.Value = Value;
        this.description = Value;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
    }
    Key = "";
    Value = "";
    async handleNodeRemove() {
        ui.logToOutput('IamTagNode.NodeRemove Started');
        if (!this.Key) {
            return;
        }
        const confirmation = await vscode.window.showWarningMessage(`Are you sure you want to remove tag "${this.Key}"?`, { modal: true }, 'Yes', 'No');
        if (confirmation !== 'Yes') {
            return;
        }
        // Resolve the parent IAM Role node
        const roleNode = this.GetAwsResourceNode();
        if (!roleNode || !roleNode.RoleName) {
            ui.logToOutput('IamTagNode.NodeRemove - Parent IAM Role node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // Remove tag
        const result = await api.RemoveIamRoleTag(roleNode.Region, roleNode.RoleName, this.Key);
        if (!result.isSuccessful) {
            ui.logToOutput('api.RemoveIamRoleTag Error !!!', result.error);
            ui.showErrorMessage('Remove Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }
        ui.showInfoMessage('Tag Removed Successfully');
        // Refresh the parent tags group to reflect changes
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }
    async handleNodeRefresh() {
        this.Parent?.NodeRefresh();
    }
    async handleNodeEdit() {
        ui.logToOutput('IamTagNode.NodeEdit Started');
        // Prompt for new value (allow empty string, but not undefined/cancel)
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
        // Resolve the parent IAM Role node
        const roleNode = this.GetAwsResourceNode();
        if (!roleNode || !roleNode.RoleName) {
            ui.logToOutput('IamTagNode.NodeEdit - Parent IAM Role node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // Update tag (same API as add; overwrites existing)
        const result = await api.UpdateIamRoleTag(roleNode.Region, roleNode.RoleName, this.Key, newValue);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateIamRoleTag Error !!!', result.error);
            ui.showErrorMessage('Update Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }
        ui.showInfoMessage('Tag Updated Successfully');
        // Refresh the parent tags group to show updated values
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }
}
exports.IamTagNode = IamTagNode;
//# sourceMappingURL=IamTagNode.js.map