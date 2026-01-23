"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaCodeGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
class LambdaCodeGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "code";
        this.ShouldBeSaved = false;
        this.SetContextValue();
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
exports.LambdaCodeGroupNode = LambdaCodeGroupNode;
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaCodeGroupNode', LambdaCodeGroupNode);
//# sourceMappingURL=LambdaCodeGroupNode.js.map