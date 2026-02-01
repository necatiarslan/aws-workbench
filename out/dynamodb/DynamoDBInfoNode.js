"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBInfoNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
class DynamoDBInfoNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "circle-outline";
        this.OnNodeCopy.subscribe(() => this.handleNodeCopy());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }
    InfoKey = "";
    InfoValue = "";
    handleNodeCopy() {
        ui.CopyToClipboard(this.InfoValue);
        ui.showInfoMessage(`Copied to clipboard: ${this.InfoValue}`);
    }
}
exports.DynamoDBInfoNode = DynamoDBInfoNode;
//# sourceMappingURL=DynamoDBInfoNode.js.map