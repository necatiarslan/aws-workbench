"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineDefinitionUpdateNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const fs = require("fs");
const ui = require("../common/UI");
const api = require("./API");
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