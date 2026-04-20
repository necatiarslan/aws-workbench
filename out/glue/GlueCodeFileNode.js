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
exports.GlueCodeFileNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const GlueJobNode_1 = require("./GlueJobNode");
const ui = __importStar(require("../common/UI"));
class GlueCodeFileNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "file-code";
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.OnNodeLoaded.subscribe(() => this.handleNodeLoaded());
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
    async handleNodeLoaded() {
        const glueJobNode = this.GetAwsResourceNode();
        if (glueJobNode && glueJobNode.CodePath) {
            this.label = glueJobNode.CodePath;
        }
    }
    async handleNodeOpen() {
        ui.logToOutput('GlueCodeFileNode.handleNodeOpen Started');
        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }
        const fileUris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select Code File',
            filters: {
                'Python files': ['py'],
                'Scala files': ['scala'],
                'All files': ['*']
            }
        });
        if (!fileUris || fileUris.length === 0) {
            return;
        }
        job.CodePath = fileUris[0].fsPath;
        this.description = job.CodePath;
        this.TreeSave();
        ui.showInfoMessage(`Code file set to: ${job.CodePath}`);
        ui.logToOutput(`GlueCodeFileNode: Code path set to ${job.CodePath}`);
    }
}
exports.GlueCodeFileNode = GlueCodeFileNode;
//# sourceMappingURL=GlueCodeFileNode.js.map