import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { TreeProvider } from '../tree/TreeProvider';
import { IamRoleNode } from './IamRoleNode';
import { IamRolePolicyNode } from './IamRolePolicyNode';

export class IamRolePoliciesGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "lock";
        
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeRefresh(): Promise<void> {
        ui.logToOutput('IamRolePoliciesGroupNode.NodeRefresh Started');

        // Get the parent IAM Role node
        const roleNode = this.Parent as IamRoleNode;
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
                const policyNode = new IamRolePolicyNode(policy.PolicyName || 'Unknown Policy', this);
                policyNode.PolicyName = policy.PolicyName || '';
                policyNode.PolicyArn = policy.PolicyArn || '';
                policyNode.Region = roleNode.Region;
            }
        }

        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        } else {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }

        this.StopWorking();
        TreeProvider.Current.Refresh(this);
    }

}
