/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';

export class IamTreeItem extends vscode.TreeItem {
	public IsFav: boolean = false
	public TreeItemType:TreeItemType
	public Text:string
	public IamRole:string = ""
	public Region:string = ""
	public Parent:IamTreeItem | undefined
	public Children:IamTreeItem[] = []
	public IsHidden: boolean = false
	public TagKey: string | undefined;
	public TagValue: string | undefined;
	public InfoKey: string | undefined;
	public InfoValue: string | undefined;
	public PolicyName: string | undefined;
	public PolicyArn: string | undefined;
	public PolicyDocument: string | undefined;
	public TrustEntity: string | undefined;
	public IsRunning: boolean = false;

	constructor(text:string, treeItemType:TreeItemType) {
		super(text)
		this.Text = text
		this.TreeItemType = treeItemType
		this.refreshUI()
	}

	public refreshUI() {

		if(this.TreeItemType === TreeItemType.IamRole)
		{
			this.iconPath = new vscode.ThemeIcon('shield');
			this.contextValue = "IamRole"
		}
		else if(this.TreeItemType === TreeItemType.PermissionsGroup)
		{
			this.iconPath = new vscode.ThemeIcon('lock');
			this.contextValue = "PermissionsGroup"
		}
		else if(this.TreeItemType === TreeItemType.Permission)
		{
			this.iconPath = new vscode.ThemeIcon('key');
			this.contextValue = "Permission"
		}
		else if(this.TreeItemType === TreeItemType.TrustRelationshipsGroup)
		{
			this.iconPath = new vscode.ThemeIcon('references');
			this.contextValue = "TrustRelationshipsGroup"
		}
		else if(this.TreeItemType === TreeItemType.TrustRelationship)
		{
			this.iconPath = new vscode.ThemeIcon('person');
			this.contextValue = "TrustRelationship"
		}
		else if(this.TreeItemType === TreeItemType.TagsGroup)
		{
			this.iconPath = new vscode.ThemeIcon('tag');
			this.contextValue = "TagsGroup"
		}
		else if(this.TreeItemType === TreeItemType.Tag)
		{
			this.iconPath = new vscode.ThemeIcon('tag');
			this.contextValue = "Tag"
		}
		else if(this.TreeItemType === TreeItemType.InfoGroup)
		{
			this.iconPath = new vscode.ThemeIcon('info');
			this.contextValue = "InfoGroup"
		}
		else if(this.TreeItemType === TreeItemType.InfoItem)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-property');
			this.contextValue = "InfoItem"
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

	public IsAnyChidrenFavInternal(node:IamTreeItem): boolean{
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

	public IsFilterStringMatchAnyChildren(node:IamTreeItem, FilterString:string): boolean{
		for(var n of node.Children)
		{
			if(n.Text.includes(FilterString) || n.Region?.includes(FilterString) || n.IamRole?.includes(FilterString))
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

export enum TreeItemType{
	IamRole = 1,
	PermissionsGroup = 2,
	Permission = 3,
	TrustRelationshipsGroup = 4,
	TrustRelationship = 5,
	TagsGroup = 6,
	Tag = 7,
	InfoGroup = 8,
	InfoItem = 9
}