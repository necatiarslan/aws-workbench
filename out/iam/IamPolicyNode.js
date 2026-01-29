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
exports.IamPolicyNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const TreeState_1 = require("../tree/TreeState");
const IamPolicyVersionsGroupNode_1 = require("./IamPolicyVersionsGroupNode");
const IamPolicyAttachmentsGroupNode_1 = require("./IamPolicyAttachmentsGroupNode");
const IamPolicyInfoGroupNode_1 = require("./IamPolicyInfoGroupNode");
class IamPolicyNode extends NodeBase_1.NodeBase {
    constructor(PolicyName, parent) {
        super(PolicyName, parent);
        this.Icon = "lock";
        this.PolicyName = PolicyName;
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;
        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.LoadDefaultChildren();
        this.SetContextValue();
    }
    PolicyName = "";
    PolicyArn = "";
    Region = "";
    IsAwsManaged = false;
    async LoadDefaultChildren() {
        new IamPolicyVersionsGroupNode_1.IamPolicyVersionsGroupNode("Versions", this);
        new IamPolicyAttachmentsGroupNode_1.IamPolicyAttachmentsGroupNode("Attachments", this);
        new IamPolicyInfoGroupNode_1.IamPolicyInfoGroupNode("Info", this);
    }
    handleNodeRemove() {
        this.Remove();
        TreeState_1.TreeState.save();
    }
    async handleNodeOpen() {
        ui.logToOutput('IamPolicyNode.NodeOpen Started');
        if (!this.PolicyArn || !this.Region) {
            ui.showWarningMessage('IAM Policy ARN or region is not set.');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            const result = await api.GetPolicyDocument(this.Region, this.PolicyArn);
            if (result.isSuccessful) {
                const jsonContent = JSON.stringify(result.result, null, 2);
                const document = await vscode.workspace.openTextDocument({
                    content: jsonContent,
                    language: 'json'
                });
                await vscode.window.showTextDocument(document);
            }
            else {
                ui.showWarningMessage('Failed to load IAM Policy document');
            }
        }
        catch (error) {
            ui.logToOutput('IamPolicyNode.NodeOpen Error !!!', error);
            ui.showErrorMessage('Failed to open IAM Policy document', error);
        }
        this.StopWorking();
    }
    async handleNodeInfo() {
        ui.logToOutput('IamPolicyNode.NodeInfo Started');
        if (!this.PolicyArn || !this.Region) {
            ui.showWarningMessage('IAM Policy ARN or region is not set.');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            const result = await api.GetIamPolicy(this.Region, this.PolicyArn);
            if (result.isSuccessful && result.result.Policy) {
                const jsonContent = JSON.stringify(result.result.Policy, null, 2);
                const document = await vscode.workspace.openTextDocument({
                    content: jsonContent,
                    language: 'json'
                });
                await vscode.window.showTextDocument(document);
            }
            else {
                ui.showWarningMessage('Failed to load IAM Policy details');
            }
        }
        catch (error) {
            ui.logToOutput('IamPolicyNode.NodeInfo Error !!!', error);
            ui.showErrorMessage('Failed to open IAM Policy details', error);
        }
        this.StopWorking();
    }
}
exports.IamPolicyNode = IamPolicyNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], IamPolicyNode.prototype, "PolicyName", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], IamPolicyNode.prototype, "PolicyArn", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], IamPolicyNode.prototype, "Region", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", Boolean)
], IamPolicyNode.prototype, "IsAwsManaged", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('IamPolicyNode', IamPolicyNode);
//# sourceMappingURL=IamPolicyNode.js.map