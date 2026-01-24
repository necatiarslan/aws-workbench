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
exports.CloudWatchLogStreamNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const TreeState_1 = require("../tree/TreeState");
const Session_1 = require("../common/Session");
const CloudWatchLogView_1 = require("./CloudWatchLogView");
class CloudWatchLogStreamNode extends NodeBase_1.NodeBase {
    constructor(LogStream, parent) {
        super(LogStream, parent);
        this.LogStream = LogStream;
        this.Icon = "cloudwatch-logstream";
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;
        this.SetContextValue();
        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());
    }
    LogStream = "";
    LogGroup = "";
    Region = "";
    handleNodeRemove() {
        this.Remove();
        TreeState_1.TreeState.save();
    }
    handleNodeView() {
        CloudWatchLogView_1.CloudWatchLogView.Render(Session_1.Session.Current.ExtensionUri, this.Region, this.LogGroup, this.LogStream);
    }
}
exports.CloudWatchLogStreamNode = CloudWatchLogStreamNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], CloudWatchLogStreamNode.prototype, "LogStream", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], CloudWatchLogStreamNode.prototype, "LogGroup", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], CloudWatchLogStreamNode.prototype, "Region", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('CloudWatchLogStreamNode', CloudWatchLogStreamNode);
//# sourceMappingURL=CloudWatchLogStreamNode.js.map