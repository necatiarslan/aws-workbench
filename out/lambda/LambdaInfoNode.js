"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaInfoNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
class LambdaInfoNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "info";
        this.SetContextValue();
    }
    Key = "";
    Value = "";
}
exports.LambdaInfoNode = LambdaInfoNode;
//# sourceMappingURL=LambdaInfoNode.js.map