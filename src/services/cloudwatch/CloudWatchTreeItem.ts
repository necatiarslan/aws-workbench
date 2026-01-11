/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';

export class CloudWatchTreeItem extends WorkbenchTreeItem<any, CloudWatchTreeItem> {
	public TreeItemType:TreeItemType;
	public Text:string;
	public Region:string | undefined;
	public LogGroup:string | undefined;
	public LogStream:string | undefined;
	public DetailValue:string | undefined;
	public DateFilter:Date | undefined;

	// Flag accessors inherited from WorkbenchTreeItem

	constructor(text:string, treeItemType:TreeItemType) {
		super(text);
		this.Text = text;
		this.TreeItemType = treeItemType;
		this.refreshUI();
	}

	public setContextValue(){
		let contextValue = "#Type:CloudWatch#";
		contextValue += this.IsFav ? "Fav#" : "!Fav#";
		contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
		contextValue += this.IsPinned ? "Pinned#" : "NotPinned#";
		contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";
		switch(this.TreeItemType)
		{
			case TreeItemType.CloudWatchRegion:
				contextValue += "Region#";
				break;
			case TreeItemType.CloudWatchLogGroup:
				contextValue += "LogGroup#";
				break;
			case TreeItemType.CloudWatchLogStream:
				contextValue += "LogStream#";
				break;
			case TreeItemType.CloudWatchInfo:
				contextValue += "Info#";
				break;
			case TreeItemType.CloudWatchInfoDetail:
				contextValue += "InfoDetail#";
				break;
			case TreeItemType.CloudWatchToday:
				contextValue += "Today#";
				break;
			case TreeItemType.CloudWatchYesterday:
				contextValue += "Yesterday#";
				break;
			case TreeItemType.CloudWatchHistory:
				contextValue += "History#";
				break;
			case TreeItemType.CloudWatchRefreshAction:
				contextValue += "RefreshAction#";
				break;
		}

		this.contextValue = contextValue;
	}

	public refreshUI() {

		if(this.TreeItemType === TreeItemType.CloudWatchRegion)
		{
			this.iconPath = new vscode.ThemeIcon('globe');
		}
		else if(this.TreeItemType === TreeItemType.CloudWatchLogGroup)
		{
			this.iconPath = new vscode.ThemeIcon('folder');
		}
		else if(this.TreeItemType === TreeItemType.CloudWatchInfo)
		{
			this.iconPath = new vscode.ThemeIcon('info');
		}
		else if(this.TreeItemType === TreeItemType.CloudWatchInfoDetail)
		{
			this.iconPath = new vscode.ThemeIcon('circle-filled');
		}
		else if(this.TreeItemType === TreeItemType.CloudWatchToday || this.TreeItemType === TreeItemType.CloudWatchYesterday || this.TreeItemType === TreeItemType.CloudWatchHistory)
		{
			this.iconPath = new vscode.ThemeIcon('calendar');
		}
		else if(this.TreeItemType === TreeItemType.CloudWatchRefreshAction)
		{
			this.iconPath = new vscode.ThemeIcon('refresh');
		}
		else if(this.TreeItemType === TreeItemType.CloudWatchLogStream)
		{
			this.iconPath = new vscode.ThemeIcon('output');
		}
		else
		{
			this.iconPath = new vscode.ThemeIcon('circle-outline');
		}

		this.setContextValue();
	}

	// Filtering helpers inherited from WorkbenchTreeItem
}
