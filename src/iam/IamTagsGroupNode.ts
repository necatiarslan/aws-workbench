import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { TreeProvider } from '../tree/TreeProvider';
import { IamRoleNode } from './IamRoleNode';
import { IamTagNode } from './IamTagNode';

export class IamTagsGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "tag";
        
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeAdd(): Promise<void> {
        ui.logToOutput('IamTagsGroupNode.NodeAdd Started');

        // Get the parent IAM Role node
        const roleNode = this.Parent as IamRoleNode;
        if (!roleNode || !roleNode.RoleName) {
            ui.logToOutput('IamTagsGroupNode.NodeAdd - Parent IAM Role node not found');
            return;
        }

        // Prompt for tag key
        const tagKey = await vscode.window.showInputBox({
            placeHolder: 'Enter Tag Key (e.g., Environment)'
        });
        if (!tagKey) { return; }

        // Prompt for tag value (allow empty string, but not undefined/cancel)
        const tagValue = await vscode.window.showInputBox({
            placeHolder: 'Enter Tag Value (e.g., Production)'
        });
        if (tagValue === undefined) { return; }

        if (this.IsWorking) { return; }
        this.StartWorking();

        // Add the tag
        const addResult = await api.AddIamRoleTag(roleNode.Region, roleNode.RoleName, tagKey, tagValue);
        if (!addResult.isSuccessful) {
            ui.logToOutput('api.AddIamRoleTag Error !!!', addResult.error);
            ui.showErrorMessage('Add Tag Error !!!', addResult.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Added Successfully');

        // Reset working state before refresh
        this.StopWorking();
        await this.handleNodeRefresh();
    }

    public async handleNodeRefresh(): Promise<void> {
        ui.logToOutput('IamTagsGroupNode.NodeRefresh Started');

        // Get the parent IAM Role node
        const roleNode = this.Parent as IamRoleNode;
        if (!roleNode || !roleNode.RoleName) {
            ui.logToOutput('IamTagsGroupNode.NodeRefresh - Parent IAM Role node not found');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        // Get tags
        const tagsResult = await api.GetIamRoleTags(roleNode.Region, roleNode.RoleName);
        if (!tagsResult.isSuccessful) {
            ui.logToOutput('api.GetIamRoleTags Error !!!', tagsResult.error);
            ui.showErrorMessage('Get IAM Role Tags Error !!!', tagsResult.error);
            this.StopWorking();
            return;
        }

        // Clear existing children
        this.Children = [];

        // Add tags as children
        if (tagsResult.result && tagsResult.result.Tags) {
            for (const tag of tagsResult.result.Tags) {
                const tagNode = new IamTagNode(`${tag.Key} = ${tag.Value}`, this);
                tagNode.Key = tag.Key || '';
                tagNode.Value = tag.Value || '';
            }
        }

        this.StopWorking();
        TreeProvider.Current.Refresh(this);
    }

}
