/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';



export class GlueTreeItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly TreeItemType: TreeItemType,
		public readonly Region: string,
		public ResourceName: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public command?: vscode.Command,
		public Parent?: GlueTreeItem,
		public Payload?: any
	) {
		super(label, collapsibleState);
		// contextValue is set in setIcons
		this.setIcons();
	}

	public IsFav: boolean = false;
	public IsHidden: boolean = false;
	public IsRunning: boolean = false;
	public RunId: string | undefined;

	setIcons() {
		let iconName = "";
		switch (this.TreeItemType) {
			case TreeItemType.GlueJob:
				iconName = "settings-gear";
				this.contextValue = "GlueJob";
				break;
			case TreeItemType.GlueRunGroup:
				iconName = "history";
				this.contextValue = "GlueRunGroup";
				break;
			case TreeItemType.GlueLogGroup:
				iconName = "output";
				this.contextValue = "GlueLogGroup";
				break;
			case TreeItemType.GlueLogStream:
				iconName = "list-unordered";
				this.contextValue = "GlueLogStream";
				break;
			case TreeItemType.GlueRun:
				iconName = "play";
				this.contextValue = "GlueRun";
				break;
			case TreeItemType.GlueDetail:
				iconName = "info";
				this.contextValue = "GlueDetail";
				break;
			case TreeItemType.GlueArguments:
				iconName = "list-selection";
				this.contextValue = "GlueArguments";
				break;
			case TreeItemType.GlueInfo:
				iconName = "info";
				this.contextValue = "GlueInfo";
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
	}
}