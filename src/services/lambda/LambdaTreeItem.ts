/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';

export class LambdaTreeItem extends vscode.TreeItem {
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
	public Lambda:string = ""
	public Region:string = ""
	public LogStreamName:string | undefined
	public Parent:LambdaTreeItem | undefined
	public Children:LambdaTreeItem[] = []

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

	public setContextValue(){
		let contextValue = "#Type:Lambda#";
		contextValue += this.IsFav ? "Fav#" : "!Fav#";
		contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
		contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";

		if(this.TreeItemType === TreeItemType.LambdaFunction)
		{
			contextValue += "Lambda#";
		}
		else if(this.TreeItemType === TreeItemType.LambdaCode)
		{
			contextValue += "Code#";
		}
		else if(this.TreeItemType === TreeItemType.LambdaTriggerGroup)
		{
			contextValue += "TriggerGroup#";
		}
		else if(this.TreeItemType === TreeItemType.LambdaTriggerSavedPayload)
		{
			contextValue += "TriggerSavedPayload#";
		}
		else if(this.TreeItemType === TreeItemType.LambdaTriggerWithPayload)
		{
			contextValue += "TriggerWithPayload#";
		}
		else if(this.TreeItemType === TreeItemType.LambdaTriggerFilePayload)
		{
			contextValue += "TriggerFilePayload#";
		}
		else if(this.TreeItemType === TreeItemType.LambdaTriggerNoPayload)
		{
			contextValue += "TriggerNoPayload#";
		}
		else if(this.TreeItemType === TreeItemType.LambdaResponsePayload)
		{
			contextValue += "ResponsePayload#";
		}
		else if(this.TreeItemType === TreeItemType.LambdaLogGroup)
		{
			contextValue += "LogGroup#";
		}
		else if(this.TreeItemType === TreeItemType.LambdaLogStream)
		{
			contextValue += "LogStream#";
		}
		else if(this.TreeItemType === TreeItemType.LambdaCodePath)
		{
			contextValue += "CodePath#";
		}
		else if(this.TreeItemType === TreeItemType.LambdaEnvironmentVariableGroup)
		{
			contextValue += "EnvironmentVariableGroup#";
		}
		else if(this.TreeItemType === TreeItemType.LambdaEnvironmentVariable)
		{
			contextValue += "EnvironmentVariable#";
		}
		else if(this.TreeItemType === TreeItemType.LambdaTagsGroup)
		{
			contextValue += "TagsGroup#";
		}
		else if(this.TreeItemType === TreeItemType.LambdaTag)
		{
			contextValue += "Tag#";
		}
		else if(this.TreeItemType === TreeItemType.LambdaInfoGroup)
		{
			contextValue += "InfoGroup#";
		}
		else if(this.TreeItemType === TreeItemType.LambdaInfoItem)
		{
			contextValue += "InfoItem#";
		}
		else
		{
			contextValue += "Other#";
		}

		this.contextValue = contextValue;
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
		}
		else if(this.TreeItemType === TreeItemType.LambdaCode)
		{
			this.iconPath = new vscode.ThemeIcon('file-code');
		}
		else if(this.TreeItemType === TreeItemType.LambdaTriggerGroup)
		{
			this.iconPath = new vscode.ThemeIcon('run-all');
		}
		else if(this.TreeItemType === TreeItemType.LambdaTriggerSavedPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket');
		}
		else if(this.TreeItemType === TreeItemType.LambdaTriggerWithPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket-dot');
		}
		else if(this.TreeItemType === TreeItemType.LambdaTriggerFilePayload)
		{
			this.iconPath = new vscode.ThemeIcon('file');
		}
		else if(this.TreeItemType === TreeItemType.LambdaTriggerNoPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket-error');
		}
		else if(this.TreeItemType === TreeItemType.LambdaResponsePayload)
		{
			this.iconPath = new vscode.ThemeIcon('output');
		}
		else if(this.TreeItemType === TreeItemType.LambdaLogGroup)
		{
			this.iconPath = new vscode.ThemeIcon('output');
		}
		else if(this.TreeItemType === TreeItemType.LambdaLogStream)
		{
			this.iconPath = new vscode.ThemeIcon('output');
		}
		else if(this.TreeItemType === TreeItemType.LambdaCodePath)
		{
			this.iconPath = new vscode.ThemeIcon('file');
		}
		else if(this.TreeItemType === TreeItemType.LambdaEnvironmentVariableGroup)
		{
			this.iconPath = new vscode.ThemeIcon('wrench');
		}
		else if(this.TreeItemType === TreeItemType.LambdaEnvironmentVariable)
		{
			this.iconPath = new vscode.ThemeIcon('wrench');
		}
		else if(this.TreeItemType === TreeItemType.LambdaTagsGroup)
		{
			this.iconPath = new vscode.ThemeIcon('tag');
		}
		else if(this.TreeItemType === TreeItemType.LambdaTag)
		{
			this.iconPath = new vscode.ThemeIcon('tag');
		}
		else if(this.TreeItemType === TreeItemType.LambdaInfoGroup)
		{
			this.iconPath = new vscode.ThemeIcon('info');
		}
		else if(this.TreeItemType === TreeItemType.LambdaInfoItem)
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
