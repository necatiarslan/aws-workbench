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
exports.EmrClusterNode = void 0;
const vscode = __importStar(require("vscode"));
const NodeBase_1 = require("../tree/NodeBase");
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const EmrBootstrapActionsGroupNode_1 = require("./EmrBootstrapActionsGroupNode");
const EmrInfoGroupNode_1 = require("./EmrInfoGroupNode");
const EmrStepsGroupNode_1 = require("./EmrStepsGroupNode");
const EmrTagsGroupNode_1 = require("./EmrTagsGroupNode");
class EmrClusterNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.DefaultIcon = "server";
        this.DefaultIconColor = "charts.green";
        this.SetIcon();
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.LoadDefaultChildren();
        this.SetContextValue();
    }
    Region = "";
    ClusterId = "";
    ClusterName = "";
    ClusterState = "";
    ClusterCreatedAt = "";
    _clusterConfig = undefined;
    get ClusterConfig() {
        return this.getClusterConfig();
    }
    async getClusterConfig() {
        if (!this._clusterConfig && this.Region && this.ClusterId) {
            const result = await api.GetEmrCluster(this.Region, this.ClusterId);
            if (result.isSuccessful) {
                this._clusterConfig = result.result;
            }
            else {
                ui.logToOutput("api.GetEmrCluster Error !!!", result.error);
                ui.showErrorMessage("Get EMR Cluster Error !!!", result.error);
            }
        }
        return this._clusterConfig;
    }
    async LoadDefaultChildren() {
        new EmrInfoGroupNode_1.EmrInfoGroupNode("Info", this);
        new EmrStepsGroupNode_1.EmrStepsGroupNode("Steps", this);
        new EmrTagsGroupNode_1.EmrTagsGroupNode("Tags", this);
        new EmrBootstrapActionsGroupNode_1.EmrBootstrapActionsGroupNode("Bootstrap Actions", this);
    }
    async handleNodeRefresh() {
        this._clusterConfig = undefined;
        for (const child of this.Children) {
            child.IsOnNodeLoadChildrenCalled = false;
            child.Children = [];
        }
        this.RefreshTree(this);
    }
    async handleNodeInfo() {
        if (!this.ClusterId || !this.Region) {
            ui.showWarningMessage("EMR cluster id or region is not set.");
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            const config = await this.ClusterConfig;
            if (!config) {
                ui.showWarningMessage("Failed to load EMR cluster configuration");
                return;
            }
            const jsonContent = JSON.stringify(config, null, 2);
            const document = await vscode.workspace.openTextDocument({
                content: jsonContent,
                language: "json",
            });
            await vscode.window.showTextDocument(document);
        }
        catch (error) {
            ui.logToOutput("EmrClusterNode.handleNodeInfo Error !!!", error);
            ui.showErrorMessage("Failed to open EMR cluster configuration", error);
        }
        finally {
            this.StopWorking();
        }
    }
}
exports.EmrClusterNode = EmrClusterNode;
//# sourceMappingURL=EmrClusterNode.js.map