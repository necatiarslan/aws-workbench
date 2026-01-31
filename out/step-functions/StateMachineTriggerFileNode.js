"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineTriggerFileNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
class StateMachineTriggerFileNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "run";
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.SetContextValue();
    }
    FilePath = "";
    async handleNodeRemove() {
        const stateMachineNode = this.GetAwsResourceNode();
        if (!stateMachineNode)
            return;
        stateMachineNode.PayloadFiles = stateMachineNode.PayloadFiles.filter(tf => tf.id !== this.id);
        this.Remove();
        this.TreeSave();
    }
    async handleNodeEdit() {
        if (this.FilePath) {
            const document = await vscode.workspace.openTextDocument(this.FilePath);
            await vscode.window.showTextDocument(document);
        }
    }
    async handleNodeRun() {
        const stateMachineNode = this.GetAwsResourceNode();
        if (stateMachineNode && this.FilePath) {
            // Store the trigger file path and invoke the parent node's run
            await stateMachineNode.Trigger(this.FilePath, this);
        }
    }
}
exports.StateMachineTriggerFileNode = StateMachineTriggerFileNode;
//# sourceMappingURL=StateMachineTriggerFileNode.js.map