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
const ServiceHub_1 = require("../tree/ServiceHub");
const TreeState_1 = require("../tree/TreeState");
class FolderNode extends NodeBase_1.NodeBase {
    constructor(FolderName, parent) {
        super(FolderName, parent);
        this.Icon = "folder";
        this.FolderName = FolderName;
        this.EnableNodeAdd = true;
        this.EnableNodeRemove = true;
        this.SetContextValue();
    }
    FolderName = "";
    async NodeAdd() {
        const result = [];
        result.push("Folder");
        result.push("Note");
        result.push("File");
        result.push("Bash Script");
        result.push("Bash File");
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
            case "Bash Script":
                await ServiceHub_1.ServiceHub.Current.FileSystemService.Add(this, "Bash Script");
                break;
            case "Bash File":
                await ServiceHub_1.ServiceHub.Current.FileSystemService.Add(this, "Bash File");
                break;
            case "S3 Bucket":
                await ServiceHub_1.ServiceHub.Current.S3Service.Add(this);
                break;
            case "CloudWatch Log Group":
                await ServiceHub_1.ServiceHub.Current.CloudWatchLogService.Add(this);
                break;
        }
        TreeState_1.TreeState.save();
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
    }
    NodeStop() {
    }
    NodeOpen() {
    }
    NodeInfo() {
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