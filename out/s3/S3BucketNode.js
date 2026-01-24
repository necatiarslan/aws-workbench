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
exports.S3BucketNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const TreeState_1 = require("../tree/TreeState");
const S3Explorer_1 = require("./S3Explorer");
const Session_1 = require("../common/Session");
class S3BucketNode extends NodeBase_1.NodeBase {
    constructor(BucketName, parent) {
        super(BucketName, parent);
        this.BucketName = BucketName;
        this.Icon = "s3-bucket";
        // if(Key) {this.label = Key}
        // this.Icon = Key ? Key.endsWith("/") ? "folder" : "file" : "s3-bucket";
        // this.Key = Key ?? "";
        this.EnableNodeRemove = true;
        this.EnableNodeView = true;
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;
        this.SetContextValue();
    }
    BucketName = "";
    Key = "";
    async NodeAdd() {
    }
    NodeRemove() {
        this.Remove();
        TreeState_1.TreeState.save();
    }
    IsShortcutExists(bucket, key) {
        key = key ?? "";
        return this.Children.some(x => x.BucketName === bucket && x.Key === key) ?? false;
    }
    AddShortcut(bucket, key) {
        new S3BucketNode(bucket, this).Key = key;
        TreeState_1.TreeState.save();
    }
    RemoveShortcut(bucket, key) {
        key = key ?? "";
        this.Children.forEach(x => {
            if (x.BucketName === bucket && x.Key === key) {
                x.Remove();
            }
        });
        TreeState_1.TreeState.save();
    }
    NodeRefresh() {
    }
    NodeView() {
        S3Explorer_1.S3Explorer.Render(Session_1.Session.Current.ExtensionUri, this);
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
    NodeLoaded() { }
}
exports.S3BucketNode = S3BucketNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], S3BucketNode.prototype, "BucketName", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], S3BucketNode.prototype, "Key", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('S3BucketNode', S3BucketNode);
//# sourceMappingURL=S3BucketNode.js.map