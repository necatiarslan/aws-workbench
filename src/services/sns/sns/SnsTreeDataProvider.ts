/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { SnsTreeItem, TreeItemType } from './SnsTreeItem';
import { SnsTreeView } from './SnsTreeView';
import { ListSubscriptionsByTopicCommandOutput } from '@aws-sdk/client-sns';

export class SnsTreeDataProvider implements vscode.TreeDataProvider<SnsTreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<SnsTreeItem | undefined | void> = new vscode.EventEmitter<SnsTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<SnsTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	
	SnsNodeList: SnsTreeItem[] = [];

	constructor() {
		
	}

	Refresh(): void {
		if(this.SnsNodeList.length === 0){ this.LoadSnsNodeList(); }
		this._onDidChangeTreeData.fire();
	}

	AddTopic(Region:string, TopicArn:string){
		for(var item of SnsTreeView.Current.TopicList)
		{
			if(item.Region === Region && item.TopicArn === TopicArn)
			{
				return;
			}
		}
		
		SnsTreeView.Current.TopicList.push({Region: Region, TopicArn: TopicArn});
		this.AddNewSnsNode(Region, TopicArn);
		this.Refresh();
	}

	RemoveTopic(Region:string, TopicArn:string){
		for(var i=0; i<SnsTreeView.Current.TopicList.length; i++)
		{
			if(SnsTreeView.Current.TopicList[i].Region === Region && SnsTreeView.Current.TopicList[i].TopicArn === TopicArn)
			{
				SnsTreeView.Current.TopicList.splice(i, 1);
				break;
			}
		}

		this.RemoveSnsNode(Region, TopicArn);
		this.Refresh();
	}
	
	LoadSnsNodeList(){
		this.SnsNodeList = [];
		
		for(var item of SnsTreeView.Current.TopicList)
		{
			let treeItem = this.NewSnsNode(item.Region, item.TopicArn);

			this.SnsNodeList.push(treeItem);
		}
	}

	AddNewSnsNode(Region:string, TopicArn:string){
		if (this.SnsNodeList.some(item => item.Region === Region && item.TopicArn === TopicArn)) { return; }

		let treeItem = this.NewSnsNode(Region, TopicArn);
		this.SnsNodeList.push(treeItem);
	}

	RemoveSnsNode(Region:string, TopicArn:string){
		for(var i=0; i<this.SnsNodeList.length; i++)
		{
			if(this.SnsNodeList[i].Region === Region && this.SnsNodeList[i].TopicArn === TopicArn)
			{
				this.SnsNodeList.splice(i, 1);
				break;
			}
		}
	}

	GetTopicName(TopicArn:string):string{
		const topicName = TopicArn.split(":").pop();
		if(!topicName) { return TopicArn; }
		return topicName;
	}

	private NewSnsNode(Region: string, TopicArn: string) : SnsTreeItem
	{
		let topicName = this.GetTopicName(TopicArn);
		let treeItem = new SnsTreeItem(topicName, TreeItemType.Topic);
		treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		treeItem.Region = Region;
		treeItem.TopicArn = TopicArn;

		let pubItem = new SnsTreeItem("Publish", TreeItemType.PublishGroup);
		pubItem.TopicArn = treeItem.TopicArn;
		pubItem.Region = treeItem.Region;
		pubItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		pubItem.Parent = treeItem;
		treeItem.Children.push(pubItem);

		let pubJson = new SnsTreeItem("Adhoc", TreeItemType.PublishAdhoc);
		pubJson.TopicArn = treeItem.TopicArn;
		pubJson.Region = treeItem.Region;
		pubJson.Parent = pubItem;
		pubItem.Children.push(pubJson);

		for(var i=0; i<SnsTreeView.Current.MessageFilePathList.length; i++)
		{
			if(SnsTreeView.Current.MessageFilePathList[i].Region === Region 
				&& SnsTreeView.Current.MessageFilePathList[i].TopicArn === TopicArn)
			{
				this.AddNewMessagePathNode(pubItem, SnsTreeView.Current.MessageFilePathList[i].MessageFilePath);
			}
		}

		let subItem = new SnsTreeItem("Subscriptions", TreeItemType.SubscriptionGroup);
		subItem.TopicArn = treeItem.TopicArn;
		subItem.Region = treeItem.Region;
		subItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		subItem.Parent = treeItem;
		treeItem.Children.push(subItem);

		return treeItem;
	}

	AddMessageFilePath(node: SnsTreeItem, MessageFilePath:string){
		
		for(var i=0; i<SnsTreeView.Current.MessageFilePathList.length; i++)
		{
			if(SnsTreeView.Current.MessageFilePathList[i].Region === node.Region 
				&& SnsTreeView.Current.MessageFilePathList[i].TopicArn === node.TopicArn
				&& SnsTreeView.Current.MessageFilePathList[i].MessageFilePath === MessageFilePath)
			{
				return;
			}
		}
		this.AddNewMessagePathNode(node, MessageFilePath);
		SnsTreeView.Current.MessageFilePathList.push({Region: node.Region, TopicArn: node.TopicArn, MessageFilePath: MessageFilePath});
		this.Refresh();
	}

	private AddNewMessagePathNode(node: SnsTreeItem, MessageFilePath: string) {
		let fileName = MessageFilePath.split("/").pop();
		if (!fileName) { fileName = MessageFilePath; }

		let treeItem = new SnsTreeItem(fileName, TreeItemType.PublishFile);
		treeItem.Region = node.Region;
		treeItem.TopicArn = node.TopicArn;
		treeItem.MessageFilePath = MessageFilePath;
		treeItem.Parent = node;
		node.Children.push(treeItem);
	}

	RemoveMessageFilePath(node: SnsTreeItem){
		if(!node.Parent) { return; }

		for(var i=0; i<SnsTreeView.Current.MessageFilePathList.length; i++)
		{
			if(SnsTreeView.Current.MessageFilePathList[i].Region === node.Region 
				&& SnsTreeView.Current.MessageFilePathList[i].TopicArn === node.TopicArn
				&& SnsTreeView.Current.MessageFilePathList[i].MessageFilePath === node.MessageFilePath
			)
			{
				SnsTreeView.Current.MessageFilePathList.splice(i, 1);
			}
		}
		
		let parentNode = node.Parent;
		for(var i=0; i<parentNode.Children.length; i++)
		{
			if(parentNode.Children[i].Region === node.Region 
				&& parentNode.Children[i].TopicArn === node.TopicArn
				&& parentNode.Children[i].MessageFilePath === node.MessageFilePath
			)
			{
				parentNode.Children.splice(i, 1);
			}
		}
		this.Refresh();
	}

	AddSubscriptions(node: SnsTreeItem, Subscriptions: ListSubscriptionsByTopicCommandOutput) {
		node.Children = [];
		if(!Subscriptions.Subscriptions) { return; }
		for(var i=0; i<Subscriptions.Subscriptions.length; i++)
		{
			let endpoint = Subscriptions.Subscriptions[i].Endpoint;
			let protocol = Subscriptions.Subscriptions[i].Protocol;
			if(!endpoint) { continue; }

			let treeItem = new SnsTreeItem(protocol?.toUpperCase() + " : " + endpoint, TreeItemType.Subscription);
			treeItem.TopicArn = node.TopicArn;
			treeItem.Region = node.Region;
			treeItem.Parent = node;
			node.Children.push(treeItem);
		}
	}
	getChildren(node: SnsTreeItem): Thenable<SnsTreeItem[]> {
		let result:SnsTreeItem[] = [];

		if(!node)
		{
			result.push(...this.GetSnsNodes());
		}
		else if(node.Children.length > 0)
		{
			result.push(...node.Children);
		}

		return Promise.resolve(result);
	}


	GetSnsNodes(): SnsTreeItem[]{
		var result: SnsTreeItem[] = [];
		for (var node of this.SnsNodeList) {
			if (SnsTreeView.Current && SnsTreeView.Current.FilterString && !node.IsFilterStringMatch(SnsTreeView.Current.FilterString)) { continue; }
			if (SnsTreeView.Current && SnsTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (SnsTreeView.Current && !SnsTreeView.Current.isShowHiddenNodes && (node.IsHidden)) { continue; }

			result.push(node);
		}
		return result;
	}
	
	getTreeItem(element: SnsTreeItem): SnsTreeItem {
		return element;
	}
}

export enum ViewType{
	Sns = 1
}