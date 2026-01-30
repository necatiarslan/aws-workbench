"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineExecutionNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const api = require("./API");
const StateMachineNode_1 = require("./StateMachineNode");
const StateMachineExecutionView_1 = require("./StateMachineExecutionView");
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
        StateMachineExecutionView_1.StateMachineExecutionView.Render(this.ExecutionArn, stateMachineNode.StateMachineArn || '', stateMachineNode.Region || '');
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