"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaTriggerGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
class LambdaTriggerGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "run-all";
        this.ShouldBeSaved = false;
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async NodeAdd() {
    }
    NodeRemove() {
    }
    NodeRefresh() {
    }
    NodeView() {
    }
    async NodeEdit() {
    }
    NodeRun() {
    }
    NodeStop() {
    }
    NodeOpen() {
    }
    NodeInfo() {
    }
}
exports.LambdaTriggerGroupNode = LambdaTriggerGroupNode;
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaTriggerGroupNode', LambdaTriggerGroupNode);
//# sourceMappingURL=LambdaTriggerGroupNode.js.map