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
exports.GlueTriggerGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const GlueJobNode_1 = require("./GlueJobNode");
const GlueTriggerFileNode_1 = require("./GlueTriggerFileNode");
const ui = __importStar(require("../common/UI"));
const GlueJobRunView_1 = require("./GlueJobRunView");
class GlueTriggerGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "zap";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.SetContextValue();
    }
    getParentJob() {
        let current = this.Parent;
        while (current) {
            if (current instanceof GlueJobNode_1.GlueJobNode) {
                return current;
            }
            current = current.Parent;
        }
        return undefined;
    }
    async handleNodeRun() {
        // Trigger without payload - opens webview
        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }
        GlueJobRunView_1.GlueJobRunView.Render(job.Region, job.JobName);
    }
    async handleNodeAdd() {
        ui.logToOutput('GlueTriggerGroupNode.handleNodeAdd Started');
        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }
        // Let user select a JSON file
        const fileUris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select Trigger File (JSON)',
            filters: {
                'JSON files': ['json'],
                'All files': ['*']
            }
        });
        if (!fileUris || fileUris.length === 0) {
            return;
        }
        const filePath = fileUris[0].fsPath;
        const id = Date.now().toString();
        // Add to job's trigger files
        job.TriggerFiles.push({ id, path: filePath });
        // Create child node
        new GlueTriggerFileNode_1.GlueTriggerFileNode(filePath, this, id);
        this.TreeSave();
        ui.showInfoMessage(`Trigger file added: ${filePath}`);
    }
    LoadTriggerFiles() {
        const job = this.getParentJob();
        if (!job) {
            return;
        }
        for (const tf of job.TriggerFiles) {
            new GlueTriggerFileNode_1.GlueTriggerFileNode(tf.path, this, tf.id);
        }
    }
}
exports.GlueTriggerGroupNode = GlueTriggerGroupNode;
//# sourceMappingURL=GlueTriggerGroupNode.js.map