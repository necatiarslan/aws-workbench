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
exports.StateMachineDefinitionDownloadNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const ui = __importStar(require("../common/UI"));
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
                    this.TreeSave();
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