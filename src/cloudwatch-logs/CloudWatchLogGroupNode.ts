import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import  { CloudWatchLogView } from './CloudWatchLogView';
import { CloudWatchLogTagsGroupNode } from './CloudWatchLogTagsGroupNode';
import { CloudWatchLogStreamsGroupNode } from './CloudWatchLogStreamsGroupNode';

export class CloudWatchLogGroupNode extends NodeBase {

    constructor(LogGroup: string, parent?: NodeBase) 
    {
        super(LogGroup, parent);

        this.LogGroup = LogGroup;
        this.Icon = "cloudwatch-loggroup";

        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;

        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        
        this.LoadDefaultChildren();
        this.SetContextValue();
    }

    @Serialize()
    public LogGroup: string = "";

    @Serialize()
    public Region: string = "";

    @Serialize()
    public LogStreams: string[] = [];

    public async LoadDefaultChildren(): Promise<void> {
        new CloudWatchLogStreamsGroupNode("Log Streams", this);
        new CloudWatchLogTagsGroupNode("Tags", this);
    }

    public handleNodeRemove(): void {
        this.Remove();
        this.TreeSave();
    }

    public handleNodeView(): void {
        CloudWatchLogView.Render(this.Region, this.LogGroup);
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('CloudWatchLogGroupNode', CloudWatchLogGroupNode);