/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';

export class SnsTreeItem extends WorkbenchTreeItem<any, SnsTreeItem> {

	// flag accessors inherited from WorkbenchTreeItem
	public TreeItemType:TreeItemType
	public Text:string
	public TopicArn:string = ""
	public TopicName:string = ""
	public Region:string = ""
	// Parent/Children provided by WorkbenchTreeItem

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

	public setContextValue(){
		let contextValue = "#Type:SNS#";
		contextValue += this.IsFav ? "Fav#" : "!Fav#";
		contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
		contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";

		if(this.TreeItemType === TreeItemType.SNSTopic)
		{
			contextValue += "Topic#";
		}
		else if(this.TreeItemType === TreeItemType.SNSPublishGroup)
		{
			contextValue += "PublishGroup#";
		}
		else if(this.TreeItemType === TreeItemType.SNSPublishAdhoc)
		{
			contextValue += "PublishAdhoc#";
		}
		else if(this.TreeItemType === TreeItemType.SNSPublishFile)
		{
			contextValue += "PublishFile#";
		}
		else if(this.TreeItemType === TreeItemType.SNSSubscriptionGroup)
		{
			contextValue += "SubscriptionGroup#";
		}
		else if(this.TreeItemType === TreeItemType.SNSSubscription)
		{
			contextValue += "Subscription#";
		}
		else
		{
			contextValue += "Other#";
		}

		this.contextValue = contextValue;
	}

	public refreshUI() {

		if(this.TreeItemType === TreeItemType.SNSTopic)
		{
			this.iconPath = new vscode.ThemeIcon('package'); // inbox
		}
		else if(this.TreeItemType === TreeItemType.SNSPublishGroup)
		{
			this.iconPath = new vscode.ThemeIcon('send');
		}
		else if(this.TreeItemType === TreeItemType.SNSPublishAdhoc)
		{
			this.iconPath = new vscode.ThemeIcon('report');
		}
		else if(this.TreeItemType === TreeItemType.SNSPublishFile)
		{
			this.iconPath = new vscode.ThemeIcon('mail');
		}
		else if(this.TreeItemType === TreeItemType.SNSSubscriptionGroup)
		{
			this.iconPath = new vscode.ThemeIcon('organization');
		}
		else if(this.TreeItemType === TreeItemType.SNSSubscription)
		{
			this.iconPath = new vscode.ThemeIcon('person');
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
