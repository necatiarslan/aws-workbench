import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { S3BucketNode } from './S3BucketNode';
import { S3ConfigPropertyNode } from './S3ConfigPropertyNode';

export class S3LifecycleGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = 'archive';
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        this.OnNodeLoadChildren.subscribe(() => this.handleNodeLoadChildren());
        this.OnNodeRefresh.subscribe(() => this.handleNodeLoadChildren());

        this.SetContextValue();
    }

    public GetBucketNode(): S3BucketNode | undefined {
        if (this.Parent instanceof S3BucketNode) {
            return this.Parent;
        }
        return undefined;
    }

    private async handleNodeLoadChildren(): Promise<void> {
        ui.logToOutput('S3LifecycleGroupNode.handleNodeLoadChildren Started');

        const bucketNode = this.GetBucketNode();
        if (!bucketNode || !bucketNode.BucketName) {
            ui.logToOutput('S3LifecycleGroupNode - Parent S3BucketNode not found');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        try {
            const result = await api.GetBucketLifecycleConfiguration(bucketNode.BucketName);

            if (!result.isSuccessful) {
                ui.logToOutput('api.GetBucketLifecycleConfiguration Error !!!', result.error);
                this.StopWorking();
                return;
            }

            this.Children = [];
            const rules = result.result || [];

            if (rules.length === 0) {
                this.collapsibleState = vscode.TreeItemCollapsibleState.None;
                this.StopWorking();
                this.RefreshTree();
                return;
            }

            for (const rule of rules) {
                const ruleId = rule.ID || 'Unknown';
                const status = rule.Status || 'Unknown';
                const filterStr = rule.Filter ? JSON.stringify(rule.Filter).substring(0, 50) : 'N/A';
                
                new S3ConfigPropertyNode(`Rule: ${ruleId}`, `Status: ${status}`, this);
                if (rule.Filter) {
                    new S3ConfigPropertyNode(`  Filter`, filterStr, this);
                }
                if (rule.Expiration) {
                    const expStr = rule.Expiration.Days ? `${rule.Expiration.Days} days` : 
                                   rule.Expiration.ExpiredObjectDeleteMarker ? 'DeleteMarker' : 'N/A';
                    new S3ConfigPropertyNode(`  Expiration`, expStr, this);
                }
                if (rule.Transitions && rule.Transitions.length > 0) {
                    const transStr = rule.Transitions.map((t: any) => `${t.StorageClass} at ${t.Days || t.Date || 'N/A'} days`).join(', ');
                    new S3ConfigPropertyNode(`  Transitions`, transStr, this);
                }
            }

            if (this.Children.length > 0) {
                this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
            }

            this.StopWorking();
            this.RefreshTree();
        } catch (error: any) {
            ui.logToOutput('S3LifecycleGroupNode Error !!!', error);
            this.StopWorking();
        }
    }
}
