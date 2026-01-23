import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import { TreeState } from '../tree/TreeState';
import { Session } from '../common/Session';
import  { CloudWatchLogView } from './CloudWatchLogView';

export class CloudWatchLogStreamNode extends NodeBase {

    constructor(LogStream: string, parent?: NodeBase) 
    {
        super(LogStream, parent);

        this.LogStream = LogStream;
        this.Icon = "cloudwatch-logstream";

        this.EnableNodeRemove = true;
        this.EnableNodeView = true;
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;
        this.SetContextValue();
    }

    @Serialize()
    public LogStream: string = "";

    @Serialize()
    public LogGroup: string = "";

    @Serialize()
    public Region: string = "";

    public async NodeAdd(): Promise<void> {

    }

    public NodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

    public NodeRefresh(): void {
    }

    public NodeView(): void {
        CloudWatchLogView.Render(Session.Current.ExtensionUri, this.Region, this.LogGroup, this.LogStream);
    }

    public async NodeEdit(): Promise<void> {
          
    }

    public NodeRun(): void {
        
    }

    public NodeStop(): void {
    }

    public NodeOpen(): void {
    }

    public NodeInfo(): void {
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('CloudWatchLogStreamNode', CloudWatchLogStreamNode);