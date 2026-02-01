"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3ConfigPropertyNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
class S3ConfigPropertyNode extends NodeBase_1.NodeBase {
    constructor(label, value, parent) {
        super(label, parent);
        this.Icon = 'circle-outline';
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.description = value;
        this.Value = value;
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        this.SetContextValue();
    }
    Value = "";
    handleNodeInfo() {
        ui.logToOutput(`S3ConfigPropertyNode Info: ${this.label} = ${this.Value}`);
        ui.showInfoMessage(`${this.label}: ${this.Value}`);
    }
}
exports.S3ConfigPropertyNode = S3ConfigPropertyNode;
//# sourceMappingURL=S3ConfigPropertyNode.js.map