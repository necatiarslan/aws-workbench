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
exports.IamRolePoliciesGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const IamRolePolicyNode_1 = require("./IamRolePolicyNode");
class IamRolePoliciesGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "lock";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('IamRolePoliciesGroupNode.NodeRefresh Started');
        // Get the parent IAM Role node
        const roleNode = this.Parent;
        if (!roleNode || !roleNode.RoleName) {
            ui.logToOutput('IamRolePoliciesGroupNode.NodeRefresh - Parent IAM Role node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // Get attached policies
        const result = await api.GetIamRolePolicies(roleNode.Region, roleNode.RoleName);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetIamRolePolicies Error !!!', result.error);
            ui.showErrorMessage('Get IAM Role Policies Error !!!', result.error);
            this.StopWorking();
            return;
        }
        // Clear existing children
        this.Children = [];
        // Add policies as children
        if (result.result && result.result.AttachedPolicies) {
            for (const policy of result.result.AttachedPolicies) {
                const policyNode = new IamRolePolicyNode_1.IamRolePolicyNode(policy.PolicyName || 'Unknown Policy', this);
                policyNode.PolicyName = policy.PolicyName || '';
                policyNode.PolicyArn = policy.PolicyArn || '';
                policyNode.Region = roleNode.Region;
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
exports.IamRolePoliciesGroupNode = IamRolePoliciesGroupNode;
//# sourceMappingURL=IamRolePoliciesGroupNode.js.map