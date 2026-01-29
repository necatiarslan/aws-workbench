import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { TreeState } from '../tree/TreeState';
import { IamRolePoliciesGroupNode } from './IamRolePoliciesGroupNode';
import { IamRoleTrustGroupNode } from './IamRoleTrustGroupNode';
import { IamTagsGroupNode } from './IamTagsGroupNode';
import { IamRoleInfoGroupNode } from './IamRoleInfoGroupNode';

export class IamRoleNode extends NodeBase {

    constructor(RoleName: string, parent?: NodeBase) 
    {
        super(RoleName, parent);
        this.Icon = "shield";
        this.RoleName = RoleName;
        
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;

        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        
        this.LoadDefaultChildren();
        this.SetContextValue();
    }

    @Serialize()
    public RoleName: string = "";

    @Serialize()
    public Region: string = "";

    @Serialize()
    public Arn: string = "";

    public async LoadDefaultChildren(): Promise<void> {
        new IamRolePoliciesGroupNode("Policies", this);
        new IamRoleTrustGroupNode("Trust Relationships", this);
        new IamTagsGroupNode("Tags", this);
        new IamRoleInfoGroupNode("Info", this);
    }

    private handleNodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

    private async handleNodeInfo(): Promise<void> {
        ui.logToOutput('IamRoleNode.NodeInfo Started');

        if (!this.RoleName || !this.Region) {
            ui.showWarningMessage('IAM Role or region is not set.');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        try {
            const result = await api.GetIamRole(this.Region, this.RoleName);
            if (result.isSuccessful && result.result.Role) {
                const jsonContent = JSON.stringify(result.result.Role, null, 2);
                const document = await vscode.workspace.openTextDocument({
                    content: jsonContent,
                    language: 'json'
                });
                await vscode.window.showTextDocument(document);
            } else {
                ui.showWarningMessage('Failed to load IAM Role details');
            }
        } catch (error: any) {
            ui.logToOutput('IamRoleNode.NodeInfo Error !!!', error);
            ui.showErrorMessage('Failed to open IAM Role details', error);
        }
        this.StopWorking();
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('IamRoleNode', IamRoleNode);
