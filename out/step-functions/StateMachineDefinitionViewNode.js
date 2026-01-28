"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineDefinitionViewNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
class StateMachineDefinitionViewNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "eye";
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.SetContextValue();
    }
    async handleNodeRun() {
        const parent = this.Parent;
        const stateMachineNode = parent?.Parent;
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
                const document = await vscode.workspace.openTextDocument({
                    content: prettyDef,
                    language: 'json'
                });
                await vscode.window.showTextDocument(document);
            }
        }
        catch (error) {
            ui.logToOutput('StateMachineDefinitionViewNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Failed to view definition', error);
        }
        this.StopWorking();
    }
}
exports.StateMachineDefinitionViewNode = StateMachineDefinitionViewNode;
//# sourceMappingURL=StateMachineDefinitionViewNode.js.map