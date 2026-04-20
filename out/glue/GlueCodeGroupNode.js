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
exports.GlueCodeGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const GlueCodeFileNode_1 = require("./GlueCodeFileNode");
const GlueCodeDownloadNode_1 = require("./GlueCodeDownloadNode");
const GlueCodeUpdateNode_1 = require("./GlueCodeUpdateNode");
const GlueCodeCompareNode_1 = require("./GlueCodeCompareNode");
class GlueCodeGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "code";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        // Create child nodes
        new GlueCodeFileNode_1.GlueCodeFileNode("Select File", this);
        new GlueCodeDownloadNode_1.GlueCodeDownloadNode("Download", this);
        new GlueCodeUpdateNode_1.GlueCodeUpdateNode("Update", this);
        new GlueCodeCompareNode_1.GlueCodeCompareNode("Compare", this);
        this.SetContextValue();
    }
}
exports.GlueCodeGroupNode = GlueCodeGroupNode;
//# sourceMappingURL=GlueCodeGroupNode.js.map