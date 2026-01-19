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
exports.BashFileNode = void 0;
const serialization_1 = require("../../common/serialization");
const NodeBase_1 = require("../../tree/NodeBase");
const TreeState_1 = require("../../tree/TreeState");
const ui = require("../../common/UI");
const NodeRegistry_1 = require("../../common/serialization/NodeRegistry");
const vscode = require("vscode");
class BashFileNode extends NodeBase_1.NodeBase {
    FileName = "";
    FilePath = "";
    constructor(label, filePath, parent) {
        super(label, parent);
        this.Icon = "debug-alt";
        this.FileName = label;
        this.FilePath = filePath;
        this.EnableNodeRemove = true;
        this.EnableNodeOpen = true;
        this.EnableNodeRun = true;
        this.SetContextValue();
    }
    NodeAdd() {
    }
    NodeRemove() {
        this.Remove();
        TreeState_1.TreeState.save();
    }
    NodeRefresh() {
    }
    NodeView() {
    }
    NodeEdit() {
    }
    NodeRun() {
        //run the bash file in a new terminal
        this.StartWorking();
        vscode.window.createTerminal(this.FileName).sendText(this.FilePath);
        this.StopWorking();
    }
    NodeStop() {
    }
    NodeOpen() {
        ui.openFile(this.FilePath);
    }
    NodeInfo() {
    }
}
exports.BashFileNode = BashFileNode;
__decorate([
    (0, serialization_1.Serialize)(),
    __metadata("design:type", String)
], BashFileNode.prototype, "FileName", void 0);
__decorate([
    (0, serialization_1.Serialize)(),
    __metadata("design:type", String)
], BashFileNode.prototype, "FilePath", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('BashFileNode', BashFileNode);
//# sourceMappingURL=BashFileNode.js.map