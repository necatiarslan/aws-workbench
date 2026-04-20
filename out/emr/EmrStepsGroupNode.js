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
exports.EmrStepsGroupNode = void 0;
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
const NodeBase_1 = require("../tree/NodeBase");
const api = __importStar(require("./API"));
const EmrStepNode_1 = require("./EmrStepNode");
class EmrStepsGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "symbol-number";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        this.OnNodeRefresh.subscribe(() => this.handleLoadChildren());
        this.SetContextValue();
    }
    async handleLoadChildren() {
        const clusterNode = this.Parent;
        if (!clusterNode || !clusterNode.Region || !clusterNode.ClusterId) {
            return;
        }
        this.StartWorking();
        this.Children = [];
        try {
            const result = await api.GetEmrClusterSteps(clusterNode.Region, clusterNode.ClusterId);
            if (!result.isSuccessful) {
                return;
            }
            for (const step of result.result) {
                const stepName = step.Name ?? "UnnamedStep";
                const stepId = step.Id ?? "UnknownId";
                const status = step.Status?.State ?? "UNKNOWN";
                const label = `${stepName} (${stepId}-${status})`;
                const description = `${status}`;
                let stepNode = new EmrStepNode_1.EmrStepNode(label, this);
                stepNode.StepId = stepId;
                stepNode.Status = status;
                stepNode.LogUri = step.LogUri ?? "";
            }
            this.description = `${result.result.length}`;
        }
        catch (error) {
            ui.logToOutput("EmrStepsGroupNode.handleLoadChildren Error !!!", error);
            ui.showErrorMessage("Failed to load EMR steps", error);
        }
        finally {
            this.StopWorking();
        }
    }
}
exports.EmrStepsGroupNode = EmrStepsGroupNode;
//# sourceMappingURL=EmrStepsGroupNode.js.map