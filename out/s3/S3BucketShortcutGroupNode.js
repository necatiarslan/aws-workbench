"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3BucketShortcutGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const S3BucketShortcutNode_1 = require("./S3BucketShortcutNode");
class S3BucketShortcutGroupNode extends NodeBase_1.NodeBase {
    isRefreshing = false;
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "file-symlink-directory";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
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
        if (this.isRefreshing) {
            return;
        }
        const s3BucketNode = this.GetAwsResourceNode();
        if (!s3BucketNode) {
            return;
        }
        const currentShortcutKeys = this.Children
            .filter((child) => child instanceof S3BucketShortcutNode_1.S3BucketShortcutNode)
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
                new S3BucketShortcutNode_1.S3BucketShortcutNode(shortcutKey, this);
            }
        }
        finally {
            this.isRefreshing = false;
        }
    }
}
exports.S3BucketShortcutGroupNode = S3BucketShortcutGroupNode;
//# sourceMappingURL=S3BucketShortcutGroupNode.js.map