"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBTagNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
class DynamoDBTagNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "tag";
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }
    TagKey = "";
    TagValue = "";
    handleNodeOpen() {
        const info = `${this.TagKey}: ${this.TagValue}`;
        vscode.env.clipboard.writeText(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }
}
exports.DynamoDBTagNode = DynamoDBTagNode;
//# sourceMappingURL=DynamoDBTagNode.js.map