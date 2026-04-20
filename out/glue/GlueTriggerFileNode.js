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
exports.GlueTriggerFileNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const GlueJobNode_1 = require("./GlueJobNode");
const ui = __importStar(require("../common/UI"));
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const GlueJobRunView_1 = require("./GlueJobRunView");
class GlueTriggerFileNode extends NodeBase_1.NodeBase {
    FileId;
    FilePath;
    constructor(filePath, parent, fileId) {
        super(path.basename(filePath), parent);
        this.Icon = "file";
        this.FilePath = filePath;
        this.FileId = fileId || Date.now().toString();
        this.description = filePath;
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
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
        ui.logToOutput('GlueTriggerFileNode.handleNodeRun Started');
        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }
        // Open webview with this trigger file
        GlueJobRunView_1.GlueJobRunView.Render(job.Region, job.JobName, this.FilePath);
    }
    async handleNodeOpen() {
        // Open the file in editor
        try {
            const document = await vscode.workspace.openTextDocument(this.FilePath);
            await vscode.window.showTextDocument(document);
        }
        catch (error) {
            ui.logToOutput('GlueTriggerFileNode.handleNodeOpen Error !!!', error);
            ui.showErrorMessage('Failed to open file', error);
        }
    }
    handleNodeRemove() {
        const job = this.getParentJob();
        if (job) {
            // Remove from job's trigger files
            job.TriggerFiles = job.TriggerFiles.filter(tf => tf.id !== this.FileId);
        }
        this.Remove();
        this.TreeSave();
    }
}
exports.GlueTriggerFileNode = GlueTriggerFileNode;
//# sourceMappingURL=GlueTriggerFileNode.js.map