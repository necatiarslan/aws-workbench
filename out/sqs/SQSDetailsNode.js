"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSDetailsNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
class SQSDetailsNode extends NodeBase_1.NodeBase {
    Key = "";
    Value = "";
    constructor(key, value, parent) {
        super(`${key}: ${value}`, parent);
        this.Icon = "circle-outline";
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.Key = key;
        this.Value = value;
        this.SetContextValue();
    }
}
exports.SQSDetailsNode = SQSDetailsNode;
//# sourceMappingURL=SQSDetailsNode.js.map