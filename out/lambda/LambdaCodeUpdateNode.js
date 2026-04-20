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
exports.LambdaCodeUpdateNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
class LambdaCodeUpdateNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "cloud-upload";
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.SetContextValue();
    }
    async handleNodeRun() {
        ui.logToOutput('LambdaCodeUpdateNode.NodeRun Started');
        // Get parent Lambda function node
        const lambdaNode = this.GetAwsResourceNode();
        if (!lambdaNode || !lambdaNode.FunctionName || !lambdaNode.Region) {
            ui.logToOutput('LambdaCodeUpdateNode.NodeRun - Parent Lambda node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        // Check if code path is set, if not prompt user
        let codePath = this.GetAwsResourceNode().CodePath;
        if (!codePath || codePath.trim().length === 0) {
            // Prompt user to select file or folder
            const selectedPath = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select Lambda Code File or Folder',
                filters: {
                    'All Files': ['*'],
                    'ZIP Files': ['zip'],
                    'Python Files': ['py'],
                    'JavaScript Files': ['js'],
                    'TypeScript Files': ['ts']
                }
            });
            if (!selectedPath || selectedPath.length === 0) {
                ui.showWarningMessage('Please Set Code Path First');
                return;
            }
            codePath = selectedPath[0].fsPath;
            this.GetAwsResourceNode().CodePath = codePath;
        }
        this.StartWorking();
        try {
            const result = await api.UpdateLambdaCode(lambdaNode.Region, lambdaNode.FunctionName, codePath);
            if (!result.isSuccessful) {
                ui.logToOutput('api.UpdateLambdaCode Error !!!', result.error);
                ui.showErrorMessage('Update Lambda Code Error !!!', result.error);
                return;
            }
            ui.logToOutput('api.UpdateLambdaCode Success !!!');
            ui.showInfoMessage('Lambda Code Updated Successfully');
        }
        catch (error) {
            ui.logToOutput('LambdaCodeUpdateNode.NodeRun Error !!!', error);
            ui.showErrorMessage('Update Lambda Code Error !!!', error);
        }
        finally {
            this.StopWorking();
        }
    }
}
exports.LambdaCodeUpdateNode = LambdaCodeUpdateNode;
//# sourceMappingURL=LambdaCodeUpdateNode.js.map