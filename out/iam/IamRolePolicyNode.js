"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamRolePolicyNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
class IamRolePolicyNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "key";
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.SetContextValue();
    }
    PolicyName = "";
    PolicyArn = "";
    Region = "";
    async handleNodeView() {
        ui.logToOutput('IamRolePolicyNode.NodeView Started');
        if (!this.PolicyArn) {
            ui.showWarningMessage('Policy ARN not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            const result = await api.GetPolicyDocument(this.Region, this.PolicyArn);
            if (!result.isSuccessful) {
                ui.logToOutput('api.GetPolicyDocument Error !!!', result.error);
                ui.showErrorMessage('Get Policy Document Error !!!', result.error);
                return;
            }
            // Display the policy document as formatted JSON
            const jsonString = JSON.stringify(result.result, null, 2);
            const document = await vscode.workspace.openTextDocument({
                content: jsonString,
                language: 'json'
            });
            await vscode.window.showTextDocument(document);
        }
        finally {
            this.StopWorking();
        }
    }
}
exports.IamRolePolicyNode = IamRolePolicyNode;
//# sourceMappingURL=IamRolePolicyNode.js.map