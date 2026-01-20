"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3KeyNode = void 0;
const NodeBase_1 = require("../../tree/NodeBase");
const Serialize_1 = require("../../common/serialization/Serialize");
const NodeRegistry_1 = require("../../common/serialization/NodeRegistry");
const TreeState_1 = require("../../tree/TreeState");
class S3KeyNode extends NodeBase_1.NodeBase {
    constructor(BucketName, Key, parent) {
        super(BucketName, parent);
        this.Icon = Key.endsWith("/") ? "folder" : "file";
        this.BucketName = BucketName;
        this.Key = Key;
        this.EnableNodeRemove = true;
        this.EnableNodeView = true;
        this.SetContextValue();
    }
    BucketName = "";
    Arn = "";
    Key = "";
    async NodeAdd() {
    }
    NodeRemove() {
        this.Remove();
        TreeState_1.TreeState.save();
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
exports.S3KeyNode = S3KeyNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], S3KeyNode.prototype, "BucketName", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], S3KeyNode.prototype, "Arn", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], S3KeyNode.prototype, "Key", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('S3KeyNode', S3KeyNode);
//# sourceMappingURL=S3KeyNode.js.map