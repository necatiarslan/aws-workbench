import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { GlueJobNode } from './GlueJobNode';
import { GlueTagNode } from './GlueTagNode';

export class GlueTagsGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "tag";
        
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeRefresh(): Promise<void> {
        ui.logToOutput('GlueTagsGroupNode.NodeRefresh Started');

        const jobNode = this.Parent as GlueJobNode;
        if (!jobNode || !jobNode.JobName || !jobNode.Region) {
            ui.logToOutput('GlueTagsGroupNode.NodeRefresh - Parent Glue job node not found');
            return;
        }

        // if (this.IsWorking) {
        //     return;
        // }

        this.StartWorking();

        const result = await api.GetGlueJobTags(jobNode.Region, jobNode.JobName);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetGlueJobTags Error !!!', result.error);
            ui.showErrorMessage('Get Glue Job Tags Error !!!', result.error);
            this.StopWorking();
            return;
        }

        this.Children = [];

        const tags = result.result || [];
        for (const tag of tags) {
            new GlueTagNode(tag.key, tag.value, this);
        }

        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }

        this.StopWorking();
        this.RefreshTree();
    }

    public async handleNodeAdd(): Promise<void> {
        ui.logToOutput('GlueTagsGroupNode.NodeAdd Started');

        const jobNode = this.Parent as GlueJobNode;
        if (!jobNode || !jobNode.JobName || !jobNode.Region) {
            ui.logToOutput('GlueTagsGroupNode.NodeAdd - Parent Glue job node not found');
            return;
        }

        const key = await vscode.window.showInputBox({
            placeHolder: 'Enter Tag Key'
        });
        if (!key) { return; }

        const value = await vscode.window.showInputBox({
            placeHolder: 'Enter Tag Value'
        });
        if (value === undefined) { return; }

        if (this.IsWorking) { return; }
        this.StartWorking();

        const result = await api.UpdateGlueJobTag(jobNode.Region, jobNode.JobName, key, value);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateGlueJobTag Error !!!', result.error);
            ui.showErrorMessage('Add Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Added Successfully');
        await this.handleNodeRefresh();
    }
}
