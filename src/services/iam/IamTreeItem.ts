/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';

export class IamTreeItem extends WorkbenchTreeItem<any, IamTreeItem> {

	// flag accessors inherited from WorkbenchTreeItem
	public TreeItemType:TreeItemType
	public Text:string
	public IamRole:string = ""
	public Region:string = ""
	// Parent/Children provided by WorkbenchTreeItem
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

	// filtering helpers inherited from WorkbenchTreeItem
}
