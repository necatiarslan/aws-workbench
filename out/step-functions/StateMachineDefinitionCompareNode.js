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
exports.StateMachineDefinitionCompareNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ui = __importStar(require("../common/UI"));
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