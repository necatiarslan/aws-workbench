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
exports.GlueCodeCompareNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const GlueJobNode_1 = require("./GlueJobNode");
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
class GlueCodeCompareNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "diff";
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
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
        ui.logToOutput('GlueCodeCompareNode.handleNodeRun Started');
        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }
        if (!job.CodePath) {
            ui.showWarningMessage('No local code file selected. Please select a file first.');
            return;
        }
        if (!fs.existsSync(job.CodePath)) {
            ui.showWarningMessage('Local code file not found: ' + job.CodePath);
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            // Get job config to find script location
            const config = await job.JobConfig;
            if (!config || !config.Command?.ScriptLocation) {
                ui.showWarningMessage('Script location not found in job configuration');
                this.StopWorking();
                return;
            }
            const s3Uri = config.Command.ScriptLocation;
            const parsed = api.ParseS3Uri(s3Uri);
            if (!parsed) {
                ui.showErrorMessage('Invalid S3 URI: ' + s3Uri, new Error('Invalid S3 URI'));
                this.StopWorking();
                return;
            }
            // Download from S3 to temp file
            const result = await api.DownloadS3Object(job.Region, parsed.bucket, parsed.key);
            if (!result.isSuccessful || !result.result) {
                ui.showErrorMessage('Failed to download code from S3', result.error);
                this.StopWorking();
                return;
            }
            // Create temp file for S3 content
            const tempDir = os.tmpdir();
            const s3FileName = `s3_${path.basename(parsed.key)}`;
            const tempFilePath = path.join(tempDir, s3FileName);
            fs.writeFileSync(tempFilePath, result.result);
            // Open diff view
            const localUri = vscode.Uri.file(job.CodePath);
            const s3Uri_temp = vscode.Uri.file(tempFilePath);
            await vscode.commands.executeCommand('vscode.diff', s3Uri_temp, localUri, `S3: ${path.basename(parsed.key)} ↔ Local: ${path.basename(job.CodePath)}`);
            ui.logToOutput('GlueCodeCompareNode: Diff view opened');
        }
        catch (error) {
            ui.logToOutput('GlueCodeCompareNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Compare failed', error);
        }
        finally {
            this.StopWorking();
        }
    }
}
exports.GlueCodeCompareNode = GlueCodeCompareNode;
//# sourceMappingURL=GlueCodeCompareNode.js.map