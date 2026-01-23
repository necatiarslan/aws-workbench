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
exports.KeyValueNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
class KeyValueNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "circle-filled";
        this.Label = Label;
        this.EnableNodeRefresh = true;
        this.EnableNodeEdit = true;
        this.EnableNodeRemove = true;
        this.SetContextValue();
    }
    Label = "";
    Key = "";
    Value = "";
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
exports.KeyValueNode = KeyValueNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], KeyValueNode.prototype, "Label", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], KeyValueNode.prototype, "Key", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], KeyValueNode.prototype, "Value", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('KeyValueNode', KeyValueNode);
//# sourceMappingURL=KeyValueNode.js.map