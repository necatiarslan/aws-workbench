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
exports.CloudWatchLogGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const CloudWatchLogView_1 = require("./CloudWatchLogView");
const CloudWatchLogTagsGroupNode_1 = require("./CloudWatchLogTagsGroupNode");
const CloudWatchLogStreamsGroupNode_1 = require("./CloudWatchLogStreamsGroupNode");
class CloudWatchLogGroupNode extends NodeBase_1.NodeBase {
    constructor(LogGroup, parent) {
        super(LogGroup, parent);
        this.LogGroup = LogGroup;
        this.Icon = "cloudwatch-loggroup";
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;
        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.LoadDefaultChildren();
        this.SetContextValue();
    }
    LogGroup = "";
    Region = "";
    LogStreams = [];
    async LoadDefaultChildren() {
        new CloudWatchLogStreamsGroupNode_1.CloudWatchLogStreamsGroupNode("Log Streams", this);
        new CloudWatchLogTagsGroupNode_1.CloudWatchLogTagsGroupNode("Tags", this);
    }
    handleNodeRemove() {
        this.Remove();
        this.TreeSave();
    }
    handleNodeView() {
        CloudWatchLogView_1.CloudWatchLogView.Render(this.Region, this.LogGroup);
    }
}
exports.CloudWatchLogGroupNode = CloudWatchLogGroupNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], CloudWatchLogGroupNode.prototype, "LogGroup", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], CloudWatchLogGroupNode.prototype, "Region", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", Array)
], CloudWatchLogGroupNode.prototype, "LogStreams", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('CloudWatchLogGroupNode', CloudWatchLogGroupNode);
//# sourceMappingURL=CloudWatchLogGroupNode.js.map