"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamPolicyInfoGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const TreeProvider_1 = require("../tree/TreeProvider");
const IamInfoNode_1 = require("./IamInfoNode");
class IamPolicyInfoGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "info";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('IamPolicyInfoGroupNode.NodeRefresh Started');
        // Get the parent IAM Policy node
        const policyNode = this.Parent;
        if (!policyNode || !policyNode.PolicyArn) {
            ui.logToOutput('IamPolicyInfoGroupNode.NodeRefresh - Parent IAM Policy node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // Get policy details
        const result = await api.GetIamPolicy(policyNode.Region, policyNode.PolicyArn);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetIamPolicy Error !!!', result.error);
            ui.showErrorMessage('Get IAM Policy Error !!!', result.error);
            this.StopWorking();
            return;
        }
        // Clear existing children
        this.Children = [];
        // Add info items as children
        const policy = result.result.Policy;
        if (policy) {
            const infoItems = [
                { key: 'PolicyName', value: policy.PolicyName || 'N/A' },
                { key: 'PolicyId', value: policy.PolicyId || 'N/A' },
                { key: 'Arn', value: policy.Arn || 'N/A' },
                { key: 'Path', value: policy.Path || 'N/A' },
                { key: 'DefaultVersionId', value: policy.DefaultVersionId || 'N/A' },
                { key: 'AttachmentCount', value: policy.AttachmentCount?.toString() || '0' },
                { key: 'PermissionsBoundaryUsageCount', value: policy.PermissionsBoundaryUsageCount?.toString() || '0' },
                { key: 'IsAttachable', value: policy.IsAttachable ? 'Yes' : 'No' },
                { key: 'CreateDate', value: policy.CreateDate?.toISOString() || 'N/A' },
                { key: 'UpdateDate', value: policy.UpdateDate?.toISOString() || 'N/A' },
                { key: 'Description', value: policy.Description || 'N/A' }
            ];
            for (const item of infoItems) {
                const infoNode = new IamInfoNode_1.IamInfoNode(`${item.key}: ${item.value}`, this);
                infoNode.Key = item.key;
                infoNode.Value = item.value;
            }
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        this.StopWorking();
        TreeProvider_1.TreeProvider.Current.Refresh(this);
    }
}
exports.IamPolicyInfoGroupNode = IamPolicyInfoGroupNode;
//# sourceMappingURL=IamPolicyInfoGroupNode.js.map