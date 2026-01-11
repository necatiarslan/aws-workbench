/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';



export class GlueTreeItem extends WorkbenchTreeItem<any, GlueTreeItem> {

	constructor(
		public readonly label: string,
		public readonly TreeItemType: TreeItemType,
		public readonly Region: string,
		public ResourceName: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public command?: vscode.Command,
		parent?: GlueTreeItem,
		public Payload?: any
	) {
		super(label, collapsibleState);
			// wire parent if provided
			this.Parent = parent;
			// contextValue is set in setIcons
			this.setIcons();
	}


	// flag accessors inherited from WorkbenchTreeItem
	public IsRunning: boolean = false;
	public RunId: string | undefined;

	public setContextValue(){
		let contextValue = "#Type:Glue#";
		contextValue += this.IsFav ? "Fav#" : "!Fav#";
		contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
		contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";

		switch (this.TreeItemType) {
			case TreeItemType.GlueJob:
				contextValue += "GlueJob#";
				break;
			case TreeItemType.GlueRunGroup:
				contextValue += "GlueRunGroup#";
				break;
			case TreeItemType.GlueLogGroup:
				contextValue += "GlueLogGroup#";
				break;
			case TreeItemType.GlueLogStream:
				contextValue += "GlueLogStream#";
				break;
			case TreeItemType.GlueRun:
				contextValue += "GlueRun#";
				break;
			case TreeItemType.GlueDetail:
				contextValue += "GlueDetail#";
				break;
			case TreeItemType.GlueArguments:
				contextValue += "GlueArguments#";
				break;
			case TreeItemType.GlueInfo:
				contextValue += "GlueInfo#";
				break;
		}
		this.contextValue = contextValue;
	}

	setIcons() {
		let iconName = "";
		switch (this.TreeItemType) {
			case TreeItemType.GlueJob:
				iconName = "settings-gear";
				break;
			case TreeItemType.GlueRunGroup:
				iconName = "history";
				break;
			case TreeItemType.GlueLogGroup:
				iconName = "output";
				break;
			case TreeItemType.GlueLogStream:
				iconName = "list-unordered";
				break;
			case TreeItemType.GlueRun:
				iconName = "play";
				break;
			case TreeItemType.GlueDetail:
				iconName = "info";
				break;
			case TreeItemType.GlueArguments:
				iconName = "list-selection";
				break;
			case TreeItemType.GlueInfo:
				iconName = "info";
				break;
		}

		if (this.IsRunning) {
			this.iconPath = new vscode.ThemeIcon("sync~spin");
		} else {
			this.iconPath = new vscode.ThemeIcon(iconName);
		}
	}

	refreshUI() {
		this.setIcons();
		this.setContextValue();
	}
}