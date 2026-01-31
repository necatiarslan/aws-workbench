"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamRolePoliciesGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
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