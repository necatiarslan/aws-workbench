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
exports.StateMachineExecutionNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
const api = __importStar(require("./API"));
const StateMachineNode_1 = require("./StateMachineNode");
const StateMachineExecutionView_1 = require("./StateMachineExecutionView");
const StateMachinePinnedExecutionsGroupNode_1 = require("./StateMachinePinnedExecutionsGroupNode");
class StateMachineExecutionNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = 'pass';
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.OnNodeEdit.subscribe(() => this.handleNodeViewHistory());
        this.SetContextValue();
    }
    ExecutionArn = "";
    Status = "";
    StartDate = "";
    StopDate = "";
    handleNodeRemove() {
        // If inside a pinned group, also remove from the persisted list
        if (this.Parent instanceof StateMachinePinnedExecutionsGroupNode_1.StateMachinePinnedExecutionsGroupNode) {
            const stateMachineNode = this.GetStateMachineNode();
            if (stateMachineNode && this.ExecutionArn) {
                stateMachineNode.RemovePinnedExecution(this.ExecutionArn);
            }
        }
        this.Remove();
    }
    async handleNodeInfo() {
        ui.logToOutput('StateMachineExecutionNode.NodeInfo Started');
        if (!this.ExecutionArn) {
            ui.showWarningMessage('Execution ARN not available');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            // Get state machine node to find region
            const stateMachineNode = this.GetStateMachineNode();
            if (!stateMachineNode) {
                ui.showWarningMessage('State machine node not found');
                this.StopWorking();
                return;
            }
            const result = await api.GetExecutionDetails(stateMachineNode.Region, this.ExecutionArn);
            if (result.isSuccessful && result.result) {
                const jsonContent = JSON.stringify(result.result, null, 2);
                const document = await vscode.workspace.openTextDocument({
                    content: jsonContent,
                    language: 'json'
                });
                await vscode.window.showTextDocument(document);
            }
            else {
                ui.showWarningMessage('Failed to load execution details');
            }
        }
        catch (error) {
            ui.logToOutput('StateMachineExecutionNode.NodeInfo Error !!!', error);
            ui.showErrorMessage('Failed to open execution details', error);
        }
        this.StopWorking();
    }
    async handleNodeViewHistory() {
        ui.logToOutput('StateMachineExecutionNode.ViewHistory Started');
        if (!this.ExecutionArn) {
            ui.showWarningMessage('Execution ARN not available');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            const stateMachineNode = this.GetStateMachineNode();
            if (!stateMachineNode) {
                ui.showWarningMessage('State machine node not found');
                this.StopWorking();
                return;
            }
            const result = await api.GetExecutionHistory(stateMachineNode.Region, this.ExecutionArn);
            if (result.isSuccessful && result.result) {
                const jsonContent = JSON.stringify(result.result, null, 2);
                const document = await vscode.workspace.openTextDocument({
                    content: jsonContent,
                    language: 'json'
                });
                await vscode.window.showTextDocument(document);
            }
            else {
                ui.showWarningMessage('Failed to load execution history');
            }
        }
        catch (error) {
            ui.logToOutput('StateMachineExecutionNode.ViewHistory Error !!!', error);
            ui.showErrorMessage('Failed to open execution history', error);
        }
        this.StopWorking();
    }
    async handleNodeView() {
        ui.logToOutput('StateMachineExecutionNode.View Started');
        if (!this.ExecutionArn) {
            ui.showWarningMessage('Execution ARN not available');
            return;
        }
        const stateMachineNode = this.GetStateMachineNode();
        if (!stateMachineNode) {
            ui.showWarningMessage('State machine node not found');
            return;
        }
        StateMachineExecutionView_1.StateMachineExecutionView.Render(this.ExecutionArn, stateMachineNode.StateMachineArn || '', stateMachineNode.Region || '', stateMachineNode);
    }
    GetStateMachineNode() {
        let current = this.Parent;
        while (current) {
            if (current instanceof StateMachineNode_1.StateMachineNode) {
                return current;
            }
            current = current.Parent;
        }
        return undefined;
    }
}
exports.StateMachineExecutionNode = StateMachineExecutionNode;
//# sourceMappingURL=StateMachineExecutionNode.js.map