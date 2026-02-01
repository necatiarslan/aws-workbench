import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { IamRoleNode } from './IamRoleNode';

export class IamTagNode extends NodeBase {

    constructor(Key: string, Value: string, parent?: NodeBase) 
    {
        super(Key, parent);
        this.Icon = "circle-outline";
        this.Key = Key;
        this.Value = Value;
        this.description = Value;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;

        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeCopy.subscribe(() => this.handleNodeCopy());

        this.SetContextValue();
    }

    public Key: string = "";

    public Value: string = "";

    private async handleNodeCopy(): Promise<void> {
        const info = `${this.Key}: ${this.Value}`;
        ui.CopyToClipboard(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }

    public async handleNodeRemove(): Promise<void> {
        ui.logToOutput('IamTagNode.NodeRemove Started');

        if (!this.Key) { return; }

        const confirmation = await vscode.window.showWarningMessage(
            `Are you sure you want to remove tag "${this.Key}"?`,
            { modal: true },
            'Yes',
            'No'
        );

        if (confirmation !== 'Yes') { return; }

        // Resolve the parent IAM Role node
        const roleNode = this.GetAwsResourceNode() as IamRoleNode;
        if (!roleNode || !roleNode.RoleName) {
            ui.logToOutput('IamTagNode.NodeRemove - Parent IAM Role node not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        // Remove tag
        const result = await api.RemoveIamRoleTag(roleNode.Region, roleNode.RoleName, this.Key);
        if (!result.isSuccessful) {
            ui.logToOutput('api.RemoveIamRoleTag Error !!!', result.error);
            ui.showErrorMessage('Remove Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Removed Successfully');

        // Refresh the parent tags group to reflect changes
        this.Parent?.NodeRefresh();

        this.StopWorking();
    }

    public async handleNodeRefresh(): Promise<void> {
        this.Parent?.NodeRefresh();
    }

    public async handleNodeEdit(): Promise<void> {
        ui.logToOutput('IamTagNode.NodeEdit Started');

        // Prompt for new value (allow empty string, but not undefined/cancel)
        const newValue = await vscode.window.showInputBox({
            value: this.Value,
            placeHolder: 'Enter New Value for ' + this.Key
        });
        if (newValue === undefined) { return; }

        if (!this.Key) { return; }

        // Resolve the parent IAM Role node
        const roleNode = this.GetAwsResourceNode() as IamRoleNode;
        if (!roleNode || !roleNode.RoleName) {
            ui.logToOutput('IamTagNode.NodeEdit - Parent IAM Role node not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        // Update tag (same API as add; overwrites existing)
        const result = await api.UpdateIamRoleTag(roleNode.Region, roleNode.RoleName, this.Key, newValue);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateIamRoleTag Error !!!', result.error);
            ui.showErrorMessage('Update Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Updated Successfully');

        // Refresh the parent tags group to show updated values
        this.Parent?.NodeRefresh();

        this.StopWorking();
    }

}
