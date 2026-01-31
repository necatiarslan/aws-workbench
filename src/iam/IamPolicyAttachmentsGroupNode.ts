import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { IamPolicyNode } from './IamPolicyNode';
import { IamPolicyAttachmentNode } from './IamPolicyAttachmentNode';

export class IamPolicyAttachmentsGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "references";
        
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeRefresh(): Promise<void> {
        ui.logToOutput('IamPolicyAttachmentsGroupNode.NodeRefresh Started');

        // Get the parent IAM Policy node
        const policyNode = this.Parent as IamPolicyNode;
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
                const attachmentNode = new IamPolicyAttachmentNode(`User: ${user.UserName}`, this);
                attachmentNode.EntityType = 'User';
                attachmentNode.EntityName = user.UserName || '';
                attachmentNode.EntityId = user.UserId || '';
            }
        }

        // Add groups as children
        if (result.result.PolicyGroups) {
            for (const group of result.result.PolicyGroups) {
                const attachmentNode = new IamPolicyAttachmentNode(`Group: ${group.GroupName}`, this);
                attachmentNode.EntityType = 'Group';
                attachmentNode.EntityName = group.GroupName || '';
                attachmentNode.EntityId = group.GroupId || '';
            }
        }

        // Add roles as children
        if (result.result.PolicyRoles) {
            for (const role of result.result.PolicyRoles) {
                const attachmentNode = new IamPolicyAttachmentNode(`Role: ${role.RoleName}`, this);
                attachmentNode.EntityType = 'Role';
                attachmentNode.EntityName = role.RoleName || '';
                attachmentNode.EntityId = role.RoleId || '';
            }
        }

        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        } else {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }

        this.StopWorking();
        this.RefreshTree()
    }

}
