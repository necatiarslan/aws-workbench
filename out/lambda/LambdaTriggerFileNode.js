"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaTriggerFileNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const TreeState_1 = require("../tree/TreeState");
class LambdaTriggerFileNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "run";
        this.ShouldBeSaved = false;
        this.EnableNodeRun = true;
        this.EnableNodeRemove = true;
        this.EnableNodeEdit = true;
        this.SetContextValue();
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
    }
    FilePath = "";
    async handleNodeRemove() {
        const lambdaNode = this.GetAwsResourceNode();
        lambdaNode.TriggerFiles = lambdaNode.TriggerFiles.filter(tf => tf.id !== this.id);
        this.Remove();
        TreeState_1.TreeState.save();
    }
    async handleNodeEdit() {
        if (this.FilePath) {
            const document = await vscode.workspace.openTextDocument(this.FilePath);
            await vscode.window.showTextDocument(document);
        }
    }
    async handleNodeRun() {
        const lambdaNode = this.GetAwsResourceNode();
        if (lambdaNode && this.FilePath) {
            // Store the trigger file path and invoke the parent node's run
            await lambdaNode.NodeRun();
        }
    }
}
exports.LambdaTriggerFileNode = LambdaTriggerFileNode;
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaTriggerFileNode', LambdaTriggerFileNode);
//# sourceMappingURL=LambdaTriggerFileNode.js.map