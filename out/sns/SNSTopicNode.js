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
exports.SNSTopicNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = __importStar(require("vscode"));
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const SNSPublishGroupNode_1 = require("./SNSPublishGroupNode");
const SNSSubscriptionsGroupNode_1 = require("./SNSSubscriptionsGroupNode");
const SNSInfoGroupNode_1 = require("./SNSInfoGroupNode");
const SNSTagsGroupNode_1 = require("./SNSTagsGroupNode");
class SNSTopicNode extends NodeBase_1.NodeBase {
    constructor(TopicArn, parent) {
        super(api.GetTopicNameFromArn(TopicArn), parent);
        this.DefaultIcon = "broadcast";
        this.DefaultIconColor = "charts.red";
        this.SetIcon();
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
    _attributes = undefined;
    get Attributes() {
        return this.getAttributes();
    }
    async getAttributes() {
        if (!this._attributes) {
            const response = await api.GetTopicAttributes(this.Region, this.TopicArn);
            if (response.isSuccessful) {
                this._attributes = response.result?.Attributes;
            }
            else {
                ui.logToOutput('api.GetTopicAttributes Error !!!', response.error);
                ui.showErrorMessage('Get Topic Attributes Error !!!', response.error);
            }
        }
        return this._attributes;
    }
    async LoadDefaultChildren() {
        new SNSInfoGroupNode_1.SNSInfoGroupNode("Info", this);
        new SNSPublishGroupNode_1.SNSPublishGroupNode("Publish", this);
        new SNSSubscriptionsGroupNode_1.SNSSubscriptionsGroupNode("Subscriptions", this);
        new SNSTagsGroupNode_1.SNSTagsGroupNode("Tags", this);
    }
    handleNodeRemove() {
        this.Remove();
        this.TreeSave();
    }
    async handleNodeInfo() {
        ui.logToOutput('SNSTopicNode.handleNodeInfo Started');
        this.StartWorking();
        try {
            const attributes = await this.Attributes;
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