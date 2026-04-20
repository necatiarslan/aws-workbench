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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamPolicyAttachmentsGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const IamPolicyAttachmentNode_1 = require("./IamPolicyAttachmentNode");
class IamPolicyAttachmentsGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "references";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('IamPolicyAttachmentsGroupNode.NodeRefresh Started');
        // Get the parent IAM Policy node
        const policyNode = this.Parent;
        if (!policyNode || !policyNode.PolicyArn) {
            ui.logToOutput('IamPolicyAttachmentsGroupNode.NodeRefresh - Parent IAM Policy node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // Get policy entities
        const result = await api.GetPolicyEntities(policyNode.Region, policyNode.PolicyArn);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetPolicyEntities Error !!!', result.error);
            ui.showErrorMessage('Get Policy Entities Error !!!', result.error);
            this.StopWorking();
            return;
        }
        // Clear existing children
        this.Children = [];
        // Add users as children
        if (result.result.PolicyUsers) {
            for (const user of result.result.PolicyUsers) {
                const attachmentNode = new IamPolicyAttachmentNode_1.IamPolicyAttachmentNode(`User: ${user.UserName}`, this);
                attachmentNode.EntityType = 'User';
                attachmentNode.EntityName = user.UserName || '';
                attachmentNode.EntityId = user.UserId || '';
            }
        }
        // Add groups as children
        if (result.result.PolicyGroups) {
            for (const group of result.result.PolicyGroups) {
                const attachmentNode = new IamPolicyAttachmentNode_1.IamPolicyAttachmentNode(`Group: ${group.GroupName}`, this);
                attachmentNode.EntityType = 'Group';
                attachmentNode.EntityName = group.GroupName || '';
                attachmentNode.EntityId = group.GroupId || '';
            }
        }
        // Add roles as children
        if (result.result.PolicyRoles) {
            for (const role of result.result.PolicyRoles) {
                const attachmentNode = new IamPolicyAttachmentNode_1.IamPolicyAttachmentNode(`Role: ${role.RoleName}`, this);
                attachmentNode.EntityType = 'Role';
                attachmentNode.EntityName = role.RoleName || '';
                attachmentNode.EntityId = role.RoleId || '';
            }
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        else {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }
        this.StopWorking();
        this.RefreshTree();
    }
}
exports.IamPolicyAttachmentsGroupNode = IamPolicyAttachmentsGroupNode;
//# sourceMappingURL=IamPolicyAttachmentsGroupNode.js.map