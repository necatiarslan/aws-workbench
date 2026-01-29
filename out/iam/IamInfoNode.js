"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamInfoNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
class IamInfoNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "symbol-property";
        this.SetContextValue();
    }
    Key = "";
    Value = "";
}
exports.IamInfoNode = IamInfoNode;
//# sourceMappingURL=IamInfoNode.js.map