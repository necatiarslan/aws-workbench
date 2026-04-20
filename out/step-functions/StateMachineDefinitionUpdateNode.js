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
exports.StateMachineDefinitionUpdateNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const ui = __importStar(require("../common/UI"));
const api = __importStar(require("./API"));
class StateMachineDefinitionUpdateNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "cloud-upload";
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
        const confirm = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Update state machine definition from local file?'
        });
        if (confirm !== 'Yes')
            return;
        this.StartWorking();
        try {
            if (!stateMachineNode.StateMachineArn) {
                ui.showWarningMessage('State machine ARN not available');
                this.StopWorking();
                return;
            }
            const localContent = fs.readFileSync(stateMachineNode.CodePath, 'utf-8');
            if (!ui.isJsonString(localContent)) {
                ui.showWarningMessage('Local file is not valid JSON');
                this.StopWorking();
                return;
            }
            const result = await api.UpdateStateMachineDefinition(stateMachineNode.Region, stateMachineNode.StateMachineArn, localContent);
            if (result.isSuccessful) {
                ui.showInfoMessage('State machine definition updated successfully');
                // Clear cached definition
                stateMachineNode._definition = undefined;
            }
        }
        catch (error) {
            ui.logToOutput('StateMachineDefinitionUpdateNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Failed to update definition', error);
        }
        this.StopWorking();
    }
}
exports.StateMachineDefinitionUpdateNode = StateMachineDefinitionUpdateNode;
//# sourceMappingURL=StateMachineDefinitionUpdateNode.js.map