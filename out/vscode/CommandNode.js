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
exports.CommandNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const TreeState_1 = require("../tree/TreeState");
class CommandNode extends NodeBase_1.NodeBase {
    Title = "";
    Command = "";
    constructor(Title, parent) {
        super(Title, parent);
        this.Icon = "terminal";
        this.Title = Title;
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.EnableNodeAlias = true;
        this.SetContextValue();
    }
    handleNodeRemove() {
        this.Remove();
        TreeState_1.TreeState.save();
    }
    handleNodeView() {
        vscode.window.showInformationMessage(`${this.Title}`, { modal: true, detail: this.Command });
    }
    async handleNodeEdit() {
        let commandContent = await vscode.window.showInputBox({ placeHolder: 'Command', value: this.Command });
        if (!commandContent) {
            return;
        }
        this.Command = commandContent;
        TreeState_1.TreeState.save();
    }
    handleNodeRun() {
        vscode.commands.executeCommand(this.Command);
    }
}
exports.CommandNode = CommandNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], CommandNode.prototype, "Title", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], CommandNode.prototype, "Command", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('CommandNode', CommandNode);
//# sourceMappingURL=CommandNode.js.map