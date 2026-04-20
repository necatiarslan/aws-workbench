"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const CloudWatchLogInfoGroupNode_1 = require("./CloudWatchLogInfoGroupNode");
class CloudWatchLogGroupNode extends NodeBase_1.NodeBase {
    constructor(LogGroup, parent) {
        super(LogGroup, parent);
        this.LogGroup = LogGroup;
        this.DefaultIcon = "cloudwatch-loggroup";
        this.DefaultIconColor = "charts.yellow";
        this.SetIcon();
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
    _info = undefined;
    get Info() {
        return this.getInfo();
    }
    async getInfo() {
        if (!this._info) {
            const api = await Promise.resolve().then(() => __importStar(require('./API')));
            const ui = await Promise.resolve().then(() => __importStar(require('../common/UI')));
            const response = await api.GetLogGroupInfo(this.Region, this.LogGroup);
            if (response.isSuccessful) {
                this._info = response.result;
            }
            else {
                ui.logToOutput('api.GetLogGroupInfo Error !!!', response.error);
                ui.showErrorMessage('Get Log Group Info Error !!!', response.error);
            }
        }
        return this._info;
    }
    async LoadDefaultChildren() {
        new CloudWatchLogInfoGroupNode_1.CloudWatchLogInfoGroupNode("Info", this);
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