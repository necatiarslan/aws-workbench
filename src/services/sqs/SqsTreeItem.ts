/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';

export class SqsTreeItem extends vscode.TreeItem {
	private _isFav: boolean = false;
	private _isHidden: boolean = false;
	private _profileToShow: string = "";

	public set ProfileToShow(value: string) {
		this._profileToShow = value;
		this.setContextValue();
	}

	public get ProfileToShow(): string {
		return this._profileToShow;
	}

	public set IsHidden(value: boolean) {
		this._isHidden = value;
		this.setContextValue();
	}

	public get IsHidden(): boolean {
		return this._isHidden;
	}

	public set IsFav(value: boolean) {
		this._isFav = value;
		this.setContextValue();
	}

	public get IsFav(): boolean {
		return this._isFav;
	}
	public TreeItemType:TreeItemType
	public Text:string
	public QueueArn:string = ""
	public QueueName:string = ""
	public Region:string = ""
	public Parent:SqsTreeItem | undefined
	public Children:SqsTreeItem[] = []

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

	public setContextValue(){
		let contextValue = "#Type:SQS#";
		contextValue += this.IsFav ? "Fav#" : "!Fav#";
		contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
		contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";

		if(this.TreeItemType === TreeItemType.SQSQueue)
		{
			contextValue += "Queue#";
		}
		else if(this.TreeItemType === TreeItemType.SQSPublishGroup)
		{
			contextValue += "PublishGroup#";
		}
		else if(this.TreeItemType === TreeItemType.SQSPublishAdhoc)
		{
			contextValue += "PublishAdhoc#";
		}
		else if(this.TreeItemType === TreeItemType.SQSPublishFile)
		{
			contextValue += "PublishFile#";
		}
		else if(this.TreeItemType === TreeItemType.SQSReceiveGroup)
		{
			contextValue += "ReceiveGroup#";
		}
		else if(this.TreeItemType === TreeItemType.SQSReceivedMessage)
		{
			contextValue += "ReceivedMessage#";
		}
		else if(this.TreeItemType === TreeItemType.SQSDeletedMessage)
		{
			contextValue += "DeletedMessage#";
		}
		else if(this.TreeItemType === TreeItemType.SQSPolicy)
		{
			contextValue += "Policy#";
		}
		else
		{
			contextValue += "Other#";
		}

		this.contextValue = contextValue;
	}

	public refreshUI() {

		if(this.TreeItemType === TreeItemType.SQSQueue)
		{
			this.iconPath = new vscode.ThemeIcon('package'); // inbox
		}
		else if(this.TreeItemType === TreeItemType.SQSPublishGroup)
		{
			this.iconPath = new vscode.ThemeIcon('send');
		}
		else if(this.TreeItemType === TreeItemType.SQSPublishAdhoc)
		{
			this.iconPath = new vscode.ThemeIcon('report');
		}
		else if(this.TreeItemType === TreeItemType.SQSPublishFile)
		{
			this.iconPath = new vscode.ThemeIcon('mail');
		}
		else if(this.TreeItemType === TreeItemType.SQSReceiveGroup)
		{
			this.iconPath = new vscode.ThemeIcon('inbox');
		}
		else if(this.TreeItemType === TreeItemType.SQSReceivedMessage)
		{
			this.iconPath = new vscode.ThemeIcon('mail');
		}
		else if(this.TreeItemType === TreeItemType.SQSDeletedMessage)
		{
			this.iconPath = new vscode.ThemeIcon('mail-read');
		}
		else if(this.TreeItemType === TreeItemType.SQSPolicy)
		{
			this.iconPath = new vscode.ThemeIcon('shield');
		}
		else
		{
			this.iconPath = new vscode.ThemeIcon('circle-outline');
		}

		if(this.IsRunning)
		{
			this.iconPath = new vscode.ThemeIcon('loading~spin');
		}
		
		this.setContextValue();
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
