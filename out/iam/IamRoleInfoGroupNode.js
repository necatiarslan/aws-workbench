"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamRoleInfoGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const IamInfoNode_1 = require("./IamInfoNode");
class IamRoleInfoGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "info";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('IamRoleInfoGroupNode.NodeRefresh Started');
        // Get the parent IAM Role node
        const roleNode = this.Parent;
        if (!roleNode || !roleNode.RoleName) {
            ui.logToOutput('IamRoleInfoGroupNode.NodeRefresh - Parent IAM Role node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // Get role details
        const result = await api.GetIamRole(roleNode.Region, roleNode.RoleName);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetIamRole Error !!!', result.error);
            ui.showErrorMessage('Get IAM Role Error !!!', result.error);
            this.StopWorking();
            return;
        }
        // Clear existing children
        this.Children = [];
        // Add info items as children
        const role = result.result.Role;
        if (role) {
            const infoItems = [
                { key: 'RoleName', value: role.RoleName || 'N/A' },
                { key: 'RoleId', value: role.RoleId || 'N/A' },
                { key: 'Arn', value: role.Arn || 'N/A' },
                { key: 'CreateDate', value: role.CreateDate?.toISOString() || 'N/A' },
                { key: 'Path', value: role.Path || 'N/A' },
                { key: 'MaxSessionDuration', value: role.MaxSessionDuration?.toString() + ' seconds' || 'N/A' },
                { key: 'Description', value: role.Description || 'N/A' }
            ];
            for (const item of infoItems) {
                const infoNode = new IamInfoNode_1.IamInfoNode(item.key, item.value, this);
                infoNode.InfoKey = item.key;
                infoNode.InfoValue = item.value;
            }
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        this.StopWorking();
        this.RefreshTree();
    }
}
exports.IamRoleInfoGroupNode = IamRoleInfoGroupNode;
//# sourceMappingURL=IamRoleInfoGroupNode.js.map