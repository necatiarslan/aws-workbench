"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBKeyNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
class DynamoDBKeyNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "key";
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }
    KeyName = "";
    KeyType = "";
    KeyRole = ""; // HASH or RANGE
    handleNodeOpen() {
        // Copy key info to clipboard
        const info = `${this.KeyName} (${this.KeyType}) - ${this.KeyRole === 'HASH' ? 'Partition Key' : 'Sort Key'}`;
        vscode.env.clipboard.writeText(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }
}
exports.DynamoDBKeyNode = DynamoDBKeyNode;
//# sourceMappingURL=DynamoDBKeyNode.js.map