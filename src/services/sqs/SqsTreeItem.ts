/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';

export class SqsTreeItem extends vscode.TreeItem {
	public IsFav: boolean = false
	public TreeItemType:TreeItemType
	public Text:string
	public QueueArn:string = ""
	public QueueName:string = ""
	public Region:string = ""
	public Parent:SqsTreeItem | undefined
	public Children:SqsTreeItem[] = []
	public IsHidden: boolean = false
	public MessageFilePath: string | undefined
	public IsRunning: boolean = false;
	public MessageId: string | undefined;
	public ReceiptHandle: string | undefined;
	public Body: string | undefined;	

	constructor(text:string, treeItemType:TreeItemType) {
		super(text)
		this.Text = text
		this.TreeItemType = treeItemType
		this.refreshUI()
	}

	public refreshUI() {

		if(this.TreeItemType === TreeItemType.SQSQueue)
		{
			this.iconPath = new vscode.ThemeIcon('package'); // inbox
			this.contextValue = "Queue"
		}
		else if(this.TreeItemType === TreeItemType.SQSPublishGroup)
		{
			this.iconPath = new vscode.ThemeIcon('send');
			this.contextValue = "PublishGroup"
		}
		else if(this.TreeItemType === TreeItemType.SQSPublishAdhoc)
		{
			this.iconPath = new vscode.ThemeIcon('report');
			this.contextValue = "PublishAdhoc"
		}
		else if(this.TreeItemType === TreeItemType.SQSPublishFile)
		{
			this.iconPath = new vscode.ThemeIcon('mail');
			this.contextValue = "PublishFile"
		}
		else if(this.TreeItemType === TreeItemType.SQSReceiveGroup)
		{
			this.iconPath = new vscode.ThemeIcon('inbox');
			this.contextValue = "ReceiveGroup"
		}
		else if(this.TreeItemType === TreeItemType.SQSReceivedMessage)
		{
			this.iconPath = new vscode.ThemeIcon('mail');
			this.contextValue = "ReceivedMessage"
		}
		else if(this.TreeItemType === TreeItemType.SQSDeletedMessage)
		{
			this.iconPath = new vscode.ThemeIcon('mail-read');
			this.contextValue = "DeletedMessage"
		}
		else if(this.TreeItemType === TreeItemType.SQSPolicy)
		{
			this.iconPath = new vscode.ThemeIcon('shield');
			this.contextValue = "Policy"
		}
		else
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

	public IsAnyChidrenFavInternal(node:SqsTreeItem): boolean{
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

	public IsFilterStringMatchAnyChildren(node:SqsTreeItem, FilterString:string): boolean{
		for(var n of node.Children)
		{
			if(n.Text.includes(FilterString) || n.Region?.includes(FilterString) || n.QueueArn?.includes(FilterString))
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
