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
exports.NoteNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const ServiceHub_1 = require("../tree/ServiceHub");
const TreeState_1 = require("../tree/TreeState");
class NoteNode extends NodeBase_1.NodeBase {
    NoteTitle = "";
    NoteContent = "";
    constructor(NoteTitle, parent) {
        super(NoteTitle, parent);
        this.Icon = "note";
        this.NoteTitle = NoteTitle;
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.SetContextValue();
    }
    async handleNodeAdd() {
        const result = [];
        result.push("Folder");
        result.push("Note");
        result.push("File");
        result.push("S3 Bucket");
        result.push("CloudWatch Log Group");
        let nodeType = await vscode.window.showQuickPick(result, { canPickMany: false, placeHolder: 'Select Item Type' });
        if (!nodeType) {
            return;
        }
        switch (nodeType) {
            case "Folder":
                await ServiceHub_1.ServiceHub.Current.FileSystemService.Add(this, "Folder");
                break;
            case "Note":
                await ServiceHub_1.ServiceHub.Current.FileSystemService.Add(this, "Note");
                break;
            case "File":
                await ServiceHub_1.ServiceHub.Current.FileSystemService.Add(this, "File");
                break;
            case "S3 Bucket":
                await ServiceHub_1.ServiceHub.Current.FileSystemService.Add(this, "S3 Bucket");
                break;
            case "CloudWatch Log Group":
                await ServiceHub_1.ServiceHub.Current.FileSystemService.Add(this, "CloudWatch Log Group");
                break;
        }
        TreeState_1.TreeState.save();
    }
    handleNodeRemove() {
        this.Remove();
        TreeState_1.TreeState.save();
    }
    handleNodeView() {
        vscode.window.showInformationMessage(`${this.NoteTitle}`, { modal: true, detail: this.NoteContent });
    }
    async handleNodeEdit() {
        let noteContent = await vscode.window.showInputBox({ placeHolder: 'Note Content', value: this.NoteContent });
        if (!noteContent) {
            return;
        }
        this.NoteContent = noteContent;
        TreeState_1.TreeState.save();
    }
}
exports.NoteNode = NoteNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], NoteNode.prototype, "NoteTitle", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], NoteNode.prototype, "NoteContent", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('NoteNode', NoteNode);
//# sourceMappingURL=NoteNode.js.map