/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';

export class S3TreeItem extends WorkbenchTreeItem<any, S3TreeItem> {
	public TreeItemType:TreeItemType;
	public Text:string;
	public Bucket:string | undefined;
	public Shortcut:string | undefined;

	// flag accessors inherited from WorkbenchTreeItem

	constructor(text:string, treeItemType:TreeItemType) {
		super(text);
		this.Text = text;
		this.TreeItemType = treeItemType;
		this.refreshUI();
	}

	public setContextValue(){
		let contextValue = "#Type:S3#";
		contextValue += this.IsFav ? "Fav#" : "!Fav#";
		contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
		contextValue += this.TreeItemType === TreeItemType.S3Bucket ? "Bucket#" : "";
		contextValue += this.TreeItemType === TreeItemType.S3Shortcut ? "Shortcut#" : "";
		contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";

		this.contextValue = contextValue;
	}

	public refreshUI() {

		if(this.TreeItemType === TreeItemType.S3Bucket)
		{
			this.iconPath = new vscode.ThemeIcon('package');
		}
		else if(this.TreeItemType === TreeItemType.S3Shortcut)
		{
			this.iconPath = new vscode.ThemeIcon('file-symlink-directory');
		}
		else
		{
			this.iconPath = new vscode.ThemeIcon('circle-outline');
		}
		this.setContextValue();
	}

	// filtering helpers inherited from WorkbenchTreeItem
}
