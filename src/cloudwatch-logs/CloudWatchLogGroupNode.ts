import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import { CloudWatchLogView } from './CloudWatchLogView';
import { CloudWatchLogTagsGroupNode } from './CloudWatchLogTagsGroupNode';
import { CloudWatchLogStreamsGroupNode } from './CloudWatchLogStreamsGroupNode';
import { CloudWatchLogInfoGroupNode } from './CloudWatchLogInfoGroupNode';
import { LogGroup } from '@aws-sdk/client-cloudwatch-logs';
import * as vscode from 'vscode';

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

    private _info: LogGroup | undefined = undefined;

    public get Info(): Promise<LogGroup | undefined> {
        return this.getInfo();
    }

    private async getInfo(): Promise<LogGroup | undefined> {
        if(!this._info) {
            const api = await import('./API');
            const ui = await import('../common/UI');

            const response = await api.GetLogGroupInfo(this.Region, this.LogGroup);
            if (response.isSuccessful) {
                this._info = response.result;
            } else {
                ui.logToOutput('api.GetLogGroupInfo Error !!!', response.error);
                ui.showErrorMessage('Get Log Group Info Error !!!', response.error);
            }
        }
        return this._info;
    }

    public async LoadDefaultChildren(): Promise<void> {
        new CloudWatchLogInfoGroupNode("Info", this);
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