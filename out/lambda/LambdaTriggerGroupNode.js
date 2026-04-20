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
exports.LambdaTriggerGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const LambdaTriggerFileNode_1 = require("./LambdaTriggerFileNode");
const ui = __importStar(require("../common/UI"));
class LambdaTriggerGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "run-all";
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeAdd() {
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
            this.TreeSave();
        }
    }
    handleNodeRefresh() {
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
    handleNodeRun() {
        this.GetAwsResourceNode()?.NodeRun();
    }
}
exports.LambdaTriggerGroupNode = LambdaTriggerGroupNode;
//# sourceMappingURL=LambdaTriggerGroupNode.js.map