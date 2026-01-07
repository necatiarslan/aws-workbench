/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { SqsTreeItem, TreeItemType } from './SqsTreeItem';
import { SqsTreeView } from './SqsTreeView';
import * as api from '../common/API';
// Import the Message type from the appropriate module
import type { Message } from "@aws-sdk/client-sqs";

export class SqsTreeDataProvider implements vscode.TreeDataProvider<SqsTreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<SqsTreeItem | undefined | void> = new vscode.EventEmitter<SqsTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<SqsTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	
	SqsNodeList: SqsTreeItem[] = [];

	constructor() {
		
	}

	Refresh(): void {
		if(this.SqsNodeList.length === 0){ this.LoadSqsNodeList(); }
		this._onDidChangeTreeData.fire();
	}

	AddQueue(Region:string, QueueArn:string){
		for(var item of SqsTreeView.Current.QueueList)
		{
			if(item.Region === Region && item.QueueArn === QueueArn)
			{
				return;
			}
		}
		
		SqsTreeView.Current.QueueList.push({Region: Region, QueueArn: QueueArn});
		this.AddNewSqsNode(Region, QueueArn);
		this.Refresh();
	}

	RemoveQueue(Region:string, QueueArn:string){
		for(var i=0; i<SqsTreeView.Current.QueueList.length; i++)
		{
			if(SqsTreeView.Current.QueueList[i].Region === Region && SqsTreeView.Current.QueueList[i].QueueArn === QueueArn)
			{
				SqsTreeView.Current.QueueList.splice(i, 1);
				break;
			}
		}

		this.RemoveSqsNode(Region, QueueArn);
		this.Refresh();
	}
	
	LoadSqsNodeList(){
		this.SqsNodeList = [];
		
		for(var item of SqsTreeView.Current.QueueList)
		{
			let treeItem = this.NewSqsNode(item.Region, item.QueueArn);

			this.SqsNodeList.push(treeItem);
		}
	}

	AddNewSqsNode(Region:string, QueueArn:string){
		if (this.SqsNodeList.some(item => item.Region === Region && item.QueueArn === QueueArn)) { return; }

		let treeItem = this.NewSqsNode(Region, QueueArn);
		this.SqsNodeList.push(treeItem);
	}

	AddNewReceivedMessageNode(Node:SqsTreeItem, Region:string, QueueArn:string, Message:Message){
		let msgId = Message.MessageId ? Message.MessageId : "Undefined MessageId";
		let receiptHandle = Message.ReceiptHandle ? Message.ReceiptHandle : "Undefined ReceiptHandle";
		let body = Message.Body ? Message.Body : "Undefined Body";

		let treeItem = new SqsTreeItem(msgId, TreeItemType.ReceivedMessage);
		treeItem.Region = Region;
		treeItem.QueueArn = QueueArn;
		treeItem.MessageId = msgId;
		treeItem.ReceiptHandle = receiptHandle;
		treeItem.Body = body;
		treeItem.Parent = Node;
		Node.Children.push(treeItem);

		this.Refresh();
	}

	RemoveSqsNode(Region:string, QueueArn:string){
		for(var i=0; i<this.SqsNodeList.length; i++)
		{
			if(this.SqsNodeList[i].Region === Region && this.SqsNodeList[i].QueueArn === QueueArn)
			{
				this.SqsNodeList.splice(i, 1);
				break;
			}
		}
	}

	GetQueueName(QueueArn:string):string{
		if(!QueueArn) { return "Undefined Queue"; }
		const queueName = QueueArn.split("/").pop();
		if(!queueName) { return QueueArn; }
		return queueName;
	}

	private NewSqsNode(Region: string, QueueArn: string) : SqsTreeItem
	{
		let queueName = this.GetQueueName(QueueArn);
		let treeItem = new SqsTreeItem(queueName, TreeItemType.Queue);
		treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		treeItem.Region = Region;
		treeItem.QueueArn = QueueArn;

		let detailGroup = new SqsTreeItem("Details", TreeItemType.DetailGroup);
		detailGroup.QueueArn = treeItem.QueueArn;
		detailGroup.Region = treeItem.Region;
		detailGroup.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		detailGroup.Parent = treeItem;
		treeItem.Children.push(detailGroup);

		let policy = new SqsTreeItem("Policy", TreeItemType.Policy);
		policy.QueueArn = treeItem.QueueArn;
		policy.Region = treeItem.Region;
		policy.collapsibleState = vscode.TreeItemCollapsibleState.None;
		policy.Parent = treeItem;
		treeItem.Children.push(policy);

		let pubItem = new SqsTreeItem("Send", TreeItemType.PublishGroup);
		pubItem.QueueArn = treeItem.QueueArn;
		pubItem.Region = treeItem.Region;
		pubItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		pubItem.Parent = treeItem;
		treeItem.Children.push(pubItem);

		let pubJson = new SqsTreeItem("Adhoc", TreeItemType.PublishAdhoc);
		pubJson.QueueArn = treeItem.QueueArn;
		pubJson.Region = treeItem.Region;
		pubJson.Parent = pubItem;
		pubItem.Children.push(pubJson);

		for(var i=0; i<SqsTreeView.Current.MessageFilePathList.length; i++)
		{
			if(SqsTreeView.Current.MessageFilePathList[i].Region === Region 
				&& SqsTreeView.Current.MessageFilePathList[i].QueueArn === QueueArn)
			{
				this.AddNewMessagePathNode(pubItem, SqsTreeView.Current.MessageFilePathList[i].MessageFilePath);
			}
		}

		let subItem = new SqsTreeItem("Receive", TreeItemType.ReceiveGroup);
		subItem.QueueArn = treeItem.QueueArn;
		subItem.Region = treeItem.Region;
		subItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		subItem.Parent = treeItem;
		treeItem.Children.push(subItem);

		//call API.GetQueueDetails
		api.GetQueueDetails(Region, QueueArn).then(details => {
			for (let [key, value] of Object.entries(details)) {
				let detailItem = new SqsTreeItem(`${key}: ${value}`, TreeItemType.DetailItem);
				detailItem.QueueArn = treeItem.QueueArn;
				detailItem.Region = treeItem.Region;
				detailItem.Parent = detailGroup;
				detailGroup.Children.push(detailItem);
			}
		});

		return treeItem;
	}

	AddMessageFilePath(node: SqsTreeItem, MessageFilePath:string){
		
		for(var i=0; i<SqsTreeView.Current.MessageFilePathList.length; i++)
		{
			if(SqsTreeView.Current.MessageFilePathList[i].Region === node.Region 
				&& SqsTreeView.Current.MessageFilePathList[i].QueueArn === node.QueueArn
				&& SqsTreeView.Current.MessageFilePathList[i].MessageFilePath === MessageFilePath)
			{
				return;
			}
		}
		this.AddNewMessagePathNode(node, MessageFilePath);
		SqsTreeView.Current.MessageFilePathList.push({Region: node.Region, QueueArn: node.QueueArn, MessageFilePath: MessageFilePath});
		this.Refresh();
	}

	private AddNewMessagePathNode(node: SqsTreeItem, MessageFilePath: string) {
		let fileName = MessageFilePath.split("/").pop();
		if (!fileName) { fileName = MessageFilePath; }

		let treeItem = new SqsTreeItem(fileName, TreeItemType.PublishFile);
		treeItem.Region = node.Region;
		treeItem.QueueArn = node.QueueArn;
		treeItem.MessageFilePath = MessageFilePath;
		treeItem.Parent = node;
		node.Children.push(treeItem);
	}

	RemoveMessageFilePath(node: SqsTreeItem){
		if(!node.Parent) { return; }

		for(var i=0; i<SqsTreeView.Current.MessageFilePathList.length; i++)
		{
			if(SqsTreeView.Current.MessageFilePathList[i].Region === node.Region 
				&& SqsTreeView.Current.MessageFilePathList[i].QueueArn === node.QueueArn
				&& SqsTreeView.Current.MessageFilePathList[i].MessageFilePath === node.MessageFilePath
			)
			{
				SqsTreeView.Current.MessageFilePathList.splice(i, 1);
			}
		}
		
		let parentNode = node.Parent;
		for(var i=0; i<parentNode.Children.length; i++)
		{
			if(parentNode.Children[i].Region === node.Region 
				&& parentNode.Children[i].QueueArn === node.QueueArn
				&& parentNode.Children[i].MessageFilePath === node.MessageFilePath
			)
			{
				parentNode.Children.splice(i, 1);
			}
		}
		this.Refresh();
	}

	getChildren(node: SqsTreeItem): Thenable<SqsTreeItem[]> {
		let result:SqsTreeItem[] = [];

		if(!node)
		{
			result.push(...this.GetSqsNodes());
		}
		else if(node.Children.length > 0)
		{
			result.push(...node.Children);
		}

		return Promise.resolve(result);
	}


	GetSqsNodes(): SqsTreeItem[]{
		var result: SqsTreeItem[] = [];
		for (var node of this.SqsNodeList) {
			if (SqsTreeView.Current && SqsTreeView.Current.FilterString && !node.IsFilterStringMatch(SqsTreeView.Current.FilterString)) { continue; }
			if (SqsTreeView.Current && SqsTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (SqsTreeView.Current && !SqsTreeView.Current.isShowHiddenNodes && (node.IsHidden)) { continue; }

			result.push(node);
		}
		return result;
	}
	
	getTreeItem(element: SqsTreeItem): SqsTreeItem {
		return element;
	}
}

export enum ViewType{
	Sqs = 1
}