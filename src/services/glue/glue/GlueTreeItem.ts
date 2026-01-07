/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { join } from 'path';

export enum TreeItemType {
	Job = "Job",
	RunGroup = "RunGroup",
	LogGroup = "LogGroup",
	LogStream = "LogStream",
	Run = "Run",
	Detail = "Detail",
	Arguments = "Arguments",
	Info = "Info"
}

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
		this.contextValue = TreeItemType;
		this.setIcons();
	}

	public IsFav: boolean = false;
	public IsHidden: boolean = false;
	public IsRunning: boolean = false;
	public RunId: string | undefined;

	setIcons() {
		let iconName = "";
		switch (this.TreeItemType) {
			case TreeItemType.Job:
				iconName = "settings-gear";
				break;
			case TreeItemType.RunGroup:
				iconName = "history";
				break;
			case TreeItemType.LogGroup:
				iconName = "output";
				break;
			case TreeItemType.LogStream:
				iconName = "list-unordered";
				break;
			case TreeItemType.Run:
				iconName = "play";
				break;
			case TreeItemType.Detail:
				iconName = "info";
				break;
			case TreeItemType.Arguments:
				iconName = "list-selection";
				break;
			case TreeItemType.Info:
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
	}
}