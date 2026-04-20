import { Serialize } from "../common/serialization/Serialize";
import { NodeRegistry } from "../common/serialization/NodeRegistry";
import { NodeBase } from "../tree/NodeBase";
import { EmrClusterBucketNode } from "./EmrClusterBucketNode";

export class EmrNode extends NodeBase {

    constructor(label: string, parent?: NodeBase, region?: string, searchKey?: string) {
        super(label, parent);
        this.DefaultIcon = "server-process";
        this.DefaultIconColor = "charts.blue";
        this.SetIcon();

        this.Region = region ?? this.Region;
        this.SearchKey = searchKey ?? this.SearchKey;

        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;

        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());

        this.LoadDefaultChildren();
        this.SetContextValue();
    }

    @Serialize()
    public Region: string = "";

    @Serialize()
    public SearchKey: string = "";

    public async LoadDefaultChildren(): Promise<void> {
        new EmrClusterBucketNode("Today Active", "today-active", this);
        new EmrClusterBucketNode("Today Terminated", "today-terminated", this);
        new EmrClusterBucketNode("This Week", "this-week", this);
        new EmrClusterBucketNode("Prev Week", "prev-week", this);
    }

    private handleNodeRemove(): void {
        this.Remove();
        this.TreeSave();
    }

    private async handleNodeRefresh(): Promise<void> {
        this.Children = [];
        await this.LoadDefaultChildren();
        this.RefreshTree();
    }
}

NodeRegistry.register("EmrNode", EmrNode);
