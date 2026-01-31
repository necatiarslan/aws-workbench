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
exports.SNSTopicNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const SNSPublishGroupNode_1 = require("./SNSPublishGroupNode");
const SNSSubscriptionsGroupNode_1 = require("./SNSSubscriptionsGroupNode");
class SNSTopicNode extends NodeBase_1.NodeBase {
    constructor(TopicArn, parent) {
        super(api.GetTopicNameFromArn(TopicArn), parent);
        this.Icon = "broadcast";
        this.TopicArn = TopicArn;
        this.TopicName = api.GetTopicNameFromArn(TopicArn);
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;
        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        this.LoadDefaultChildren();
        this.SetContextValue();
    }
    TopicName = "";
    TopicArn = "";
    Region = "";
    MessageFiles = [];
    async LoadDefaultChildren() {
        new SNSPublishGroupNode_1.SNSPublishGroupNode("Publish", this);
        new SNSSubscriptionsGroupNode_1.SNSSubscriptionsGroupNode("Subscriptions", this);
    }
    handleNodeRemove() {
        this.Remove();
        this.TreeSave();
    }
    async handleNodeInfo() {
        ui.logToOutput('SNSTopicNode.handleNodeInfo Started');
        if (!this.TopicArn || !this.Region) {
            ui.showWarningMessage('Topic ARN or region is not set.');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            const result = await api.GetTopicAttributes(this.Region, this.TopicArn);
            if (!result.isSuccessful) {
                ui.logToOutput('api.GetTopicAttributes Error !!!', result.error);
                ui.showErrorMessage('Get Topic Attributes Error !!!', result.error);
                return;
            }
            const attributes = result.result?.Attributes || {};
            const info = {
                TopicArn: this.TopicArn,
                Region: this.Region,
                TopicName: this.TopicName,
                ...attributes
            };
            const jsonContent = JSON.stringify(info, null, 2);
            const document = await vscode.workspace.openTextDocument({
                content: jsonContent,
                language: 'json'
            });
            await vscode.window.showTextDocument(document);
        }
        catch (error) {
            ui.logToOutput('SNSTopicNode.handleNodeInfo Error !!!', error);
            ui.showErrorMessage('Get Topic Info Error !!!', error);
        }
        finally {
            this.StopWorking();
        }
    }
    AddMessageFile(filePath) {
        const id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
        this.MessageFiles.push({ id, path: filePath });
        this.TreeSave();
    }
    RemoveMessageFile(id) {
        this.MessageFiles = this.MessageFiles.filter(f => f.id !== id);
        this.TreeSave();
    }
}
exports.SNSTopicNode = SNSTopicNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], SNSTopicNode.prototype, "TopicName", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], SNSTopicNode.prototype, "TopicArn", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], SNSTopicNode.prototype, "Region", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", Array)
], SNSTopicNode.prototype, "MessageFiles", void 0);
// Register the node for serialization
NodeRegistry_1.NodeRegistry.register('SNSTopicNode', SNSTopicNode);
//# sourceMappingURL=SNSTopicNode.js.map