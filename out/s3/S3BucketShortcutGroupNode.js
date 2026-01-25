"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3BucketShortcutGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const S3BucketShortcutNode_1 = require("./S3BucketShortcutNode");
class S3BucketShortcutGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "file-symlink-directory";
        this.ShouldBeSaved = false;
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
    }
    async handleNodeAdd() {
        const s3BucketNode = this.GetAwsResourceNode();
        if (!s3BucketNode) {
            return;
        }
        const shortcutKey = await vscode.window.showInputBox({
            prompt: "Enter shortcut key for S3 Bucket",
            placeHolder: "e.g., folder/readme.md",
            validateInput: (value) => {
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
    async handleNodeRefresh() {
        const s3BucketNode = this.GetAwsResourceNode();
        if (!s3BucketNode) {
            return;
        }
        this.Children = [];
        for (const shortcutKey of s3BucketNode.Shortcuts) {
            new S3BucketShortcutNode_1.S3BucketShortcutNode(shortcutKey, this);
        }
    }
}
exports.S3BucketShortcutGroupNode = S3BucketShortcutGroupNode;
//# sourceMappingURL=S3BucketShortcutGroupNode.js.map