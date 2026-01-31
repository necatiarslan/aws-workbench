"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SNSInfoNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
class SNSInfoNode extends NodeBase_1.NodeBase {
    constructor(key, value, parent) {
        super(key, parent);
        this.Icon = "circle-outline";
        this.InfoKey = key;
        this.InfoValue = value;
        this.description = value;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.SetContextValue();
    }
    InfoKey;
    InfoValue;
    async handleNodeOpen() {
        // Copy value to clipboard
        await vscode.env.clipboard.writeText(this.InfoValue);
        ui.showInfoMessage(`Copied to clipboard: ${this.InfoValue}`);
    }
}
exports.SNSInfoNode = SNSInfoNode;
//# sourceMappingURL=SNSInfoNode.js.map