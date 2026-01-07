/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { StepFuncTreeItem, TreeItemType } from './StepFuncTreeItem';
import { StepFuncTreeView } from './StepFuncTreeView';

export class StepFuncTreeDataProvider implements vscode.TreeDataProvider<StepFuncTreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<StepFuncTreeItem | undefined | void> = new vscode.EventEmitter<StepFuncTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<StepFuncTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	
	StepFuncNodeList: StepFuncTreeItem[] = [];

	constructor() {
		
	}

	Refresh(): void {
		if(this.StepFuncNodeList.length === 0){ this.LoadStepFuncNodeList(); }
		this._onDidChangeTreeData.fire();
	}

	AddStepFunc(Region:string, StepFuncArn:string){
		for(var item of StepFuncTreeView.Current.StepFuncList)
		{
			if(item.Region === Region && item.StepFunc === StepFuncArn)
			{
				return;
			}
		}
		
		StepFuncTreeView.Current.StepFuncList.push({Region: Region, StepFunc: StepFuncArn});
		this.AddNewStepFuncNode(Region, StepFuncArn);
		this.Refresh();
	}

	RemoveStepFunc(Region:string, StepFunc:string){
		for(var i=0; i<StepFuncTreeView.Current.StepFuncList.length; i++)
		{
			if(StepFuncTreeView.Current.StepFuncList[i].Region === Region && StepFuncTreeView.Current.StepFuncList[i].StepFunc === StepFunc)
			{
				StepFuncTreeView.Current.StepFuncList.splice(i, 1);
				break;
			}
		}

		this.RemoveStepFuncNode(Region, StepFunc);
		this.Refresh();
	}
	
	AddExecutionNode(Node: StepFuncTreeItem, ExecutionArn: string) {
		let now = new Date();
		let currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
						now.getMinutes().toString().padStart(2, '0') + ':' + 
						now.getSeconds().toString().padStart(2, '0');

		let treeItem = new StepFuncTreeItem("Execution - " + currentTime, TreeItemType.Execution);
		treeItem.Region = Node.Region;
		treeItem.StepFuncArn = Node.StepFuncArn;
		treeItem.ExecutionArn = ExecutionArn
		treeItem.Parent = Node
		Node.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed
		Node.Children.push(treeItem)
		this.Refresh();
	}

	AddLogStreams(node: StepFuncTreeItem, LogStreams:string[]){
		for(var streamName of LogStreams)
		{
			if(node.Children.find((item) => item.LogStreamName === streamName)){ continue; }
			
			let treeItem = new StepFuncTreeItem(streamName, TreeItemType.LogStream);
			treeItem.Region = node.Region;
			treeItem.StepFuncArn = node.StepFuncArn;
			treeItem.LogStreamName = streamName
			treeItem.Parent = node
			node.Children.push(treeItem)
		}
		this.Refresh();
	}

	AddExecutions(node: StepFuncTreeItem, executions: any[]){
		node.Children = []; // Clear existing executions
		for(var execution of executions)
		{
			const executionName = execution.name || 'Unknown';
			const status = execution.status || 'UNKNOWN';
			const startDate = execution.startDate ? new Date(execution.startDate).toLocaleString() : '';
			
			let label = `${executionName} [${status}]`;
			if(startDate) {
				label += ` - ${startDate}`;
			}
			
			let treeItem = new StepFuncTreeItem(label, TreeItemType.Execution);
			treeItem.Region = node.Region;
			treeItem.StepFuncArn = node.StepFuncArn;
			treeItem.ExecutionArn = execution.executionArn;
			treeItem.ExecutionStatus = status;
			treeItem.Parent = node;
			node.Children.push(treeItem);
		}
		this.Refresh();
	}
	
	LoadStepFuncNodeList(){
		this.StepFuncNodeList = [];
		
		for(var item of StepFuncTreeView.Current.StepFuncList)
		{
			let treeItem = this.NewStepFuncNode(item.Region, item.StepFunc);

			this.StepFuncNodeList.push(treeItem);
		}
	}

	AddNewStepFuncNode(Region:string, StepFuncArn:string){
		if (this.StepFuncNodeList.some(item => item.Region === Region && item.StepFuncArn === StepFuncArn)) { return; }

		let treeItem = this.NewStepFuncNode(Region, StepFuncArn);
		this.StepFuncNodeList.push(treeItem);
	}

	RemoveStepFuncNode(Region:string, StepFunc:string){
		for(var i=0; i<this.StepFuncNodeList.length; i++)
		{
			if(this.StepFuncNodeList[i].Region === Region && this.StepFuncNodeList[i].StepFuncArn === StepFunc)
			{
				this.StepFuncNodeList.splice(i, 1);
				break;
			}
		}
	}

	private NewStepFuncNode(Region: string, StepFuncArn: string) : StepFuncTreeItem
	{
		let StepFuncName = StepFuncTreeItem.GetStepFuncName(StepFuncArn);
		let treeItem = new StepFuncTreeItem(StepFuncName, TreeItemType.StepFunc);
		treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		treeItem.Region = Region;
		treeItem.StepFuncArn = StepFuncArn;

		let codeItem = new StepFuncTreeItem("Code", TreeItemType.Code);
		codeItem.StepFuncArn = treeItem.StepFuncArn;
		codeItem.Region = treeItem.Region;
		codeItem.Parent = treeItem;
		codeItem.CodePath = this.GetCodePath(treeItem.Region, treeItem.StepFuncArn);
		treeItem.Children.push(codeItem);

		let triggerItem = new StepFuncTreeItem("Trigger", TreeItemType.TriggerGroup);
		triggerItem.StepFuncArn = treeItem.StepFuncArn;
		triggerItem.Region = treeItem.Region;
		triggerItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		triggerItem.Parent = treeItem;
		treeItem.Children.push(triggerItem);

		let triggerWithPayload = new StepFuncTreeItem("With Paylod", TreeItemType.TriggerWithPayload);
		triggerWithPayload.StepFuncArn = treeItem.StepFuncArn;
		triggerWithPayload.Region = treeItem.Region;
		triggerWithPayload.Parent = triggerItem;
		triggerItem.Children.push(triggerWithPayload);

		let triggerWithoutPayload = new StepFuncTreeItem("Without Paylod", TreeItemType.TriggerNoPayload);
		triggerWithoutPayload.StepFuncArn = treeItem.StepFuncArn;
		triggerWithoutPayload.Region = treeItem.Region;
		triggerWithoutPayload.Parent = triggerItem;
		triggerItem.Children.push(triggerWithoutPayload);

		for(var i=0; i<StepFuncTreeView.Current.PayloadPathList.length; i++)
		{
			if(StepFuncTreeView.Current.PayloadPathList[i].Region === Region 
				&& StepFuncTreeView.Current.PayloadPathList[i].StepFunc === StepFuncArn)
			{
				this.AddNewPayloadPathNode(triggerItem, StepFuncTreeView.Current.PayloadPathList[i].PayloadPath);
			}
		}

		let logsItem = new StepFuncTreeItem("Logs", TreeItemType.LogGroup);
		logsItem.StepFuncArn = treeItem.StepFuncArn;
		logsItem.Region = treeItem.Region;
		logsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		logsItem.Parent = treeItem;
		treeItem.Children.push(logsItem);

		let executionsItem = new StepFuncTreeItem("Executions", TreeItemType.ExecutionGroup);
		executionsItem.StepFuncArn = treeItem.StepFuncArn;
		executionsItem.Region = treeItem.Region;
		executionsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		executionsItem.Parent = treeItem;
		treeItem.Children.push(executionsItem);

		let runningExecutionsItem = new StepFuncTreeItem("Running Executions", TreeItemType.RunningExecutionGroup);
		runningExecutionsItem.StepFuncArn = treeItem.StepFuncArn;
		runningExecutionsItem.Region = treeItem.Region;
		runningExecutionsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		runningExecutionsItem.Parent = treeItem;
		treeItem.Children.push(runningExecutionsItem);

		let successfulExecutionsItem = new StepFuncTreeItem("Successful Executions", TreeItemType.SuccessfulExecutionGroup);
		successfulExecutionsItem.StepFuncArn = treeItem.StepFuncArn;
		successfulExecutionsItem.Region = treeItem.Region;
		successfulExecutionsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		successfulExecutionsItem.Parent = treeItem;
		treeItem.Children.push(successfulExecutionsItem);

		let failedExecutionsItem = new StepFuncTreeItem("Failed Executions", TreeItemType.FailedExecutionGroup);
		failedExecutionsItem.StepFuncArn = treeItem.StepFuncArn;
		failedExecutionsItem.Region = treeItem.Region;
		failedExecutionsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		failedExecutionsItem.Parent = treeItem;
		treeItem.Children.push(failedExecutionsItem);
		
		return treeItem;
	}

	AddPayloadPath(node: StepFuncTreeItem, PayloadPath:string){
		
		for(var i=0; i<StepFuncTreeView.Current.PayloadPathList.length; i++)
		{
			if(StepFuncTreeView.Current.PayloadPathList[i].Region === node.Region 
				&& StepFuncTreeView.Current.CodePathList[i].StepFunc === node.StepFuncArn
				&& StepFuncTreeView.Current.PayloadPathList[i].PayloadPath === PayloadPath)
			{
				return;
			}
		}
		this.AddNewPayloadPathNode(node, PayloadPath);
		StepFuncTreeView.Current.PayloadPathList.push({Region: node.Region, StepFunc: node.StepFuncArn, PayloadPath: PayloadPath});
		this.Refresh();
	}

	private AddNewPayloadPathNode(node: StepFuncTreeItem, PayloadPath: string) {
		let fileName = PayloadPath.split("/").pop();
		if (!fileName) { fileName = PayloadPath; }

		let treeItem = new StepFuncTreeItem(fileName, TreeItemType.TriggerFilePayload);
		treeItem.Region = node.Region;
		treeItem.StepFuncArn = node.StepFuncArn;
		treeItem.PayloadPath = PayloadPath;
		treeItem.Parent = node;
		node.Children.push(treeItem);
	}

	RemovePayloadPath(node: StepFuncTreeItem){
		if(!node.Parent) { return; }

		for(var i=0; i<StepFuncTreeView.Current.PayloadPathList.length; i++)
		{
			if(StepFuncTreeView.Current.PayloadPathList[i].Region === node.Region 
				&& StepFuncTreeView.Current.PayloadPathList[i].StepFunc === node.StepFuncArn
				&& StepFuncTreeView.Current.PayloadPathList[i].PayloadPath === node.PayloadPath
			)
			{
				StepFuncTreeView.Current.PayloadPathList.splice(i, 1);
			}
		}
		
		let parentNode = node.Parent;
		for(var i=0; i<parentNode.Children.length; i++)
		{
			if(parentNode.Children[i].Region === node.Region 
				&& parentNode.Children[i].StepFuncArn === node.StepFuncArn
				&& parentNode.Children[i].PayloadPath === node.PayloadPath
			)
			{
				parentNode.Children.splice(i, 1);
			}
		}
		this.Refresh();
	}

	AddCodePath(Region:string, StepFunc:string, CodePath:string){
		//remove old
		for(var i=0; i<StepFuncTreeView.Current.CodePathList.length; i++)
		{
			if(StepFuncTreeView.Current.CodePathList[i].Region === Region && StepFuncTreeView.Current.CodePathList[i].StepFunc === StepFunc)
			{
				StepFuncTreeView.Current.CodePathList.splice(i, 1);
			}
		}
		
		StepFuncTreeView.Current.CodePathList.push({Region: Region, StepFunc: StepFunc, CodePath: CodePath});
		this.Refresh();
	}

	RemoveCodePath(Region:string, StepFunc:string){
		for(var i=0; i<StepFuncTreeView.Current.CodePathList.length; i++)
		{
			if(StepFuncTreeView.Current.CodePathList[i].Region === Region && StepFuncTreeView.Current.CodePathList[i].StepFunc === StepFunc)
			{
				StepFuncTreeView.Current.CodePathList.splice(i, 1);
			}
		}
		this.Refresh();
	}

	GetCodePath(Region:string, StepFunc:string){
		for(var item of StepFuncTreeView.Current.CodePathList)
		{
			if(item.Region === Region && item.StepFunc === StepFunc)
			{
				return item.CodePath;
			}
		}
		return "";
	}

	getChildren(node: StepFuncTreeItem): Thenable<StepFuncTreeItem[]> {
		let result:StepFuncTreeItem[] = [];

		if(!node)
		{
			result.push(...this.GetStepFuncNodes());
		}
		else if(node.Children.length > 0)
		{
			result.push(...node.Children);
		}

		return Promise.resolve(result);
	}


	GetStepFuncNodes(): StepFuncTreeItem[]{
		var result: StepFuncTreeItem[] = [];
		for (var node of this.StepFuncNodeList) {
			if (StepFuncTreeView.Current && StepFuncTreeView.Current.FilterString && !node.IsFilterStringMatch(StepFuncTreeView.Current.FilterString)) { continue; }
			if (StepFuncTreeView.Current && StepFuncTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (StepFuncTreeView.Current && !StepFuncTreeView.Current.isShowHiddenNodes && (node.IsHidden)) { continue; }

			result.push(node);
		}
		return result;
	}
	
	getTreeItem(element: StepFuncTreeItem): StepFuncTreeItem {
		return element;
	}
}

export enum ViewType{
	StepFunc = 1
}