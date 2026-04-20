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
exports.GlueInfoGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const GlueJobNode_1 = require("./GlueJobNode");
const GlueInfoNode_1 = require("./GlueInfoNode");
const ui = __importStar(require("../common/UI"));
class GlueInfoGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "info";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
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
    async handleLoadChildren() {
        ui.logToOutput('GlueInfoGroupNode.handleLoadChildren Started');
        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }
        // Clear existing children
        this.Children.length = 0;
        this.StartWorking();
        try {
            const config = await job.JobConfig;
            if (!config) {
                ui.showWarningMessage('Failed to load job configuration');
                this.StopWorking();
                return;
            }
            // Create info nodes for key properties
            if (config.Name) {
                new GlueInfoNode_1.GlueInfoNode("Name", config.Name, this);
            }
            if (config.Role) {
                new GlueInfoNode_1.GlueInfoNode("Role", config.Role, this);
            }
            if (config.Command?.Name) {
                new GlueInfoNode_1.GlueInfoNode("Type", config.Command.Name, this);
            }
            if (config.Command?.PythonVersion) {
                new GlueInfoNode_1.GlueInfoNode("Python Version", config.Command.PythonVersion, this);
            }
            if (config.GlueVersion) {
                new GlueInfoNode_1.GlueInfoNode("Glue Version", config.GlueVersion, this);
            }
            if (config.MaxRetries !== undefined) {
                new GlueInfoNode_1.GlueInfoNode("Max Retries", String(config.MaxRetries), this);
            }
            if (config.Timeout !== undefined) {
                new GlueInfoNode_1.GlueInfoNode("Timeout (min)", String(config.Timeout), this);
            }
            if (config.MaxCapacity !== undefined) {
                new GlueInfoNode_1.GlueInfoNode("Max Capacity", String(config.MaxCapacity), this);
            }
            if (config.NumberOfWorkers !== undefined) {
                new GlueInfoNode_1.GlueInfoNode("Workers", String(config.NumberOfWorkers), this);
            }
            if (config.WorkerType) {
                new GlueInfoNode_1.GlueInfoNode("Worker Type", config.WorkerType, this);
            }
            if (config.Command?.ScriptLocation) {
                new GlueInfoNode_1.GlueInfoNode("Script Location", config.Command.ScriptLocation, this);
            }
            if (config.CreatedOn) {
                new GlueInfoNode_1.GlueInfoNode("Created", config.CreatedOn.toISOString(), this);
            }
            if (config.LastModifiedOn) {
                new GlueInfoNode_1.GlueInfoNode("Last Modified", config.LastModifiedOn.toISOString(), this);
            }
        }
        catch (error) {
            ui.logToOutput('GlueInfoGroupNode.handleLoadChildren Error !!!', error);
            ui.showErrorMessage('Failed to load job info', error);
        }
        finally {
            this.StopWorking();
        }
    }
}
exports.GlueInfoGroupNode = GlueInfoGroupNode;
//# sourceMappingURL=GlueInfoGroupNode.js.map