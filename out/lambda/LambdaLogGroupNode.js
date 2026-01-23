"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaLogGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
class LambdaLogGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "list-unordered";
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
exports.LambdaLogGroupNode = LambdaLogGroupNode;
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaLogGroupNode', LambdaLogGroupNode);
//# sourceMappingURL=LambdaLogGroupNode.js.map