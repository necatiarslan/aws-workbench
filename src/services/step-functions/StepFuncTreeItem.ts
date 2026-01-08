/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';

export class StepFuncTreeItem extends vscode.TreeItem {
	public IsFav: boolean = false
	public TreeItemType:TreeItemType
	public Text:string
	public StepFuncArn:string = ""
	public StepFuncName:string = ""
	public Region:string = ""
	public StepFuncDefinition: any | undefined;
	public LogStreamName:string | undefined
	public Parent:StepFuncTreeItem | undefined
	public Children:StepFuncTreeItem[] = []
	public IsHidden: boolean = false
	public TriggerConfigPath: string | undefined
	private codePath: string | undefined;
	public PayloadPath: string | undefined;
	public ExecutionArn: string | undefined;
	public ExecutionStatus: string | undefined;
	public ExecutionDetails: any | undefined;
	public EnvironmentVariableName: string | undefined;
	public EnvironmentVariableValue: string | undefined;
	public IsRunning: boolean = false;

	constructor(text:string, treeItemType:TreeItemType) {
		super(text)
		this.Text = text
		this.StepFuncName = text
		this.TreeItemType = treeItemType
		this.refreshUI()
	}

	public static GetStepFuncName(stepFuncArn: string): string {
		if(stepFuncArn)
		{
			let parts = stepFuncArn.split(":");
			return parts[parts.length - 1];
		}
		return "";
	}

	public set CodePath(path: string | undefined) {
		if(this.TreeItemType !== TreeItemType.Code) { return;}
		this.codePath = path;
		if (path && this.Children.length === 0) {
			let node = new StepFuncTreeItem(path, TreeItemType.CodePath)
			node.StepFuncArn = this.StepFuncArn;
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

		if(this.TreeItemType === TreeItemType.StepFunc)
		{
			this.iconPath = new vscode.ThemeIcon('server-process');
			this.contextValue = "StepFunc"
		}
		else if(this.TreeItemType === TreeItemType.Code)
		{
			this.iconPath = new vscode.ThemeIcon('file-code');
			this.contextValue = "Code"
		}
		else if(this.TreeItemType === TreeItemType.TriggerGroup)
		{
			this.iconPath = new vscode.ThemeIcon('run-all');
			this.contextValue = "TriggerGroup"
		}
		else if(this.TreeItemType === TreeItemType.TriggerSavedPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket');
			this.contextValue = "TriggerSavedPayload"
		}
		else if(this.TreeItemType === TreeItemType.TriggerWithPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket-dot');
			this.contextValue = "TriggerWithPayload"
		}
		else if(this.TreeItemType === TreeItemType.TriggerFilePayload)
		{
			this.iconPath = new vscode.ThemeIcon('file');
			this.contextValue = "TriggerFilePayload"
		}
		else if(this.TreeItemType === TreeItemType.TriggerNoPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket-error');
			this.contextValue = "TriggerNoPayload"
		}
		else if(this.TreeItemType === TreeItemType.ResponsePayload)
		{
			this.iconPath = new vscode.ThemeIcon('output');
			this.contextValue = "ResponsePayload"
		}
		else if(this.TreeItemType === TreeItemType.LogGroup)
		{
			this.iconPath = new vscode.ThemeIcon('output');
			this.contextValue = "LogGroup"
		}
		else if(this.TreeItemType === TreeItemType.LogStream)
		{
			this.iconPath = new vscode.ThemeIcon('output');
			this.contextValue = "LogStream"
		}
		else if(this.TreeItemType === TreeItemType.CodePath)
		{
			this.iconPath = new vscode.ThemeIcon('file');
			this.contextValue = "CodePath"
		}
		else if(this.TreeItemType === TreeItemType.EnvironmentVariableGroup)
		{
			this.iconPath = new vscode.ThemeIcon('wrench');
			this.contextValue = "EnvironmentVariableGroup"
		}
		else if(this.TreeItemType === TreeItemType.EnvironmentVariable)
		{
			this.iconPath = new vscode.ThemeIcon('wrench');
			this.contextValue = "EnvironmentVariable"
		}
		else if(this.TreeItemType === TreeItemType.ExecutionGroup)
		{
			this.iconPath = new vscode.ThemeIcon('list-tree');
			this.contextValue = "ExecutionGroup"
		}
		else if(this.TreeItemType === TreeItemType.Execution)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-event');
			this.contextValue = "Execution"
		}
		else if(this.TreeItemType === TreeItemType.SuccessfulExecutionGroup)
		{
			this.iconPath = new vscode.ThemeIcon('pass');
			this.contextValue = "SuccessfulExecutionGroup"
		}
		else if(this.TreeItemType === TreeItemType.FailedExecutionGroup)
		{
			this.iconPath = new vscode.ThemeIcon('error');
			this.contextValue = "FailedExecutionGroup"
		}
		else if(this.TreeItemType === TreeItemType.RunningExecutionGroup)
		{
			this.iconPath = new vscode.ThemeIcon('sync');
			this.contextValue = "RunningExecutionGroup"
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

	public IsAnyChidrenFavInternal(node:StepFuncTreeItem): boolean{
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

	public IsFilterStringMatchAnyChildren(node:StepFuncTreeItem, FilterString:string): boolean{
		for(var n of node.Children)
		{
			if(n.Text.includes(FilterString) || n.Region?.includes(FilterString) || n.StepFuncArn?.includes(FilterString))
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

export enum TreeItemType{
	StepFunc = 1,
	Code = 2,
	LogGroup = 3,
	LogStream = 4,
	TriggerGroup = 5,
	TriggerSavedPayload = 6,
	CodePath = 7,
	TriggerNoPayload= 8,
	TriggerWithPayload= 9,
	TriggerFilePayload= 10,
	ResponsePayload= 11,
	EnvironmentVariableGroup= 12,
	EnvironmentVariable= 13,
	ExecutionGroup= 14,
	Execution= 15,
	SuccessfulExecutionGroup= 16,
	FailedExecutionGroup= 17,
	RunningExecutionGroup= 18
}