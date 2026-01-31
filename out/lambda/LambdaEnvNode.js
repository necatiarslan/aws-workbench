"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaEnvNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const api = require("./API");
class LambdaEnvNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "circle-filled";
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.SetContextValue();
    }
    Key = "";
    Value = "";
    async handleNodeEdit() {
        ui.logToOutput('LambdaEnvNode.NodeEdit Started');
        // Resolve the parent Lambda function node to get region/name
        const lambdaNode = this.GetAwsResourceNode();
        if (!lambdaNode || !lambdaNode.FunctionName) {
            ui.logToOutput('LambdaEnvNode.NodeEdit - Parent Lambda node not found');
            return;
        }
        if (!this.Key) {
            ui.logToOutput('LambdaEnvNode.NodeEdit - Environment variable key missing');
            return;
        }
        const newValue = await vscode.window.showInputBox({
            value: this.Value,
            placeHolder: 'Enter New Value for ' + this.Key
        });
        // User canceled input
        if (newValue === undefined) {
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        const result = await api.UpdateLambdaEnvironmentVariable(lambdaNode.Region, lambdaNode.FunctionName, this.Key, newValue);
        if (!result.isSuccessful) {
            ui.logToOutput("api.UpdateLambdaEnvironmentVariable Error !!!", result.error);
            ui.showErrorMessage('Update Environment Variable Error !!!', result.error);
            this.StopWorking();
            return;
        }
        // Update local state and UI
        this.Value = newValue;
        this.label = `${this.Key} = ${newValue}`;
        ui.showInfoMessage('Environment Variable Updated Successfully');
        // Refresh parent group to reload variables
        if (this.Parent) {
            this.Parent.NodeRefresh();
        }
        else {
            this.RefreshTree();
        }
        this.StopWorking();
    }
}
exports.LambdaEnvNode = LambdaEnvNode;
//# sourceMappingURL=LambdaEnvNode.js.map