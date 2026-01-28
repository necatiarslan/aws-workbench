"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineDefinitionDownloadNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const fs = require("fs");
const ui = require("../common/UI");
const TreeState_1 = require("../tree/TreeState");
class StateMachineDefinitionDownloadNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "cloud-download";
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.SetContextValue();
    }
    async handleNodeRun() {
        const stateMachineNode = this.GetAwsResourceNode();
        if (!stateMachineNode)
            return;
        this.StartWorking();
        try {
            const definition = await stateMachineNode.GetDefinition();
            if (definition && definition.definition) {
                const defString = typeof definition.definition === 'string'
                    ? definition.definition
                    : JSON.stringify(definition.definition, null, 2);
                const prettyDef = ui.isJsonString(defString)
                    ? JSON.stringify(JSON.parse(defString), null, 2)
                    : defString;
                const uri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file(`${stateMachineNode.StateMachineName}.asl.json`),
                    filters: { 'JSON': ['json'] }
                });
                if (uri) {
                    fs.writeFileSync(uri.fsPath, prettyDef);
                    stateMachineNode.CodePath = uri.fsPath;
                    TreeState_1.TreeState.save();
                    ui.showInfoMessage('Definition downloaded successfully');
                    const openFile = await vscode.window.showQuickPick(['Yes', 'No'], {
                        placeHolder: 'Open downloaded file?'
                    });
                    if (openFile === 'Yes') {
                        ui.openFile(uri.fsPath);
                    }
                }
            }
        }
        catch (error) {
            ui.logToOutput('StateMachineDefinitionDownloadNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Failed to download definition', error);
        }
        this.StopWorking();
    }
}
exports.StateMachineDefinitionDownloadNode = StateMachineDefinitionDownloadNode;
//# sourceMappingURL=StateMachineDefinitionDownloadNode.js.map