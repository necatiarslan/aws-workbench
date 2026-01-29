"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueCodeGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
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