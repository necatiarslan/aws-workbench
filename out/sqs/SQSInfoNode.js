"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSInfoNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
class SQSInfoNode extends NodeBase_1.NodeBase {
    InfoKey;
    InfoValue;
    constructor(key, value, parent) {
        super(key, parent);
        this.Icon = "circle-outline";
        this.InfoKey = key;
        this.InfoValue = value;
        this.description = value;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.OnNodeCopy.subscribe(() => this.handleNodeCopy());
        this.SetContextValue();
    }
    async handleNodeCopy() {
        // Copy value to clipboard
        ui.CopyToClipboard(this.InfoValue);
        ui.showInfoMessage(`Copied to clipboard: ${this.InfoValue}`);
    }
}
exports.SQSInfoNode = SQSInfoNode;
//# sourceMappingURL=SQSInfoNode.js.map