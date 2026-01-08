/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';

export class LambdaTreeItem extends vscode.TreeItem {
	public IsFav: boolean = false
	public TreeItemType:TreeItemType
	public Text:string
	public Lambda:string = ""
	public Region:string = ""
	public LogStreamName:string | undefined
	public Parent:LambdaTreeItem | undefined
	public Children:LambdaTreeItem[] = []
	public IsHidden: boolean = false
	public TriggerConfigPath: string | undefined
	private codePath: string | undefined;
	public PayloadPath: string | undefined;
	public ResponsePayload: string | undefined;
	public EnvironmentVariableName: string | undefined;
	public EnvironmentVariableValue: string | undefined;
	public TagKey: string | undefined;
	public TagValue: string | undefined;
	public InfoKey: string | undefined;
	public InfoValue: string | undefined;
	public IsRunning: boolean = false;

	constructor(text:string, treeItemType:TreeItemType) {
		super(text)
		this.Text = text
		this.TreeItemType = treeItemType
		this.refreshUI()
	}

	public set CodePath(path: string | undefined) {
		if(this.TreeItemType !== TreeItemType.LambdaCode) { return;}
		this.codePath = path;
		if (path && this.Children.length === 0) {
			let node = new LambdaTreeItem(path, TreeItemType.LambdaCodePath)
			node.Lambda = this.Lambda;
			node.Region = this.Region;
			node.Parent = this;
			this.Children.push(node);
			this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		}
		else if (path && this.Children.length > 0) {
			let node = this.Children[0];
			node.label = path;
			node.Text = path;
		}
		else 
		{
			this.Children = [];
			this.collapsibleState = vscode.TreeItemCollapsibleState.None;
		}
		//this.refreshUI();
	}

	public get CodePath(): string | undefined {
		return this.codePath;
	}

	public refreshUI() {

		if(this.TreeItemType === TreeItemType.LambdaFunction)
		{
			this.iconPath = new vscode.ThemeIcon('server-process');
			this.contextValue = "Lambda"
		}
		else if(this.TreeItemType === TreeItemType.LambdaCode)
		{
			this.iconPath = new vscode.ThemeIcon('file-code');
			this.contextValue = "Code"
		}
		else if(this.TreeItemType === TreeItemType.LambdaTriggerGroup)
		{
			this.iconPath = new vscode.ThemeIcon('run-all');
			this.contextValue = "TriggerGroup"
		}
		else if(this.TreeItemType === TreeItemType.LambdaTriggerSavedPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket');
			this.contextValue = "TriggerSavedPayload"
		}
		else if(this.TreeItemType === TreeItemType.LambdaTriggerWithPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket-dot');
			this.contextValue = "TriggerWithPayload"
		}
		else if(this.TreeItemType === TreeItemType.LambdaTriggerFilePayload)
		{
			this.iconPath = new vscode.ThemeIcon('file');
			this.contextValue = "TriggerFilePayload"
		}
		else if(this.TreeItemType === TreeItemType.LambdaTriggerNoPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket-error');
			this.contextValue = "TriggerNoPayload"
		}
		else if(this.TreeItemType === TreeItemType.LambdaResponsePayload)
		{
			this.iconPath = new vscode.ThemeIcon('output');
			this.contextValue = "ResponsePayload"
		}
		else if(this.TreeItemType === TreeItemType.LambdaLogGroup)
		{
			this.iconPath = new vscode.ThemeIcon('output');
			this.contextValue = "LogGroup"
		}
		else if(this.TreeItemType === TreeItemType.LambdaLogStream)
		{
			this.iconPath = new vscode.ThemeIcon('output');
			this.contextValue = "LogStream"
		}
		else if(this.TreeItemType === TreeItemType.LambdaCodePath)
		{
			this.iconPath = new vscode.ThemeIcon('file');
			this.contextValue = "CodePath"
		}
		else if(this.TreeItemType === TreeItemType.LambdaEnvironmentVariableGroup)
		{
			this.iconPath = new vscode.ThemeIcon('wrench');
			this.contextValue = "EnvironmentVariableGroup"
		}
		else if(this.TreeItemType === TreeItemType.LambdaEnvironmentVariable)
		{
			this.iconPath = new vscode.ThemeIcon('wrench');
			this.contextValue = "EnvironmentVariable"
		}
		else if(this.TreeItemType === TreeItemType.LambdaTagsGroup)
		{
			this.iconPath = new vscode.ThemeIcon('tag');
			this.contextValue = "TagsGroup"
		}
		else if(this.TreeItemType === TreeItemType.LambdaTag)
		{
			this.iconPath = new vscode.ThemeIcon('tag');
			this.contextValue = "Tag"
		}
		else if(this.TreeItemType === TreeItemType.LambdaInfoGroup)
		{
			this.iconPath = new vscode.ThemeIcon('info');
			this.contextValue = "InfoGroup"
		}
		else if(this.TreeItemType === TreeItemType.LambdaInfoItem)
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

	public IsAnyChidrenFavInternal(node:LambdaTreeItem): boolean{
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

	public IsFilterStringMatchAnyChildren(node:LambdaTreeItem, FilterString:string): boolean{
		for(var n of node.Children)
		{
			if(n.Text.includes(FilterString) || n.Region?.includes(FilterString) || n.Lambda?.includes(FilterString))
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
