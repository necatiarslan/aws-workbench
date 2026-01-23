"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaCodeDownloadNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
class LambdaCodeDownloadNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "cloud-download";
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
        //TODO: Implement download logic here
    }
    NodeStop() {
    }
    NodeOpen() {
    }
    NodeInfo() {
    }
}
exports.LambdaCodeDownloadNode = LambdaCodeDownloadNode;
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaCodeDownloadNode', LambdaCodeDownloadNode);
//# sourceMappingURL=LambdaCodeDownloadNode%20copy.js.map