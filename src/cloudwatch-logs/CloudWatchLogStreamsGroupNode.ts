import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import { CloudWatchLogStreamNode } from './CloudWatchLogStreamNode';
import { CloudWatchLogGroupNode } from './CloudWatchLogGroupNode';

export class CloudWatchLogStreamsGroupNode extends NodeBase {
    constructor(label: string, parent: NodeBase) {
        super(label, parent);
        this.Icon = "list-tree";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
    }


    async handleNodeRefresh() {
        ui.logToOutput('CloudWatchLogStreamsGroupNode.NodeRefresh Started');

        const awsResourceNode = this.GetAwsResourceNode();
        if (!(awsResourceNode instanceof CloudWatchLogGroupNode)) {
            ui.logToOutput('CloudWatchLogStreamsGroupNode.NodeRefresh - Parent CloudWatch Log Group not found');
            return;
        }

        this.StartWorking();

        // Refresh log streams from stored data in parent node
        this.Children = [];

        const logStreams = awsResourceNode.LogStreams || [];
        for (const logStreamName of logStreams) {
            const newNode = new CloudWatchLogStreamNode(logStreamName, this);
            newNode.Region = awsResourceNode.Region;
            newNode.LogGroup = awsResourceNode.LogGroup;
        }

        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }

        this.StopWorking();
        this.RefreshTree();
    }

    async handleNodeAdd() {
        ui.logToOutput('CloudWatchLogStreamsGroupNode.NodeAdd Started');

        const logGroupNode = this.GetAwsResourceNode();
        if (!(logGroupNode instanceof CloudWatchLogGroupNode)) {
            ui.logToOutput('CloudWatchLogStreamsGroupNode.NodeAdd - Parent CloudWatch Log Group not found');
            return;
        }

        const filterStringTemp = await vscode.window.showInputBox({ 
            placeHolder: 'Log Stream Name (Optional)' 
        });
        
        if (filterStringTemp === undefined) { 
            return; 
        }

        this.StartWorking();

        const resultLogStream = await api.GetLogStreams(
            logGroupNode.Region, 
            logGroupNode.LogGroup, 
            filterStringTemp
        );

        if (!resultLogStream.isSuccessful) {
            ui.showErrorMessage('Error getting Log Streams', resultLogStream.error);
            this.StopWorking();
            return;
        }

        if (!resultLogStream.result || resultLogStream.result.length === 0) {
            ui.showInfoMessage('No Log Streams Found');
            this.StopWorking();
            return;
        }

        const logStreamList: string[] = [];
        for (const ls of resultLogStream.result) {
            const date = ls.creationTime ? new Date(ls.creationTime) : new Date();
            logStreamList.push(ls.logStreamName + " (" + date.toDateString() + ")");
        }

        const selectedLogStreamList = await vscode.window.showQuickPick(logStreamList, {
            canPickMany: true, 
            placeHolder: 'Select Log Stream'
        });

        if (!selectedLogStreamList || selectedLogStreamList.length === 0) {
            this.StopWorking();
            return;
        }

        // Store log streams in parent node
        logGroupNode.LogStreams = logGroupNode.LogStreams || [];

        for (const ls of resultLogStream.result) {
            if (!ls.logStreamName) { continue; }
            const lsName: string = ls.logStreamName;
            
            if (selectedLogStreamList.find(e => e.includes(lsName))) {
                // Add to parent's log streams array if not already there
                if (!logGroupNode.LogStreams.includes(lsName || '')) {
                    logGroupNode.LogStreams.push(lsName);
                }

                // Create node
                const newNode = new CloudWatchLogStreamNode(lsName, this);
                newNode.Region = logGroupNode.Region;
                newNode.LogGroup = logGroupNode.LogGroup;
            }
        }

        logGroupNode.TreeSave();
        this.StopWorking();
        ui.showInfoMessage('Log Streams Added Successfully');
        this.RefreshTree();
    }
}
