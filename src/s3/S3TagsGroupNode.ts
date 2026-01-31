import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { S3BucketNode } from './S3BucketNode';
import { S3TagNode } from './S3TagNode';

export class S3TagsGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "tag";
        
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeRefresh(): Promise<void> {
        ui.logToOutput('S3TagsGroupNode.NodeRefresh Started');

        const bucketNode = this.Parent as S3BucketNode;
        if (!bucketNode || !bucketNode.BucketName) {
            ui.logToOutput('S3TagsGroupNode.NodeRefresh - Parent S3 bucket node not found');
            return;
        }

        // if (this.IsWorking) {
        //     return;
        // }

        this.StartWorking();

        const result = await api.GetBucketTags(bucketNode.BucketName);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetBucketTags Error !!!', result.error);
            ui.showErrorMessage('Get Bucket Tags Error !!!', result.error);
            this.StopWorking();
            return;
        }

        this.Children = [];

        const tags = result.result || [];
        for (const tag of tags) {
            new S3TagNode(tag.key, tag.value, this);
        }

        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }

        this.StopWorking();
        this.RefreshTree();
    }

    public async handleNodeAdd(): Promise<void> {
        ui.logToOutput('S3TagsGroupNode.NodeAdd Started');

        const bucketNode = this.Parent as S3BucketNode;
        if (!bucketNode || !bucketNode.BucketName) {
            ui.logToOutput('S3TagsGroupNode.NodeAdd - Parent S3 bucket node not found');
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

        const result = await api.UpdateS3BucketTag(bucketNode.BucketName, key, value);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateS3BucketTag Error !!!', result.error);
            ui.showErrorMessage('Add Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }

        ui.showInfoMessage('Tag Added Successfully');
        await this.handleNodeRefresh();
    }
}
