/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';

export class SnsTreeItem extends vscode.TreeItem {
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
	public TopicArn:string = ""
	public TopicName:string = ""
	public Region:string = ""
	public Parent:SnsTreeItem | undefined
	public Children:SnsTreeItem[] = []

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
