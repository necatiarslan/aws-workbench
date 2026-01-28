"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaCodeUpdateNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
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