"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaCodeUploadNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
class LambdaCodeUploadNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "cloud-upload";
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
    async NodeEdit() {
    }
    NodeRun() {
        //TODO: Implement upload logic here
    }
    NodeStop() {
    }
    NodeOpen() {
    }
    NodeInfo() {
    }
}
exports.LambdaCodeUploadNode = LambdaCodeUploadNode;
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaCodeUploadNode', LambdaCodeUploadNode);
//# sourceMappingURL=LambdaCodeUploadNode.js.map