"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamPolicyVersionNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const fs = __importStar(require("fs"));
class IamPolicyVersionNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "file-code";
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.SetContextValue();
    }
    VersionId = "";
    IsDefault = false;
    CreateDate = "";
    PolicyArn = "";
    PolicyName = "";
    Region = "";
    async handleNodeOpen() {
        ui.logToOutput('IamPolicyVersionNode.NodeOpen Started');
        if (!this.PolicyArn || !this.VersionId) {
            ui.showWarningMessage('Policy version information not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            const result = await api.GetPolicyDocument(this.Region, this.PolicyArn, this.VersionId);
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
    async handleNodeView() {
        ui.logToOutput('IamPolicyVersionNode.NodeView (Download) Started');
        if (!this.PolicyArn || !this.VersionId) {
            ui.showWarningMessage('Policy version information not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            const result = await api.GetPolicyDocument(this.Region, this.PolicyArn, this.VersionId);
            if (!result.isSuccessful) {
                ui.logToOutput('api.GetPolicyDocument Error !!!', result.error);
                ui.showErrorMessage('Get Policy Document Error !!!', result.error);
                return;
            }
            // Ask user where to save the file
            const saveOptions = {
                defaultUri: vscode.Uri.file(`${this.PolicyName}-${this.VersionId}.json`),
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
            const jsonString = JSON.stringify(result.result, null, 2);
            fs.writeFileSync(fileUri.fsPath, jsonString, 'utf8');
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
exports.IamPolicyVersionNode = IamPolicyVersionNode;
//# sourceMappingURL=IamPolicyVersionNode.js.map