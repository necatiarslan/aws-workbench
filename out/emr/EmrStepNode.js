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
exports.EmrStepNode = void 0;
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
const NodeBase_1 = require("../tree/NodeBase");
const S3Explorer_1 = require("../s3/S3Explorer");
class EmrStepNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "circle-outline";
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.OnNodeCopy.subscribe(() => this.handleNodeCopy());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.SetContextValue();
    }
    StepId = "";
    Status = "";
    LogUri = "";
    async handleNodeCopy() {
        ui.CopyToClipboard(`${this.label} ${this.StepId}`);
        ui.showInfoMessage("Step details copied to clipboard");
    }
    async handleNodeView() {
        if (this.LogUri) {
            const bucket = this.LogUri.split("/")[2];
            const key = this.LogUri.split("/").slice(3).join("/");
            S3Explorer_1.S3Explorer.Open(bucket, key);
        }
        else {
            ui.showInfoMessage("No LogUri available for this step");
        }
    }
}
exports.EmrStepNode = EmrStepNode;
//# sourceMappingURL=EmrStepNode.js.map