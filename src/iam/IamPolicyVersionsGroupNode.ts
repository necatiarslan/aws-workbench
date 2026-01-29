import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { TreeProvider } from '../tree/TreeProvider';
import { IamPolicyNode } from './IamPolicyNode';
import { IamPolicyVersionNode } from './IamPolicyVersionNode';

export class IamPolicyVersionsGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "versions";
        
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeRefresh(): Promise<void> {
        ui.logToOutput('IamPolicyVersionsGroupNode.NodeRefresh Started');

        // Get the parent IAM Policy node
        const policyNode = this.Parent as IamPolicyNode;
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
                const versionNode = new IamPolicyVersionNode(label, this);
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
        } else {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }

        this.StopWorking();
        TreeProvider.Current.Refresh(this);
    }

}
