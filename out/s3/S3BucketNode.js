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
const S3Explorer_1 = require("./S3Explorer");
const S3BucketShortcutGroupNode_1 = require("./S3BucketShortcutGroupNode");
const S3TagsGroupNode_1 = require("./S3TagsGroupNode");
class S3BucketNode extends NodeBase_1.NodeBase {
    constructor(BucketName, parent) {
        super(BucketName, parent);
        this.BucketName = BucketName;
        this.Icon = "s3-bucket";
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;
        // Event subscriptions
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.LoadDefaultChildren();
        this.SetContextValue();
    }
    BucketName = "";
    Shortcuts = [];
    ShortcutGroupNode;
    handleNodeRemove() {
        this.Remove();
        this.TreeSave();
    }
    async LoadDefaultChildren() {
        this.ShortcutGroupNode = new S3BucketShortcutGroupNode_1.S3BucketShortcutGroupNode("Shortcuts", this);
        new S3TagsGroupNode_1.S3TagsGroupNode("Tags", this);
    }
    IsShortcutExists(key) {
        return this.Shortcuts.includes(key);
    }
    AddOrRemoveShortcut(key) {
        if (this.IsShortcutExists(key)) {
            this.RemoveShortcut(key);
        }
        else {
            this.AddShortcut(key);
        }
    }
    AddShortcut(key) {
        if (!this.IsShortcutExists(key)) {
            this.Shortcuts.push(key);
            this.ShortcutGroupNode?.NodeRefresh();
            this.TreeSave();
        }
    }
    RemoveShortcut(key) {
        this.Shortcuts = this.Shortcuts.filter(k => k !== key);
        this.ShortcutGroupNode?.NodeRefresh();
        this.TreeSave();
    }
    handleNodeView() {
        S3Explorer_1.S3Explorer.Render(this);
    }
}
exports.S3BucketNode = S3BucketNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], S3BucketNode.prototype, "BucketName", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", Array)
], S3BucketNode.prototype, "Shortcuts", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('S3BucketNode', S3BucketNode);
//# sourceMappingURL=S3BucketNode.js.map