import { NodeBase } from '../tree/NodeBase';
import { S3Explorer } from './S3Explorer';
import { Session } from '../common/Session';
import { S3BucketNode } from './S3BucketNode';

export class S3BucketShortcutNode extends NodeBase {

    constructor(Key: string, parent?: NodeBase) 
    {
        super(Key, parent);

        this.Key = Key;
        this.Icon = "star";

        // Event subscriptions
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());

        this.SetContextValue();
    }

    public Key: string = "";

    private handleNodeRemove(): void {
        const s3BucketNode = this.GetAwsResourceNode() as S3BucketNode;
        if (s3BucketNode) {
            s3BucketNode.RemoveShortcut(this.Key);
            this.Remove();
        }
    }

    private handleNodeView(): void {
        const s3BucketNode = this.GetAwsResourceNode() as S3BucketNode;

        S3Explorer.Render(s3BucketNode, this.Key);
    }

}