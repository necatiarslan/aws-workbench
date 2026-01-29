"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamPolicyDocumentNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const fs = require("fs");
class IamPolicyDocumentNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "file-code";
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.SetContextValue();
    }
    Region = "";
    PolicyArn = "";
    PolicyName = "";
    VersionId = undefined;
    DocumentType = 'policy';
    RoleName = "";
    async handleNodeOpen() {
        ui.logToOutput('IamPolicyDocumentNode.NodeOpen Started');
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            let jsonContent;
            if (this.DocumentType === 'trust') {
                // Get trust policy document
                const result = await api.GetIamRoleTrustPolicy(this.Region, this.RoleName);
                if (!result.isSuccessful) {
                    ui.logToOutput('api.GetIamRoleTrustPolicy Error !!!', result.error);
                    ui.showErrorMessage('Get Trust Policy Error !!!', result.error);
                    return;
                }
                jsonContent = JSON.stringify(result.result, null, 2);
            }
            else {
                // Get policy document
                const result = await api.GetPolicyDocument(this.Region, this.PolicyArn, this.VersionId);
                if (!result.isSuccessful) {
                    ui.logToOutput('api.GetPolicyDocument Error !!!', result.error);
                    ui.showErrorMessage('Get Policy Document Error !!!', result.error);
                    return;
                }
                jsonContent = JSON.stringify(result.result, null, 2);
            }
            const document = await vscode.workspace.openTextDocument({
                content: jsonContent,
                language: 'json'
            });
            await vscode.window.showTextDocument(document);
        }
        finally {
            this.StopWorking();
        }
    }
    async handleNodeView() {
        ui.logToOutput('IamPolicyDocumentNode.NodeView (Download) Started');
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            let jsonContent;
            let defaultFileName;
            if (this.DocumentType === 'trust') {
                // Get trust policy document
                const result = await api.GetIamRoleTrustPolicy(this.Region, this.RoleName);
                if (!result.isSuccessful) {
                    ui.logToOutput('api.GetIamRoleTrustPolicy Error !!!', result.error);
                    ui.showErrorMessage('Get Trust Policy Error !!!', result.error);
                    return;
                }
                jsonContent = JSON.stringify(result.result, null, 2);
                defaultFileName = `${this.RoleName}-trust-policy.json`;
            }
            else {
                // Get policy document
                const result = await api.GetPolicyDocument(this.Region, this.PolicyArn, this.VersionId);
                if (!result.isSuccessful) {
                    ui.logToOutput('api.GetPolicyDocument Error !!!', result.error);
                    ui.showErrorMessage('Get Policy Document Error !!!', result.error);
                    return;
                }
                jsonContent = JSON.stringify(result.result, null, 2);
                defaultFileName = `${this.PolicyName}${this.VersionId ? '-' + this.VersionId : ''}.json`;
            }
            // Ask user where to save the file
            const saveOptions = {
                defaultUri: vscode.Uri.file(defaultFileName),
                filters: {
                    'JSON files': ['json'],
                    'All files': ['*']
                }
            };
            const fileUri = await vscode.window.showSaveDialog(saveOptions);
            if (!fileUri) {
                return;
            }
            // Save the policy document to file
            fs.writeFileSync(fileUri.fsPath, jsonContent, 'utf8');
            ui.showInfoMessage(`Policy saved to ${fileUri.fsPath}`);
            ui.logToOutput(`Policy saved to ${fileUri.fsPath}`);
        }
        catch (error) {
            ui.showErrorMessage('Failed to save policy file', error);
            ui.logToOutput('Failed to save policy file', error);
        }
        finally {
            this.StopWorking();
        }
    }
}
exports.IamPolicyDocumentNode = IamPolicyDocumentNode;
//# sourceMappingURL=IamPolicyDocumentNode.js.map