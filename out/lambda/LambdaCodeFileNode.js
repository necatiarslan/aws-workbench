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
exports.LambdaCodeFileNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
class LambdaCodeFileNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "file-code";
        this.Label = Label;
        //this.ShouldBeSaved = false;
        this.EnableNodeAdd = true;
        this.EnableNodeRemove = true;
        this.EnableNodeEdit = true;
        this.SetContextValue();
    }
    Label = "";
    FilePath = "";
    async NodeAdd() {
        //TODO: Implement add logic here
    }
    NodeRemove() {
        //TODO: Implement remove logic here
    }
    NodeRefresh() {
    }
    NodeView() {
    }
    async NodeEdit() {
        //TODO: Implement edit logic here
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
exports.LambdaCodeFileNode = LambdaCodeFileNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], LambdaCodeFileNode.prototype, "Label", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], LambdaCodeFileNode.prototype, "FilePath", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaCodeFileNode', LambdaCodeFileNode);
//# sourceMappingURL=LambdaCodeFileNode.js.map