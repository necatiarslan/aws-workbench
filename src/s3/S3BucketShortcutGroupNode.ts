import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { S3BucketNode } from './S3BucketNode';
import { S3BucketShortcutNode } from './S3BucketShortcutNode';

export class S3BucketShortcutGroupNode extends NodeBase {

    private isRefreshing: boolean = false;

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "file-symlink-directory";

        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeAdd(): Promise<void> {
        const s3BucketNode = this.GetAwsResourceNode() as S3BucketNode;
        if (!s3BucketNode) {
            return;
        }

        const shortcutKey = await vscode.window.showInputBox({
            prompt: "Enter shortcut key for S3 Bucket",
            placeHolder: "e.g., folder/readme.md",
            validateInput: (value: string) => {
                if (!value || value.trim().length === 0) {
                    return "Shortcut key cannot be empty.";
                }
                if (s3BucketNode.Shortcuts.includes(value.trim())) {
                    return "This shortcut key already exists.";
                }
                return null;
            }
        });

        if (shortcutKey) {
            s3BucketNode.AddShortcut(shortcutKey.trim());
            await this.handleNodeRefresh();
        }
    }
    
    public async handleNodeRefresh(): Promise<void> {
        if (this.isRefreshing) {
            return;
        }

        const s3BucketNode = this.GetAwsResourceNode() as S3BucketNode;
        if (!s3BucketNode) {
            return;
        }

        const currentShortcutKeys = this.Children
            .filter((child): child is S3BucketShortcutNode => child instanceof S3BucketShortcutNode)
            .map((child) => child.Key);

        const shortcutsAreUnchanged = currentShortcutKeys.length === s3BucketNode.Shortcuts.length &&
            currentShortcutKeys.every((key, index) => key === s3BucketNode.Shortcuts[index]);

        if (shortcutsAreUnchanged) {
            return;
        }

        this.isRefreshing = true;
        try {
            this.Children = [];
            for (const shortcutKey of s3BucketNode.Shortcuts) {
                new S3BucketShortcutNode(shortcutKey, this);
            }
        }
        finally {
            this.isRefreshing = false;
        }
    }
}
