import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import  { CloudWatchLogView } from './CloudWatchLogView';
import * as api from './API';
import * as ui from '../common/UI';
import { CloudWatchLogStreamNode } from './CloudWatchLogStreamNode';

export class CloudWatchLogGroupNode extends NodeBase {

    constructor(LogGroup: string, parent?: NodeBase) 
    {
        super(LogGroup, parent);

        this.LogGroup = LogGroup;
        this.Icon = "cloudwatch-loggroup";

        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;

        // Attach event handlers
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());

        this.SetContextValue();
    }

    @Serialize()
    public LogGroup: string = "";

    @Serialize()
    public Region: string = "";

    public async handleNodeAdd(): Promise<void> {


		let filterStringTemp = await vscode.window.showInputBox({ placeHolder: 'Log Stream Name (Optional)' });
		if (filterStringTemp === undefined) { return; }

		var resultLogStream = await api.GetLogStreams(this.Region, this.LogGroup, filterStringTemp);
        if (!resultLogStream.isSuccessful) {
            ui.showErrorMessage(`Error getting Log Streams`, resultLogStream.error);
            return;
        }
        if (!resultLogStream.result) {
            ui.showInfoMessage(`No Log Streams Found`);
            return;
        }
		if (resultLogStream.result && resultLogStream.result.length === 0){ ui.showInfoMessage('No Log Streams Found'); return; }


		let logStreamList:string[]=[];
		for(var ls of resultLogStream.result)
		{
            const date = ls.creationTime ? new Date(ls.creationTime) : new Date();
			logStreamList.push(ls.logStreamName + " (" + date.toDateString() + ")");
		}

		let selectedLogStreamList = await vscode.window.showQuickPick(logStreamList, {canPickMany:true, placeHolder: 'Select Log Stream'});
		if(!selectedLogStreamList || selectedLogStreamList.length === 0){ return; }

		for(var ls of resultLogStream.result)
		{
			if(!ls.logStreamName) {continue;}
			let lsName:string = ls.logStreamName;
			if(selectedLogStreamList.find(e => e.includes(lsName)))
			{
				const newNode = new CloudWatchLogStreamNode(lsName, this);
                newNode.Region = this.Region;
                newNode.LogGroup = this.LogGroup;
			}
		}
        this.TreeSave();
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