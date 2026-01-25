"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3BucketShortcutNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const S3Explorer_1 = require("./S3Explorer");
const Session_1 = require("../common/Session");
class S3BucketShortcutNode extends NodeBase_1.NodeBase {
    constructor(Key, parent) {
        super(Key, parent);
        this.Key = Key;
        this.Icon = "star";
        // Event subscriptions
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.SetContextValue();
    }
    Key = "";
    handleNodeRemove() {
        const s3BucketNode = this.GetAwsResourceNode();
        if (s3BucketNode) {
            s3BucketNode.RemoveShortcut(this.Key);
            this.Remove();
        }
    }
    handleNodeView() {
        const s3BucketNode = this.GetAwsResourceNode();
        S3Explorer_1.S3Explorer.Render(Session_1.Session.Current.ExtensionUri, s3BucketNode, this.Key);
    }
}
exports.S3BucketShortcutNode = S3BucketShortcutNode;
//# sourceMappingURL=S3BucketShortcutNode.js.map