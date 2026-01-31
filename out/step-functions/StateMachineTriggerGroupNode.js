"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineTriggerGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const fs = require("fs");
const TreeState_1 = require("../tree/TreeState");
const StateMachineTriggerFileNode_1 = require("./StateMachineTriggerFileNode");
class StateMachineTriggerGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "play";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
    }
    handleNodeRefresh() {
        ui.logToOutput('StateMachineTriggerGroupNode.NodeRefresh Started');
        // Refresh children based on parent StateMachineNode's PayloadFiles
        const stateMachine = this.GetAwsResourceNode();
        this.Children = [];
        for (const triggerFile of stateMachine.PayloadFiles) {
            const fileName = ui.getFileNameWithExtension(triggerFile.path);
            const node = new StateMachineTriggerFileNode_1.StateMachineTriggerFileNode(fileName, this);
            node.FilePath = triggerFile.path;
        }
    }
    async handleNodeRun() {
        const stateMachine = this.Parent;
        if (!stateMachine)
            return;
        stateMachine.Trigger(undefined, this);
    }
    async handleNodeAdd() {
        const stateMachineNode = this.GetAwsResourceNode();
        if (!stateMachineNode)
            return;
        const fileUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: { 'JSON': ['json'] }
        });
        if (!fileUri || fileUri.length === 0)
            return;
        try {
            const filePath = fileUri[0].fsPath;
            const fileName = ui.getFileNameWithExtension(filePath);
            const content = fs.readFileSync(filePath, 'utf-8');
            if (!ui.isJsonString(content)) {
                ui.showErrorMessage('Invalid JSON file', new Error('File must contain valid JSON'));
                return;
            }
            const newNode = new StateMachineTriggerFileNode_1.StateMachineTriggerFileNode(fileName, this);
            newNode.FilePath = filePath;
            const payloadEntry = {
                id: newNode.id || '',
                path: filePath
            };
            stateMachineNode.PayloadFiles.push(payloadEntry);
            TreeState_1.TreeState.save();
            this.RefreshTree(stateMachineNode);
        }
        catch (error) {
            ui.logToOutput('Failed to add payload file', error);
            ui.showErrorMessage('Failed to add payload file', error);
        }
    }
}
exports.StateMachineTriggerGroupNode = StateMachineTriggerGroupNode;
//# sourceMappingURL=StateMachineTriggerGroupNode.js.map