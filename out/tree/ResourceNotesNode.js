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
exports.ResourceNotesNode = void 0;
const NodeBase_1 = require("./NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const NoteView_1 = require("../filesystem/NoteView");
const Session_1 = require("../common/Session");
const TreeState_1 = require("./TreeState");
class ResourceNotesNode extends NodeBase_1.NodeBase {
    NoteTitle = "Notes";
    NoteContent = "";
    constructor(NoteTitle = "Notes", parent) {
        super(NoteTitle, parent);
        this.Icon = "note";
        this.NoteTitle = NoteTitle;
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.SetContextValue();
    }
    handleNodeOpen() {
        NoteView_1.NoteView.Render(Session_1.Session.Current.ExtensionUri, this);
    }
    handleNodeView() {
        NoteView_1.NoteView.Render(Session_1.Session.Current.ExtensionUri, this);
    }
    handleNodeEdit() {
        NoteView_1.NoteView.Render(Session_1.Session.Current.ExtensionUri, this);
    }
    handleNodeRemove() {
        this.Remove();
        TreeState_1.TreeState.save();
    }
}
exports.ResourceNotesNode = ResourceNotesNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], ResourceNotesNode.prototype, "NoteTitle", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], ResourceNotesNode.prototype, "NoteContent", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('ResourceNotesNode', ResourceNotesNode);
//# sourceMappingURL=ResourceNotesNode.js.map