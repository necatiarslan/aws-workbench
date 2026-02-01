"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3TagNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
class S3TagNode extends NodeBase_1.NodeBase {
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
        ui.logToOutput('S3TagNode.NodeRemove Started');
        if (!this.Key) {
            return;
        }
        const confirmation = await vscode.window.showWarningMessage(`Are you sure you want to remove tag "${this.Key}"?`, { modal: true }, 'Yes', 'No');
        if (confirmation !== 'Yes') {
            return;
        }
        const bucketNode = this.GetAwsResourceNode();
        if (!bucketNode || !bucketNode.BucketName) {
            ui.logToOutput('S3TagNode.NodeRemove - Parent S3 bucket node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        const result = await api.RemoveS3BucketTag(bucketNode.BucketName, this.Key);
        if (!result.isSuccessful) {
            ui.logToOutput('api.RemoveS3BucketTag Error !!!', result.error);
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
        ui.logToOutput('S3TagNode.NodeEdit Started');
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
        const bucketNode = this.GetAwsResourceNode();
        if (!bucketNode || !bucketNode.BucketName) {
            ui.logToOutput('S3TagNode.NodeEdit - Parent S3 bucket node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        const result = await api.UpdateS3BucketTag(bucketNode.BucketName, this.Key, newValue);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateS3BucketTag Error !!!', result.error);
            ui.showErrorMessage('Update Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }
        ui.showInfoMessage('Tag Updated Successfully');
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }
}
exports.S3TagNode = S3TagNode;
//# sourceMappingURL=S3TagNode.js.map