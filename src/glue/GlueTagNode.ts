import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { GlueJobNode } from './GlueJobNode';

export class GlueTagNode extends NodeBase {

    constructor(Key: string, Value: string, parent?: NodeBase) 
    {
        super(Key, parent);
        this.Icon = "circle-outline";
        this.Key = Key;
        this.Value = Value;
        this.description = Value;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;

        this.OnNodeCopy.subscribe(() => this.handleNodeCopy());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());

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
        ui.logToOutput('GlueTagNode.NodeRemove Started');

        if (!this.Key) { return; }

        const confirmation = await vscode.window.showWarningMessage(
            `Are you sure you want to remove tag "${this.Key}"?`,
            { modal: true },
            'Yes',
            'No'
        );

        if (confirmation !== 'Yes') { return; }

        const jobNode = this.GetAwsResourceNode() as GlueJobNode;
        if (!jobNode || !jobNode.JobName || !jobNode.Region) {
            ui.logToOutput('GlueTagNode.NodeRemove - Parent Glue job node not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        const result = await api.RemoveGlueJobTag(jobNode.Region, jobNode.JobName, this.Key);
        if (!result.isSuccessful) {
            ui.logToOutput('api.RemoveGlueJobTag Error !!!', result.error);
            ui.showErrorMessage('Remove Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Removed Successfully');
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }

    public async handleNodeRefresh(): Promise<void> {
        this.Parent?.NodeRefresh();
    }

    public async handleNodeEdit(): Promise<void> {
        ui.logToOutput('GlueTagNode.NodeEdit Started');

        const newValue = await vscode.window.showInputBox({
            value: this.Value,
            placeHolder: 'Enter New Value for ' + this.Key
        });
        if (newValue === undefined) { return; }

        if (!this.Key) { return; }

        const jobNode = this.GetAwsResourceNode() as GlueJobNode;
        if (!jobNode || !jobNode.JobName || !jobNode.Region) {
            ui.logToOutput('GlueTagNode.NodeEdit - Parent Glue job node not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        const result = await api.UpdateGlueJobTag(jobNode.Region, jobNode.JobName, this.Key, newValue);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateGlueJobTag Error !!!', result.error);
            ui.showErrorMessage('Update Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Updated Successfully');
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }
}
