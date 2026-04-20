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
exports.GlueRunNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
class GlueRunNode extends NodeBase_1.NodeBase {
    RunId;
    RunStatus;
    JobRun;
    constructor(jobRun, parent) {
        const runId = jobRun.Id || 'unknown';
        const status = jobRun.JobRunState || 'UNKNOWN';
        const startTime = jobRun.StartedOn ? jobRun.StartedOn.toLocaleString() : '';
        super(`${runId.substring(0, 10)}...`, parent);
        this.RunId = runId;
        this.RunStatus = status;
        this.JobRun = jobRun;
        // Set icon based on status
        this.setIconForStatus(status);
        // Build description with status and time
        const duration = this.calculateDuration(jobRun);
        this.description = `${status} - ${startTime}${duration ? ` (${duration})` : ''}`;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        this.SetContextValue();
    }
    setIconForStatus(status) {
        switch (status) {
            case 'SUCCEEDED':
                this.Icon = "pass";
                break;
            case 'FAILED':
                this.Icon = "error";
                break;
            case 'RUNNING':
                this.Icon = "sync~spin";
                break;
            case 'STOPPED':
            case 'STOPPING':
                this.Icon = "debug-stop";
                break;
            case 'TIMEOUT':
                this.Icon = "clock";
                break;
            case 'STARTING':
            case 'WAITING':
                this.Icon = "loading~spin";
                break;
            default:
                this.Icon = "circle-outline";
        }
    }
    calculateDuration(jobRun) {
        if (jobRun.ExecutionTime) {
            return `${jobRun.ExecutionTime}s`;
        }
        if (jobRun.StartedOn) {
            const endTime = jobRun.CompletedOn || new Date();
            const durationMs = endTime.getTime() - jobRun.StartedOn.getTime();
            const durationSec = Math.round(durationMs / 1000);
            return `${durationSec}s`;
        }
        return '';
    }
    async handleNodeInfo() {
        ui.logToOutput('GlueRunNode.handleNodeInfo Started');
        try {
            const jsonContent = JSON.stringify(this.JobRun, null, 2);
            const document = await vscode.workspace.openTextDocument({
                content: jsonContent,
                language: 'json'
            });
            await vscode.window.showTextDocument(document);
        }
        catch (error) {
            ui.logToOutput('GlueRunNode.handleNodeInfo Error !!!', error);
            ui.showErrorMessage('Failed to show run details', error);
        }
    }
}
exports.GlueRunNode = GlueRunNode;
//# sourceMappingURL=GlueRunNode.js.map