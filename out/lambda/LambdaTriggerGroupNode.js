"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaTriggerGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const LambdaTriggerFileNode_1 = require("./LambdaTriggerFileNode");
const ui = require("../common/UI");
const TreeState_1 = require("../tree/TreeState");
class LambdaTriggerGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "run-all";
        this.ShouldBeSaved = false;
        this.EnableNodeAdd = true;
        this.EnableNodeRun = true;
        this.EnableNodeRefresh = true;
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async NodeAdd() {
        ui.logToOutput('LambdaTriggerGroupNode.NodeAdd Started');
        const lambdaNode = this.GetAwsResourceNode();
        const files = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: { 'JSON files': ['json'] }
        });
        if (files && files.length > 0) {
            const filePath = files[0].fsPath;
            const fileName = ui.getFileNameWithExtension(filePath);
            const node = new LambdaTriggerFileNode_1.LambdaTriggerFileNode(fileName, this);
            node.FilePath = filePath;
            lambdaNode.TriggerFiles.push({ id: node.id || '', path: filePath });
            TreeState_1.TreeState.save();
        }
    }
    NodeRemove() { }
    NodeRefresh() {
        ui.logToOutput('LambdaTriggerGroupNode.NodeRefresh Started');
        // Refresh children based on parent LambdaFunctionNode's TriggerFiles
        const lambdaNode = this.GetAwsResourceNode();
        this.Children = [];
        for (const triggerFile of lambdaNode.TriggerFiles) {
            const fileName = ui.getFileNameWithExtension(triggerFile.path);
            const node = new LambdaTriggerFileNode_1.LambdaTriggerFileNode(fileName, this);
            node.FilePath = triggerFile.path;
        }
    }
    NodeView() { }
    async NodeEdit() { }
    NodeRun() {
        this.GetAwsResourceNode()?.NodeRun();
    }
    NodeStop() { }
    NodeOpen() { }
    NodeInfo() { }
    NodeLoaded() { }
}
exports.LambdaTriggerGroupNode = LambdaTriggerGroupNode;
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaTriggerGroupNode', LambdaTriggerGroupNode);
//# sourceMappingURL=LambdaTriggerGroupNode.js.map