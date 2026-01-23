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
exports.LambdaFunctionNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const TreeState_1 = require("../tree/TreeState");
const LambdaCodeGroupNode_1 = require("./LambdaCodeGroupNode");
const LambdaEnvGroupNode_1 = require("./LambdaEnvGroupNode");
const LambdaInfoGroupNode_1 = require("./LambdaInfoGroupNode");
const LambdaLogGroupNode_1 = require("./LambdaLogGroupNode");
const LambdaTagGroupNode_1 = require("./LambdaTagGroupNode");
const LambdaTriggerGroupNode_1 = require("./LambdaTriggerGroupNode");
class LambdaFunctionNode extends NodeBase_1.NodeBase {
    constructor(FunctionName, parent) {
        super(FunctionName, parent);
        this.Icon = "lambda-function";
        this.FunctionName = FunctionName;
        this.EnableNodeRemove = true;
        this.EnableNodeView = true;
        this.EnableNodeRun = true;
        this.EnableNodeStop = true;
        this.EnableNodeAlias = true;
        this.EnableNodeInfo = true;
        this.SetContextValue();
        this.LoadDefaultChildren();
    }
    FunctionName = "";
    Region = "";
    async LoadDefaultChildren() {
        new LambdaCodeGroupNode_1.LambdaCodeGroupNode("Code", this);
        new LambdaEnvGroupNode_1.LambdaEnvGroupNode("Env", this);
        new LambdaInfoGroupNode_1.LambdaInfoGroupNode("Info", this);
        new LambdaLogGroupNode_1.LambdaLogGroupNode("Logs", this);
        new LambdaTagGroupNode_1.LambdaTagGroupNode("Tags", this);
        new LambdaTriggerGroupNode_1.LambdaTriggerGroupNode("Triggers", this);
    }
    async NodeAdd() {
    }
    NodeRemove() {
        this.Remove();
        TreeState_1.TreeState.save();
    }
    NodeRefresh() {
    }
    NodeView() {
        //TODO: Implement Lambda function details viewing logic here
    }
    async NodeEdit() {
    }
    NodeRun() {
        this.StartWorking();
        //TODO: Implement Lambda invocation logic here
        this.StopWorking();
    }
    NodeStop() {
        //TODO: Implement Lambda function stop logic here
    }
    NodeOpen() {
    }
    NodeInfo() {
        //TODO: Implement Lambda function info display logic here
    }
}
exports.LambdaFunctionNode = LambdaFunctionNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], LambdaFunctionNode.prototype, "FunctionName", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], LambdaFunctionNode.prototype, "Region", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaFunctionNode', LambdaFunctionNode);
//# sourceMappingURL=LambdaFunctionNode.js.map