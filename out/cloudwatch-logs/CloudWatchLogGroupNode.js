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
const vscode = require("vscode");
const CloudWatchLogView_1 = require("./CloudWatchLogView");
const api = require("./API");
const ui = require("../common/UI");
const CloudWatchLogStreamNode_1 = require("./CloudWatchLogStreamNode");
class CloudWatchLogGroupNode extends NodeBase_1.NodeBase {
    constructor(LogGroup, parent) {
        super(LogGroup, parent);
        this.LogGroup = LogGroup;
        this.Icon = "cloudwatch-loggroup";
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;
        // Attach event handlers
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.SetContextValue();
    }
    LogGroup = "";
    Region = "";
    async handleNodeAdd() {
        let filterStringTemp = await vscode.window.showInputBox({ placeHolder: 'Log Stream Name (Optional)' });
        if (filterStringTemp === undefined) {
            return;
        }
        var resultLogStream = await api.GetLogStreams(this.Region, this.LogGroup, filterStringTemp);
        if (!resultLogStream.isSuccessful) {
            ui.showErrorMessage(`Error getting Log Streams`, resultLogStream.error);
            return;
        }
        if (!resultLogStream.result) {
            ui.showInfoMessage(`No Log Streams Found`);
            return;
        }
        if (resultLogStream.result && resultLogStream.result.length === 0) {
            ui.showInfoMessage('No Log Streams Found');
            return;
        }
        let logStreamList = [];
        for (var ls of resultLogStream.result) {
            const date = ls.creationTime ? new Date(ls.creationTime) : new Date();
            logStreamList.push(ls.logStreamName + " (" + date.toDateString() + ")");
        }
        let selectedLogStreamList = await vscode.window.showQuickPick(logStreamList, { canPickMany: true, placeHolder: 'Select Log Stream' });
        if (!selectedLogStreamList || selectedLogStreamList.length === 0) {
            return;
        }
        for (var ls of resultLogStream.result) {
            if (!ls.logStreamName) {
                continue;
            }
            let lsName = ls.logStreamName;
            if (selectedLogStreamList.find(e => e.includes(lsName))) {
                const newNode = new CloudWatchLogStreamNode_1.CloudWatchLogStreamNode(lsName, this);
                newNode.Region = this.Region;
                newNode.LogGroup = this.LogGroup;
            }
        }
        this.TreeSave();
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
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('CloudWatchLogGroupNode', CloudWatchLogGroupNode);
//# sourceMappingURL=CloudWatchLogGroupNode.js.map