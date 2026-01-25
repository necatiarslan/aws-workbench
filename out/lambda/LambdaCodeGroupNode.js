"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaCodeGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
class LambdaCodeGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "code";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.SetContextValue();
    }
}
exports.LambdaCodeGroupNode = LambdaCodeGroupNode;
//# sourceMappingURL=LambdaCodeGroupNode.js.map