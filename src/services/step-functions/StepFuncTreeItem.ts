/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';

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
		if(this.TreeItemType !== TreeItemType.StepFunctionsCode) { return;}
		this.codePath = path;
		if (path && this.Children.length === 0) {
			let node = new StepFuncTreeItem(path, TreeItemType.StepFunctionsCodePath)
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

		if(this.TreeItemType === TreeItemType.StepFunctionsStateMachine)
		{
			this.iconPath = new vscode.ThemeIcon('server-process');
			this.contextValue = "StepFunc"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsCode)
		{
			this.iconPath = new vscode.ThemeIcon('file-code');
			this.contextValue = "Code"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsTriggerGroup)
		{
			this.iconPath = new vscode.ThemeIcon('run-all');
			this.contextValue = "TriggerGroup"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsTriggerSavedPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket');
			this.contextValue = "TriggerSavedPayload"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsTriggerWithPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket-dot');
			this.contextValue = "TriggerWithPayload"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsTriggerFilePayload)
		{
			this.iconPath = new vscode.ThemeIcon('file');
			this.contextValue = "TriggerFilePayload"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsTriggerNoPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket-error');
			this.contextValue = "TriggerNoPayload"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsResponsePayload)
		{
			this.iconPath = new vscode.ThemeIcon('output');
			this.contextValue = "ResponsePayload"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsLogGroup)
		{
			this.iconPath = new vscode.ThemeIcon('output');
			this.contextValue = "LogGroup"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsLogStream)
		{
			this.iconPath = new vscode.ThemeIcon('output');
			this.contextValue = "LogStream"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsCodePath)
		{
			this.iconPath = new vscode.ThemeIcon('file');
			this.contextValue = "CodePath"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsEnvironmentVariableGroup)
		{
			this.iconPath = new vscode.ThemeIcon('wrench');
			this.contextValue = "EnvironmentVariableGroup"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsEnvironmentVariable)
		{
			this.iconPath = new vscode.ThemeIcon('wrench');
			this.contextValue = "EnvironmentVariable"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsExecutionGroup)
		{
			this.iconPath = new vscode.ThemeIcon('list-tree');
			this.contextValue = "ExecutionGroup"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsExecution)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-event');
			this.contextValue = "Execution"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsSuccessfulExecutionGroup)
		{
			this.iconPath = new vscode.ThemeIcon('pass');
			this.contextValue = "SuccessfulExecutionGroup"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsFailedExecutionGroup)
		{
			this.iconPath = new vscode.ThemeIcon('error');
			this.contextValue = "FailedExecutionGroup"
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsRunningExecutionGroup)
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
