import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { IamRoleNode } from './IamRoleNode';
import { IamRoleTrustNode } from './IamRoleTrustNode';

export class IamRoleTrustGroupNode extends NodeBase {

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
        ui.logToOutput('IamRoleTrustGroupNode.NodeRefresh Started');

        // Get the parent IAM Role node
        const roleNode = this.Parent as IamRoleNode;
        if (!roleNode || !roleNode.RoleName) {
            ui.logToOutput('IamRoleTrustGroupNode.NodeRefresh - Parent IAM Role node not found');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        // Get trust policy
        const result = await api.GetIamRoleTrustPolicy(roleNode.Region, roleNode.RoleName);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetIamRoleTrustPolicy Error !!!', result.error);
            ui.showErrorMessage('Get IAM Role Trust Policy Error !!!', result.error);
            this.StopWorking();
            return;
        }

        // Clear existing children
        this.Children = [];

        // Add trust relationships as children
        if (result.result && result.result.Statement) {
            for (const statement of result.result.Statement) {
                if (statement.Principal) {
                    // Handle Service principals
                    if (statement.Principal.Service) {
                        const services = Array.isArray(statement.Principal.Service) 
                            ? statement.Principal.Service 
                            : [statement.Principal.Service];
                        
                        for (const service of services) {
                            const trustNode = new IamRoleTrustNode(`Service: ${service}`, this);
                            trustNode.TrustEntity = service;
                            trustNode.TrustType = 'Service';
                            trustNode.Region = roleNode.Region;
                            trustNode.RoleName = roleNode.RoleName;
                        }
                    }
                    
                    // Handle AWS account principals
                    if (statement.Principal.AWS) {
                        const awsPrincipals = Array.isArray(statement.Principal.AWS) 
                            ? statement.Principal.AWS 
                            : [statement.Principal.AWS];
                        
                        for (const principal of awsPrincipals) {
                            const trustNode = new IamRoleTrustNode(`AWS: ${principal}`, this);
                            trustNode.TrustEntity = principal;
                            trustNode.TrustType = 'AWS';
                            trustNode.Region = roleNode.Region;
                            trustNode.RoleName = roleNode.RoleName;
                        }
                    }

                    // Handle Federated principals
                    if (statement.Principal.Federated) {
                        const fedPrincipals = Array.isArray(statement.Principal.Federated) 
                            ? statement.Principal.Federated 
                            : [statement.Principal.Federated];
                        
                        for (const principal of fedPrincipals) {
                            const trustNode = new IamRoleTrustNode(`Federated: ${principal}`, this);
                            trustNode.TrustEntity = principal;
                            trustNode.TrustType = 'Federated';
                            trustNode.Region = roleNode.Region;
                            trustNode.RoleName = roleNode.RoleName;
                        }
                    }
                }
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
