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
        this.EnableNodeAdd = true;
        this.EnableNodeRun = true;
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async NodeAdd() {
    }
    NodeRemove() { }
    NodeRefresh() { }
    NodeView() { }
    async NodeEdit() { }
    NodeRun() {
        this.GetAwsResourceNode()?.NodeRun();
    }
    NodeStop() { }
    NodeOpen() { }
    NodeInfo() { }
    NodeLoaded() { }
}
exports.LambdaTriggerGroupNode = LambdaTriggerGroupNode;
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaTriggerGroupNode', LambdaTriggerGroupNode);
//# sourceMappingURL=LambdaTriggerGroupNode%20copy.js.map