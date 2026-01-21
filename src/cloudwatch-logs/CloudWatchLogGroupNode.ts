import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { TreeState } from '../tree/TreeState';
import { Session } from '../common/Session';
import  { CloudWatchLogView } from './CloudWatchLogView';

export class CloudWatchLogGroupNode extends NodeBase {

    constructor(LogGroup: string, parent?: NodeBase) 
    {
        super(LogGroup, parent);

        this.LogGroup = LogGroup;
        this.Icon = "cloudwatch-loggroup";

        this.EnableNodeRemove = true;
        this.EnableNodeView = true;
        this.SetContextValue();
    }

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
        CloudWatchLogView.Render(Session.Current.ExtensionUri, this.Region, this.LogGroup);
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
NodeRegistry.register('CloudWatchLogGroupNode', CloudWatchLogGroupNode);