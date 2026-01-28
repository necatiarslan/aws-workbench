"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineDefinitionCompareNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const ui = require("../common/UI");
class StateMachineDefinitionCompareNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "diff";
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.SetContextValue();
    }
    async handleNodeRun() {
        const stateMachineNode = this.GetAwsResourceNode();
        if (!stateMachineNode || !stateMachineNode.CodePath) {
            ui.showWarningMessage('Please download definition first');
            return;
        }
        if (!fs.existsSync(stateMachineNode.CodePath)) {
            ui.showWarningMessage('Local definition file not found');
            return;
        }
        this.StartWorking();
        try {
            const definition = await stateMachineNode.GetDefinition();
            if (definition && definition.definition) {
                const remoteDefString = typeof definition.definition === 'string'
                    ? definition.definition
                    : JSON.stringify(definition.definition, null, 2);
                const remoteDef = ui.isJsonString(remoteDefString)
                    ? JSON.stringify(JSON.parse(remoteDefString), null, 2)
                    : remoteDefString;
                // Create temp file for remote definition
                const tempPath = path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', '.aws-workbench-temp-remote.json');
                fs.writeFileSync(tempPath, remoteDef);
                // Open diff
                const localUri = vscode.Uri.file(stateMachineNode.CodePath);
                const remoteUri = vscode.Uri.file(tempPath);
                await vscode.commands.executeCommand('vscode.diff', localUri, remoteUri, `${stateMachineNode.StateMachineName} (Local ↔ Remote)`);
                // Clean up temp file after a delay
                setTimeout(() => {
                    if (fs.existsSync(tempPath)) {
                        fs.unlinkSync(tempPath);
                    }
                }, 30000);
            }
        }
        catch (error) {
            ui.logToOutput('StateMachineDefinitionCompareNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Failed to compare definitions', error);
        }
        this.StopWorking();
    }
}
exports.StateMachineDefinitionCompareNode = StateMachineDefinitionCompareNode;
//# sourceMappingURL=StateMachineDefinitionCompareNode.js.map