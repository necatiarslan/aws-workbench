/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { SnsTreeItem } from './SnsTreeItem';
import { TreeItemType } from '../../tree/TreeItemType';
import { SnsService } from './SnsService';
import { Session } from '../../common/Session';
import * as api from './API';

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

	AddTopic(Region:string, TopicArn:string): SnsTreeItem | undefined {
		for(var item of SnsService.Instance.TopicList)
		{
			if(item.Region === Region && item.TopicArn === TopicArn)
			{
				return this.SnsNodeList.find(n => n.Region === Region && n.TopicArn === TopicArn);
			}
		}
		
		SnsService.Instance.TopicList.push({Region: Region, TopicArn: TopicArn});
		const node = this.AddNewSnsNode(Region, TopicArn);
		this.Refresh();
		return node;
	}

	RemoveTopic(Region:string, TopicArn:string){
		for(var i=0; i<SnsService.Instance.TopicList.length; i++)
		{
			if(SnsService.Instance.TopicList[i].Region === Region && SnsService.Instance.TopicList[i].TopicArn === TopicArn)
			{
				SnsService.Instance.TopicList.splice(i, 1);
				break;
			}
		}

		this.RemoveSnsNode(Region, TopicArn);
		this.Refresh();
	}
	
	LoadSnsNodeList(){
		this.SnsNodeList = [];
		if(!SnsService.Instance) return;
		
		for(var item of SnsService.Instance.TopicList)
		{
			let treeItem = this.NewSnsNode(item.Region, item.TopicArn);

			this.SnsNodeList.push(treeItem);
		}
	}

	AddNewSnsNode(Region:string, TopicArn:string): SnsTreeItem | undefined {
		if (this.SnsNodeList.some(item => item.Region === Region && item.TopicArn === TopicArn)) { 
			return this.SnsNodeList.find(n => n.Region === Region && n.TopicArn === TopicArn);
		}

		let treeItem = this.NewSnsNode(Region, TopicArn);
		this.SnsNodeList.push(treeItem);
		return treeItem;
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
		if(!TopicArn) { return "Undefined Topic"; }
		const topicName = TopicArn.split(":").pop();
		if(!topicName) { return TopicArn; }
		return topicName;
	}

	private NewSnsNode(Region: string, TopicArn: string) : SnsTreeItem
	{
		let topicName = this.GetTopicName(TopicArn);
		let treeItem = new SnsTreeItem(topicName, TreeItemType.SNSTopic);
		treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		treeItem.Region = Region;
		treeItem.TopicArn = TopicArn;

		let pubItem = new SnsTreeItem("Publish", TreeItemType.SNSPublishGroup);
		pubItem.TopicArn = treeItem.TopicArn;
		pubItem.Region = treeItem.Region;
		pubItem.collapsibleState = vscode.ThemeIcon.File === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.None; // Default to None
		pubItem.Parent = treeItem;
		treeItem.Children.push(pubItem);

		let subItem = new SnsTreeItem("Subscriptions", TreeItemType.SNSSubscriptionGroup);
		subItem.TopicArn = treeItem.TopicArn;
		subItem.Region = treeItem.Region;
		subItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		subItem.Parent = treeItem;
		treeItem.Children.push(subItem);

		return treeItem;
	}

	getChildren(node: SnsTreeItem): Thenable<SnsTreeItem[]> {
		let result:SnsTreeItem[] = [];

		if(!node)
		{
			result.push(...this.GetSnsNodes());
		}
		else if(node.TreeItemType === TreeItemType.SNSSubscriptionGroup && node.Children.length === 0)
		{
			return api.GetSubscriptions(node.Region!, node.TopicArn!).then(subs => {
				if (subs.isSuccessful && subs.result && subs.result.Subscriptions) {
					for(var sub of subs.result.Subscriptions)
					{
						let subNode = new SnsTreeItem(sub.SubscriptionArn ? sub.SubscriptionArn : "No ARN", TreeItemType.SNSSubscription);
						subNode.Region = node.Region;
						subNode.TopicArn = node.TopicArn;
						subNode.SubscriptionArn = sub.SubscriptionArn || "";
						subNode.Protocol = sub.Protocol || "";
						subNode.Endpoint = sub.Endpoint || "";
						subNode.Parent = node;
						node.Children.push(subNode);
					}
				}
				return node.Children;
			});
		}
		else if(node.Children.length > 0)
		{
			result.push(...node.Children);
		}

		return Promise.resolve(result);
	}


	GetSnsNodes(): SnsTreeItem[]{
		var result: SnsTreeItem[] = [];
		if(!SnsService.Instance) return result;
		for (var node of this.SnsNodeList) {
			if (Session.Current?.FilterString && !node.IsFilterStringMatch(Session.Current?.FilterString)) { continue; }
			if (Session.Current?.IsShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (Session.Current?.IsShowHiddenNodes && (node.IsHidden)) { continue; }

			result.push(node);
		}
		return result;
	}
	
	getTreeItem(element: SnsTreeItem): SnsTreeItem {
		return element;
	}
}