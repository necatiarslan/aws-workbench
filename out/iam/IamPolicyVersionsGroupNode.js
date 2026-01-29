"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamPolicyVersionsGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const TreeProvider_1 = require("../tree/TreeProvider");
const IamPolicyVersionNode_1 = require("./IamPolicyVersionNode");
class IamPolicyVersionsGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "versions";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('IamPolicyVersionsGroupNode.NodeRefresh Started');
        // Get the parent IAM Policy node
        const policyNode = this.Parent;
        if (!policyNode || !policyNode.PolicyArn) {
            ui.logToOutput('IamPolicyVersionsGroupNode.NodeRefresh - Parent IAM Policy node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // Get policy versions
        const result = await api.GetPolicyVersions(policyNode.Region, policyNode.PolicyArn);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetPolicyVersions Error !!!', result.error);
            ui.showErrorMessage('Get Policy Versions Error !!!', result.error);
            this.StopWorking();
            return;
        }
        // Clear existing children
        this.Children = [];
        // Add versions as children
        if (result.result && result.result.Versions) {
            for (const version of result.result.Versions) {
                const label = version.IsDefaultVersion
                    ? `${version.VersionId} (Default)`
                    : version.VersionId || 'Unknown';
                const versionNode = new IamPolicyVersionNode_1.IamPolicyVersionNode(label, this);
                versionNode.VersionId = version.VersionId || '';
                versionNode.IsDefault = version.IsDefaultVersion || false;
                versionNode.CreateDate = version.CreateDate?.toISOString() || '';
                versionNode.PolicyArn = policyNode.PolicyArn;
                versionNode.PolicyName = policyNode.PolicyName;
                versionNode.Region = policyNode.Region;
            }
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        else {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }
        this.StopWorking();
        TreeProvider_1.TreeProvider.Current.Refresh(this);
    }
}
exports.IamPolicyVersionsGroupNode = IamPolicyVersionsGroupNode;
//# sourceMappingURL=IamPolicyVersionsGroupNode.js.map