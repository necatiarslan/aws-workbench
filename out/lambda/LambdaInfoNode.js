"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaInfoNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
class LambdaInfoNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "info";
        this.ShouldBeSaved = false;
        this.SetContextValue();
    }
    Key = "";
    Value = "";
}
exports.LambdaInfoNode = LambdaInfoNode;
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaInfoNode', LambdaInfoNode);
//# sourceMappingURL=LambdaInfoNode.js.map