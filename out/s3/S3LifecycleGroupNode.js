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
exports.S3LifecycleGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const S3BucketNode_1 = require("./S3BucketNode");
const S3ConfigPropertyNode_1 = require("./S3ConfigPropertyNode");
class S3LifecycleGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = 'archive';
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeLoadChildren());
        this.OnNodeRefresh.subscribe(() => this.handleNodeLoadChildren());
        this.SetContextValue();
    }
    GetBucketNode() {
        if (this.Parent instanceof S3BucketNode_1.S3BucketNode) {
            return this.Parent;
        }
        return undefined;
    }
    async handleNodeLoadChildren() {
        ui.logToOutput('S3LifecycleGroupNode.handleNodeLoadChildren Started');
        const bucketNode = this.GetBucketNode();
        if (!bucketNode || !bucketNode.BucketName) {
            ui.logToOutput('S3LifecycleGroupNode - Parent S3BucketNode not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            const result = await api.GetBucketLifecycleConfiguration(bucketNode.BucketName);
            if (!result.isSuccessful) {
                ui.logToOutput('api.GetBucketLifecycleConfiguration Error !!!', result.error);
                this.StopWorking();
                return;
            }
            this.Children = [];
            const rules = result.result || [];
            if (rules.length === 0) {
                this.collapsibleState = vscode.TreeItemCollapsibleState.None;
                this.StopWorking();
                this.RefreshTree();
                return;
            }
            for (const rule of rules) {
                const ruleId = rule.ID || 'Unknown';
                const status = rule.Status || 'Unknown';
                const filterStr = rule.Filter ? JSON.stringify(rule.Filter).substring(0, 50) : 'N/A';
                new S3ConfigPropertyNode_1.S3ConfigPropertyNode(`Rule: ${ruleId}`, `Status: ${status}`, this);
                if (rule.Filter) {
                    new S3ConfigPropertyNode_1.S3ConfigPropertyNode(`  Filter`, filterStr, this);
                }
                if (rule.Expiration) {
                    const expStr = rule.Expiration.Days ? `${rule.Expiration.Days} days` :
                        rule.Expiration.ExpiredObjectDeleteMarker ? 'DeleteMarker' : 'N/A';
                    new S3ConfigPropertyNode_1.S3ConfigPropertyNode(`  Expiration`, expStr, this);
                }
                if (rule.Transitions && rule.Transitions.length > 0) {
                    const transStr = rule.Transitions.map((t) => `${t.StorageClass} at ${t.Days || t.Date || 'N/A'} days`).join(', ');
                    new S3ConfigPropertyNode_1.S3ConfigPropertyNode(`  Transitions`, transStr, this);
                }
            }
            if (this.Children.length > 0) {
                this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
            }
            this.StopWorking();
            this.RefreshTree();
        }
        catch (error) {
            ui.logToOutput('S3LifecycleGroupNode Error !!!', error);
            this.StopWorking();
        }
    }
}
exports.S3LifecycleGroupNode = S3LifecycleGroupNode;
//# sourceMappingURL=S3LifecycleGroupNode.js.map