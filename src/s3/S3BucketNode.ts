import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import { S3Explorer } from './S3Explorer';
import { S3BucketShortcutGroupNode } from './S3BucketShortcutGroupNode';
import { S3TagsGroupNode } from './S3TagsGroupNode';

export class S3BucketNode extends NodeBase {

    constructor(BucketName: string, parent?: NodeBase) 
    {
        super(BucketName, parent);

        this.BucketName = BucketName;
        this.Icon = "s3-bucket";

        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;

        // Event subscriptions
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());

        this.LoadDefaultChildren();
        this.SetContextValue();

    }

    @Serialize()
    public BucketName: string = "";

    @Serialize()
    public Shortcuts: string[] = [];

    private ShortcutGroupNode: S3BucketShortcutGroupNode | undefined;

    private handleNodeRemove(): void {
        this.Remove();
        this.TreeSave();
    }

    public async LoadDefaultChildren(): Promise<void> {
        this.ShortcutGroupNode = new S3BucketShortcutGroupNode("Shortcuts", this);
        new S3TagsGroupNode("Tags", this);
    }

    public IsShortcutExists(key:string):boolean
    {
        return this.Shortcuts.includes(key);
    }

    public AddOrRemoveShortcut(key:string):void
    {
        if (this.IsShortcutExists(key)) {
            this.RemoveShortcut(key);
        } else {
            this.AddShortcut(key);
        }
    }

    public AddShortcut(key:string):void
    {
        if (!this.IsShortcutExists(key)) {
            this.Shortcuts.push(key);
            this.ShortcutGroupNode?.NodeRefresh();
            this.TreeSave();
        }
    }

    public RemoveShortcut(key:string):void
    {
        this.Shortcuts = this.Shortcuts.filter(k => k !== key);
        this.ShortcutGroupNode?.NodeRefresh();
        this.TreeSave();
    }

    private handleNodeView(): void {
        S3Explorer.Render(this);
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('S3BucketNode', S3BucketNode);