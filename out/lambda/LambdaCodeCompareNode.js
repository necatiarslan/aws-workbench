"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaCodeCompareNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
class LambdaCodeCompareNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "diff";
        this.ShouldBeSaved = false;
        this.EnableNodeRun = true;
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
    NodeEdit() {
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
exports.LambdaCodeCompareNode = LambdaCodeCompareNode;
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaCodeCompareNode', LambdaCodeCompareNode);
//# sourceMappingURL=LambdaCodeCompareNode.js.map