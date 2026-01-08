/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { LambdaTreeItem } from './LambdaTreeItem';
import { TreeItemType } from '../../tree/TreeItemType';
import { LambdaService } from './LambdaService';

export class LambdaTreeDataProvider implements vscode.TreeDataProvider<LambdaTreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<LambdaTreeItem | undefined | void> = new vscode.EventEmitter<LambdaTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<LambdaTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	
	LambdaNodeList: LambdaTreeItem[] = [];

	constructor() {
		
	}

	Refresh(): void {
		if(this.LambdaNodeList.length === 0){ this.LoadLambdaNodeList(); }
		this._onDidChangeTreeData.fire();
	}

	AddLambda(Region:string, Lambda:string): LambdaTreeItem | undefined {
		for(var item of LambdaService.Instance.LambdaList)
		{
			if(item.Region === Region && item.Lambda === Lambda)
			{
				return this.LambdaNodeList.find(n => n.Region === Region && n.Lambda === Lambda);
			}
		}
		
		LambdaService.Instance.LambdaList.push({Region: Region, Lambda: Lambda});
		const node = this.AddNewLambdaNode(Region, Lambda);
		this.Refresh();
		return node;
	}

	RemoveLambda(Region:string, Lambda:string){
		for(var i=0; i<LambdaService.Instance.LambdaList.length; i++)
		{
			if(LambdaService.Instance.LambdaList[i].Region === Region && LambdaService.Instance.LambdaList[i].Lambda === Lambda)
			{
				LambdaService.Instance.LambdaList.splice(i, 1);
				break;
			}
		}

		this.RemoveLambdaNode(Region, Lambda);
		this.Refresh();
	}
	
	AddResponsePayload(node: LambdaTreeItem, payloadString: string) {
		let now = new Date();
		let currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
						now.getMinutes().toString().padStart(2, '0') + ':' + 
						now.getSeconds().toString().padStart(2, '0');

		let treeItem = new LambdaTreeItem("Response - " + currentTime, TreeItemType.LambdaResponsePayload);
		treeItem.Region = node.Region;
		treeItem.Lambda = node.Lambda;
		treeItem.ResponsePayload = payloadString
		treeItem.Parent = node
		node.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed
		node.Children.push(treeItem)
		this.Refresh();
	}

	AddLogStreams(node: LambdaTreeItem, LogStreams:string[]){
		for(var streamName of LogStreams)
		{
			if(node.Children.find((item) => item.LogStreamName === streamName)){ continue; }
			
			let treeItem = new LambdaTreeItem(streamName, TreeItemType.LambdaLogStream);
			treeItem.Region = node.Region;
			treeItem.Lambda = node.Lambda;
			treeItem.LogStreamName = streamName
			treeItem.Parent = node
			node.Children.push(treeItem)
		}
		this.Refresh();
	}
	LoadLambdaNodeList(){
		this.LambdaNodeList = [];
		if(!LambdaService.Instance) return;
		
		for(var item of LambdaService.Instance.LambdaList)
		{
			let treeItem = this.NewLambdaNode(item.Region, item.Lambda);

			this.LambdaNodeList.push(treeItem);
		}
	}

	AddNewLambdaNode(Region:string, Lambda:string): LambdaTreeItem | undefined {
		if (this.LambdaNodeList.some(item => item.Region === Region && item.Lambda === Lambda)) { 
			return this.LambdaNodeList.find(n => n.Region === Region && n.Lambda === Lambda);
		}

		let treeItem = this.NewLambdaNode(Region, Lambda);
		this.LambdaNodeList.push(treeItem);
		return treeItem;
	}

	RemoveLambdaNode(Region:string, Lambda:string){
		for(var i=0; i<this.LambdaNodeList.length; i++)
		{
			if(this.LambdaNodeList[i].Region === Region && this.LambdaNodeList[i].Lambda === Lambda)
			{
				this.LambdaNodeList.splice(i, 1);
				break;
			}
		}
	}

	private NewLambdaNode(Region: string, Lambda: string) : LambdaTreeItem
	{
		let treeItem = new LambdaTreeItem(Lambda, TreeItemType.LambdaFunction);
		treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		treeItem.Region = Region;
		treeItem.Lambda = Lambda;

		let codeItem = new LambdaTreeItem("Code", TreeItemType.LambdaCode);
		codeItem.Lambda = treeItem.Lambda;
		codeItem.Region = treeItem.Region;
		codeItem.Parent = treeItem;
		codeItem.CodePath = this.GetCodePath(treeItem.Region, treeItem.Lambda);
		treeItem.Children.push(codeItem);

		let triggerItem = new LambdaTreeItem("Trigger", TreeItemType.LambdaTriggerGroup);
		triggerItem.Lambda = treeItem.Lambda;
		triggerItem.Region = treeItem.Region;
		triggerItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		triggerItem.Parent = treeItem;
		treeItem.Children.push(triggerItem);

		let triggerWithPayload = new LambdaTreeItem("With Paylod", TreeItemType.LambdaTriggerWithPayload);
		triggerWithPayload.Lambda = treeItem.Lambda;
		triggerWithPayload.Region = treeItem.Region;
		triggerWithPayload.Parent = triggerItem;
		triggerItem.Children.push(triggerWithPayload);

		let triggerWithoutPayload = new LambdaTreeItem("Without Paylod", TreeItemType.LambdaTriggerNoPayload);
		triggerWithoutPayload.Lambda = treeItem.Lambda;
		triggerWithoutPayload.Region = treeItem.Region;
		triggerWithoutPayload.Parent = triggerItem;
		triggerItem.Children.push(triggerWithoutPayload);

		for(var i=0; i<LambdaService.Instance.PayloadPathList.length; i++)
		{
			if(LambdaService.Instance.PayloadPathList[i].Region === Region 
				&& LambdaService.Instance.PayloadPathList[i].Lambda === Lambda)
			{
				this.AddNewPayloadPathNode(triggerItem, LambdaService.Instance.PayloadPathList[i].PayloadPath);
			}
		}

		let logsItem = new LambdaTreeItem("Logs", TreeItemType.LambdaLogGroup);
		logsItem.Lambda = treeItem.Lambda;
		logsItem.Region = treeItem.Region;
		logsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		logsItem.Parent = treeItem;
		treeItem.Children.push(logsItem);

		// Add Environment Variables Group
		let envVarsItem = new LambdaTreeItem("Environment Variables", TreeItemType.LambdaEnvironmentVariableGroup);
		envVarsItem.Lambda = treeItem.Lambda;
		envVarsItem.Region = treeItem.Region;
		envVarsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		envVarsItem.Parent = treeItem;
		treeItem.Children.push(envVarsItem);

		// Add Tags Group
		let tagsItem = new LambdaTreeItem("Tags", TreeItemType.LambdaTagsGroup);
		tagsItem.Lambda = treeItem.Lambda;
		tagsItem.Region = treeItem.Region;
		tagsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		tagsItem.Parent = treeItem;
		treeItem.Children.push(tagsItem);

		// Add Info Group
		let infoItem = new LambdaTreeItem("Info", TreeItemType.LambdaInfoGroup);
		infoItem.Lambda = treeItem.Lambda;
		infoItem.Region = treeItem.Region;
		infoItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		infoItem.Parent = treeItem;
		treeItem.Children.push(infoItem);

		return treeItem;
	}

	AddPayloadPath(node: LambdaTreeItem, PayloadPath:string){
		
		for(var i=0; i<LambdaService.Instance.PayloadPathList.length; i++)
		{
			if(LambdaService.Instance.PayloadPathList[i].Region === node.Region 
				&& LambdaService.Instance.CodePathList[i].Lambda === node.Lambda
				&& LambdaService.Instance.PayloadPathList[i].PayloadPath === PayloadPath)
			{
				return;
			}
		}
		this.AddNewPayloadPathNode(node, PayloadPath);
		LambdaService.Instance.PayloadPathList.push({Region: node.Region, Lambda: node.Lambda, PayloadPath: PayloadPath});
		this.Refresh();
	}

	private AddNewPayloadPathNode(node: LambdaTreeItem, PayloadPath: string) {
		let fileName = PayloadPath.split("/").pop();
		if (!fileName) { fileName = PayloadPath; }

		let treeItem = new LambdaTreeItem(fileName, TreeItemType.LambdaTriggerFilePayload);
		treeItem.Region = node.Region;
		treeItem.Lambda = node.Lambda;
		treeItem.PayloadPath = PayloadPath;
		treeItem.Parent = node;
		node.Children.push(treeItem);
	}

	RemovePayloadPath(node: LambdaTreeItem){
		if(!node.Parent) { return; }

		for(var i=0; i<LambdaService.Instance.PayloadPathList.length; i++)
		{
			if(LambdaService.Instance.PayloadPathList[i].Region === node.Region 
				&& LambdaService.Instance.PayloadPathList[i].Lambda === node.Lambda
				&& LambdaService.Instance.PayloadPathList[i].PayloadPath === node.PayloadPath
			)
			{
				LambdaService.Instance.PayloadPathList.splice(i, 1);
			}
		}
		
		let parentNode = node.Parent;
		for(var i=0; i<parentNode.Children.length; i++)
		{
			if(parentNode.Children[i].Region === node.Region 
				&& parentNode.Children[i].Lambda === node.Lambda
				&& parentNode.Children[i].PayloadPath === node.PayloadPath
			)
			{
				parentNode.Children.splice(i, 1);
			}
		}
		this.Refresh();
	}

	AddCodePath(Region:string, Lambda:string, CodePath:string){
		//remove old
		for(var i=0; i<LambdaService.Instance.CodePathList.length; i++)
		{
			if(LambdaService.Instance.CodePathList[i].Region === Region && LambdaService.Instance.CodePathList[i].Lambda === Lambda)
			{
				LambdaService.Instance.CodePathList.splice(i, 1);
			}
		}
		
		LambdaService.Instance.CodePathList.push({Region: Region, Lambda: Lambda, CodePath: CodePath});
		this.Refresh();
	}

	RemoveCodePath(Region:string, Lambda:string){
		for(var i=0; i<LambdaService.Instance.CodePathList.length; i++)
		{
			if(LambdaService.Instance.CodePathList[i].Region === Region && LambdaService.Instance.CodePathList[i].Lambda === Lambda)
			{
				LambdaService.Instance.CodePathList.splice(i, 1);
			}
		}
		this.Refresh();
	}

	GetCodePath(Region:string, Lambda:string){
		if(!LambdaService.Instance) return "";
		for(var item of LambdaService.Instance.CodePathList)
		{
			if(item.Region === Region && item.Lambda === Lambda)
			{
				return item.CodePath;
			}
		}
		return "";
	}

	getChildren(node: LambdaTreeItem): Thenable<LambdaTreeItem[]> {
		let result:LambdaTreeItem[] = [];

		if(!node)
		{
			result.push(...this.GetLambdaNodes());
		}
		else if(node.TreeItemType === TreeItemType.LambdaEnvironmentVariableGroup && node.Children.length === 0)
		{
			// Auto-load environment variables when the node is expanded
			LambdaService.Instance.LoadEnvironmentVariables(node);
		}
		else if(node.TreeItemType === TreeItemType.LambdaTagsGroup && node.Children.length === 0)
		{
			// Auto-load tags when the node is expanded
			LambdaService.Instance.LoadTags(node);
		}
		else if(node.TreeItemType === TreeItemType.LambdaInfoGroup && node.Children.length === 0)
		{
			// Auto-load info when the node is expanded
			LambdaService.Instance.LoadInfo(node);
		}
		else if(node.Children.length > 0)
		{
			result.push(...node.Children);
		}

		return Promise.resolve(result);
	}


	GetLambdaNodes(): LambdaTreeItem[]{
		var result: LambdaTreeItem[] = [];
		if(!LambdaService.Instance) return result;
		for (var node of this.LambdaNodeList) {
			if (LambdaService.Instance.FilterString && !node.IsFilterStringMatch(LambdaService.Instance.FilterString)) { continue; }
			if (LambdaService.Instance.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (LambdaService.Instance.isShowHiddenNodes && (node.IsHidden)) { continue; }

			result.push(node);
		}
		return result;
	}
	
	getTreeItem(element: LambdaTreeItem): LambdaTreeItem {
		return element;
	}
}

export enum ViewType{
	Lambda = 1
}