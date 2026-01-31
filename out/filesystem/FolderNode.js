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
exports.FolderNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const TreeState_1 = require("../tree/TreeState");
const TreeView_1 = require("../tree/TreeView");
class FolderNode extends NodeBase_1.NodeBase {
    FolderName = "";
    constructor(FolderName, parent) {
        super(FolderName, parent);
        this.Icon = "folder";
        this.FolderName = FolderName;
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.SetContextValue();
    }
    async handleNodeAdd() {
        TreeView_1.TreeView.Current.Add(this);
    }
    async handleNodeEdit() {
        const newName = await vscode.window.showInputBox({
            value: this.FolderName,
            placeHolder: 'Folder Name'
        });
        if (!newName) {
            return;
        }
        this.FolderName = newName;
        this.label = newName;
        this.RefreshTree();
        TreeState_1.TreeState.save();
    }
    handleNodeRemove() {
        this.Remove();
        TreeState_1.TreeState.save();
    }
}
exports.FolderNode = FolderNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], FolderNode.prototype, "FolderName", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('FolderNode', FolderNode);
//# sourceMappingURL=FolderNode.js.map