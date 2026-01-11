/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';

export class SqsTreeItem extends WorkbenchTreeItem<any, SqsTreeItem> {

	// flag accessors inherited from WorkbenchTreeItem
	public TreeItemType:TreeItemType
	public Text:string
	public QueueArn:string = ""
	public QueueName:string = ""
	public Region:string = ""
	// Parent/Children provided by WorkbenchTreeItem

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

	// filtering helpers inherited from WorkbenchTreeItem
}
