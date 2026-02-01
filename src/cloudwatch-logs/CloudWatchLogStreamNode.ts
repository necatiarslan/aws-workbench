import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import { Session } from '../common/Session';
import  { CloudWatchLogView } from './CloudWatchLogView';

export class CloudWatchLogStreamNode extends NodeBase {

    constructor(LogStream: string, parent?: NodeBase) 
    {
        super(LogStream, parent);

        this.LogStream = LogStream;
        this.Icon = "cloudwatch-logstream";

        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;

        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());

        this.SetContextValue();
    }

    @Serialize()
    public LogStream: string = "";

    @Serialize()
    public LogGroup: string = "";

    @Serialize()
    public Region: string = "";

    public handleNodeRemove(): void {
        this.Remove();
        this.TreeSave();
    }

    public handleNodeView(): void {
        CloudWatchLogView.Render(this.Region, this.LogGroup, this.LogStream);
    }

}