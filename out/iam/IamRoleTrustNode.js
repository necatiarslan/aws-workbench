"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamRoleTrustNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
class IamRoleTrustNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "person";
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.SetContextValue();
    }
    TrustEntity = "";
    TrustType = "";
    Region = "";
    RoleName = "";
    async handleNodeView() {
        ui.logToOutput('IamRoleTrustNode.NodeView Started');
        if (!this.RoleName) {
            ui.showWarningMessage('IAM Role information not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            const result = await api.GetIamRoleTrustPolicy(this.Region, this.RoleName);
            if (!result.isSuccessful) {
                ui.logToOutput('api.GetIamRoleTrustPolicy Error !!!', result.error);
                ui.showErrorMessage('Get Trust Policy Error !!!', result.error);
                return;
            }
            // Display the trust policy document as formatted JSON
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
exports.IamRoleTrustNode = IamRoleTrustNode;
//# sourceMappingURL=IamRoleTrustNode.js.map