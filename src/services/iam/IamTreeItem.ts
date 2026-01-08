/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';

export class IamTreeItem extends vscode.TreeItem {
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
	public IamRole:string = ""
	public Region:string = ""
	public Parent:IamTreeItem | undefined
	public Children:IamTreeItem[] = []
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

	public setContextValue(){
		let contextValue = "#Type:IAM#";
		contextValue += this.IsFav ? "Fav#" : "!Fav#";
		contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
		contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";

		if(this.TreeItemType === TreeItemType.IAMRole)
		{
			contextValue += "IamRole#";
		}
		else if(this.TreeItemType === TreeItemType.IAMPermissionsGroup)
		{
			contextValue += "PermissionsGroup#";
		}
		else if(this.TreeItemType === TreeItemType.IAMPermission)
		{
			contextValue += "Permission#";
		}
		else if(this.TreeItemType === TreeItemType.IAMTrustRelationshipsGroup)
		{
			contextValue += "TrustRelationshipsGroup#";
		}
		else if(this.TreeItemType === TreeItemType.IAMTrustRelationship)
		{
			contextValue += "TrustRelationship#";
		}
		else if(this.TreeItemType === TreeItemType.IAMTagsGroup)
		{
			contextValue += "TagsGroup#";
		}
		else if(this.TreeItemType === TreeItemType.IAMTag)
		{
			contextValue += "Tag#";
		}
		else if(this.TreeItemType === TreeItemType.IAMInfoGroup)
		{
			contextValue += "InfoGroup#";
		}
		else if(this.TreeItemType === TreeItemType.IAMInfoItem)
		{
			contextValue += "InfoItem#";
		}
		else
		{
			contextValue += "Other#";
		}

		this.contextValue = contextValue;
	}

	public refreshUI() {

		if(this.TreeItemType === TreeItemType.IAMRole)
		{
			this.iconPath = new vscode.ThemeIcon('shield');
		}
		else if(this.TreeItemType === TreeItemType.IAMPermissionsGroup)
		{
			this.iconPath = new vscode.ThemeIcon('lock');
		}
		else if(this.TreeItemType === TreeItemType.IAMPermission)
		{
			this.iconPath = new vscode.ThemeIcon('key');
		}
		else if(this.TreeItemType === TreeItemType.IAMTrustRelationshipsGroup)
		{
			this.iconPath = new vscode.ThemeIcon('references');
		}
		else if(this.TreeItemType === TreeItemType.IAMTrustRelationship)
		{
			this.iconPath = new vscode.ThemeIcon('person');
		}
		else if(this.TreeItemType === TreeItemType.IAMTagsGroup)
		{
			this.iconPath = new vscode.ThemeIcon('tag');
		}
		else if(this.TreeItemType === TreeItemType.IAMTag)
		{
			this.iconPath = new vscode.ThemeIcon('tag');
		}
		else if(this.TreeItemType === TreeItemType.IAMInfoGroup)
		{
			this.iconPath = new vscode.ThemeIcon('info');
		}
		else if(this.TreeItemType === TreeItemType.IAMInfoItem)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-property');
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
