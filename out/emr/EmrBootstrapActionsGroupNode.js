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
exports.EmrBootstrapActionsGroupNode = void 0;
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
const NodeBase_1 = require("../tree/NodeBase");
const api = __importStar(require("./API"));
const EmrBootstrapActionNode_1 = require("./EmrBootstrapActionNode");
class EmrBootstrapActionsGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "tools";
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
            const result = await api.GetEmrClusterBootstrapActions(clusterNode.Region, clusterNode.ClusterId);
            if (!result.isSuccessful) {
                return;
            }
            for (const action of result.result) {
                const actionName = action.Name ?? "UnnamedAction";
                const path = action.ScriptPath ?? "N/A";
                const args = action.Args?.join(" ") ?? "";
                const description = args.length > 0 ? `${path} ${args}` : path;
                new EmrBootstrapActionNode_1.EmrBootstrapActionNode(actionName, description, this);
            }
            this.description = `${result.result.length}`;
        }
        catch (error) {
            ui.logToOutput("EmrBootstrapActionsGroupNode.handleLoadChildren Error !!!", error);
            ui.showErrorMessage("Failed to load EMR bootstrap actions", error);
        }
        finally {
            this.StopWorking();
        }
    }
}
exports.EmrBootstrapActionsGroupNode = EmrBootstrapActionsGroupNode;
//# sourceMappingURL=EmrBootstrapActionsGroupNode.js.map