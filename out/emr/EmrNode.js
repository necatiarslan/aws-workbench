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
exports.EmrNode = void 0;
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const NodeBase_1 = require("../tree/NodeBase");
const EmrClusterBucketNode_1 = require("./EmrClusterBucketNode");
class EmrNode extends NodeBase_1.NodeBase {
    constructor(label, parent, region, searchKey) {
        super(label, parent);
        this.DefaultIcon = "server-process";
        this.DefaultIconColor = "charts.blue";
        this.SetIcon();
        this.Region = region ?? this.Region;
        this.SearchKey = searchKey ?? this.SearchKey;
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.LoadDefaultChildren();
        this.SetContextValue();
    }
    Region = "";
    SearchKey = "";
    async LoadDefaultChildren() {
        new EmrClusterBucketNode_1.EmrClusterBucketNode("Today Active", "today-active", this);
        new EmrClusterBucketNode_1.EmrClusterBucketNode("Today Terminated", "today-terminated", this);
        new EmrClusterBucketNode_1.EmrClusterBucketNode("This Week", "this-week", this);
        new EmrClusterBucketNode_1.EmrClusterBucketNode("Prev Week", "prev-week", this);
    }
    handleNodeRemove() {
        this.Remove();
        this.TreeSave();
    }
    async handleNodeRefresh() {
        this.Children = [];
        await this.LoadDefaultChildren();
        this.RefreshTree();
    }
}
exports.EmrNode = EmrNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], EmrNode.prototype, "Region", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], EmrNode.prototype, "SearchKey", void 0);
NodeRegistry_1.NodeRegistry.register("EmrNode", EmrNode);
//# sourceMappingURL=EmrNode.js.map