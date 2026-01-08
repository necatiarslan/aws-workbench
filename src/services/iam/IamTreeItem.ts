/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';

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

		if(this.TreeItemType === TreeItemType.IAMRole)
		{
			this.iconPath = new vscode.ThemeIcon('shield');
			this.contextValue = "IamRole"
		}
		else if(this.TreeItemType === TreeItemType.IAMPermissionsGroup)
		{
			this.iconPath = new vscode.ThemeIcon('lock');
			this.contextValue = "PermissionsGroup"
		}
		else if(this.TreeItemType === TreeItemType.IAMPermission)
		{
			this.iconPath = new vscode.ThemeIcon('key');
			this.contextValue = "Permission"
		}
		else if(this.TreeItemType === TreeItemType.IAMTrustRelationshipsGroup)
		{
			this.iconPath = new vscode.ThemeIcon('references');
			this.contextValue = "TrustRelationshipsGroup"
		}
		else if(this.TreeItemType === TreeItemType.IAMTrustRelationship)
		{
			this.iconPath = new vscode.ThemeIcon('person');
			this.contextValue = "TrustRelationship"
		}
		else if(this.TreeItemType === TreeItemType.IAMTagsGroup)
		{
			this.iconPath = new vscode.ThemeIcon('tag');
			this.contextValue = "TagsGroup"
		}
		else if(this.TreeItemType === TreeItemType.IAMTag)
		{
			this.iconPath = new vscode.ThemeIcon('tag');
			this.contextValue = "Tag"
		}
		else if(this.TreeItemType === TreeItemType.IAMInfoGroup)
		{
			this.iconPath = new vscode.ThemeIcon('info');
			this.contextValue = "InfoGroup"
		}
		else if(this.TreeItemType === TreeItemType.IAMInfoItem)
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
