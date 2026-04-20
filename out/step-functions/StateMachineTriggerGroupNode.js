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
exports.StateMachineTriggerGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
const fs = __importStar(require("fs"));
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
            this.TreeSave();
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