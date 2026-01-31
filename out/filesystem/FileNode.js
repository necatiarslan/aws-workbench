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
exports.FileNode = void 0;
const serialization_1 = require("../common/serialization");
const NodeBase_1 = require("../tree/NodeBase");
const ui = require("../common/UI");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
class FileNode extends NodeBase_1.NodeBase {
    FileName = "";
    FilePath = "";
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "file-symlink-file";
        this.FileName = label;
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.EnableNodeAlias = true;
        this.SetContextValue();
    }
    handleNodeRemove() {
        this.Remove();
        this.TreeSave();
    }
    handleNodeOpen() {
        ui.openFile(this.FilePath);
    }
}
exports.FileNode = FileNode;
__decorate([
    (0, serialization_1.Serialize)(),
    __metadata("design:type", String)
], FileNode.prototype, "FileName", void 0);
__decorate([
    (0, serialization_1.Serialize)(),
    __metadata("design:type", String)
], FileNode.prototype, "FilePath", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('FileNode', FileNode);
//# sourceMappingURL=FileNode.js.map