/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';

export class SnsTreeItem extends vscode.TreeItem {
	public IsFav: boolean = false
	public TreeItemType:TreeItemType
	public Text:string
	public TopicArn:string = ""
	public TopicName:string = ""
	public Region:string = ""
	public Parent:SnsTreeItem | undefined
	public Children:SnsTreeItem[] = []
	public IsHidden: boolean = false
	public MessageFilePath: string | undefined
	public IsRunning: boolean = false;

	public SubscriptionArn:string = ""
	public Protocol:string = ""
	public Endpoint:string = ""

	constructor(text:string, treeItemType:TreeItemType) {
		super(text)
		this.Text = text
		this.TreeItemType = treeItemType
		this.refreshUI()
	}

	public refreshUI() {

		if(this.TreeItemType === TreeItemType.SNSTopic)
		{
			this.iconPath = new vscode.ThemeIcon('package'); // inbox
			this.contextValue = "Topic"
		}
		else if(this.TreeItemType === TreeItemType.SNSPublishGroup)
		{
			this.iconPath = new vscode.ThemeIcon('send');
			this.contextValue = "PublishGroup"
		}
		else if(this.TreeItemType === TreeItemType.SNSPublishAdhoc)
		{
			this.iconPath = new vscode.ThemeIcon('report');
			this.contextValue = "PublishAdhoc"
		}
		else if(this.TreeItemType === TreeItemType.SNSPublishFile)
		{
			this.iconPath = new vscode.ThemeIcon('mail');
			this.contextValue = "PublishFile"
		}
		else if(this.TreeItemType === TreeItemType.SNSSubscriptionGroup)
		{
			this.iconPath = new vscode.ThemeIcon('organization');
			this.contextValue = "SubscriptionGroup"
		}
		else if(this.TreeItemType === TreeItemType.SNSSubscription)
		{
			this.iconPath = new vscode.ThemeIcon('person');
			this.contextValue = "Subscription"
		}
		else if(this.TreeItemType === TreeItemType.SNSOther)
		{
			this.iconPath = new vscode.ThemeIcon('circle-outline');
			this.contextValue = "Other"
		}

		if(this.IsRunning)
		{
			this.iconPath = new vscode.ThemeIcon('loading~spin');
		}
	}

	public IsAnyChidrenFav(){
		return this.IsAnyChidrenFavInternal(this);
	}

	public IsAnyChidrenFavInternal(node:SnsTreeItem): boolean{
		for(var n of node.Children)
		{
			if(n.IsFav)
			{
				return true;
			}
			else if (n.Children.length > 0)
			{
				return this.IsAnyChidrenFavInternal(n);
			}
		}

		return false;
	}

	public IsFilterStringMatch(FilterString:string){
		if(this.Text.includes(FilterString))
		{
			return true;
		}

		if(this.IsFilterStringMatchAnyChildren(this, FilterString))
		{
			return true;
		}

		return false;
	}

	public IsFilterStringMatchAnyChildren(node:SnsTreeItem, FilterString:string): boolean{
		for(var n of node.Children)
		{
			if(n.Text.includes(FilterString) || n.Region?.includes(FilterString) || n.TopicArn?.includes(FilterString))
			{
				return true;
			}
			else if (n.Children.length > 0)
			{
				return this.IsFilterStringMatchAnyChildren(n, FilterString);
			}
		}

		return false;
	}
}
