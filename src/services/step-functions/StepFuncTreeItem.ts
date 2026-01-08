/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';

export class StepFuncTreeItem extends vscode.TreeItem {
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
	public StepFuncArn:string = ""
	public StepFuncName:string = ""
	public Region:string = ""
	public StepFuncDefinition: any | undefined;
	public LogStreamName:string | undefined
	public Parent:StepFuncTreeItem | undefined
	public Children:StepFuncTreeItem[] = []

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

	public setContextValue(){
		let contextValue = "#Type:StepFunctions#";
		contextValue += this.IsFav ? "Fav#" : "!Fav#";
		contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
		contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";

		if(this.TreeItemType === TreeItemType.StepFunctionsStateMachine)
		{
			contextValue += "StepFunc#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsCode)
		{
			contextValue += "Code#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsTriggerGroup)
		{
			contextValue += "TriggerGroup#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsTriggerSavedPayload)
		{
			contextValue += "TriggerSavedPayload#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsTriggerWithPayload)
		{
			contextValue += "TriggerWithPayload#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsTriggerFilePayload)
		{
			contextValue += "TriggerFilePayload#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsTriggerNoPayload)
		{
			contextValue += "TriggerNoPayload#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsResponsePayload)
		{
			contextValue += "ResponsePayload#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsLogGroup)
		{
			contextValue += "LogGroup#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsLogStream)
		{
			contextValue += "LogStream#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsCodePath)
		{
			contextValue += "CodePath#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsEnvironmentVariableGroup)
		{
			contextValue += "EnvironmentVariableGroup#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsEnvironmentVariable)
		{
			contextValue += "EnvironmentVariable#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsExecutionGroup)
		{
			contextValue += "ExecutionGroup#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsExecution)
		{
			contextValue += "Execution#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsSuccessfulExecutionGroup)
		{
			contextValue += "SuccessfulExecutionGroup#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsFailedExecutionGroup)
		{
			contextValue += "FailedExecutionGroup#";
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsRunningExecutionGroup)
		{
			contextValue += "RunningExecutionGroup#";
		}
		else
		{
			contextValue += "Other#";
		}

		this.contextValue = contextValue;
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
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsCode)
		{
			this.iconPath = new vscode.ThemeIcon('file-code');
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsTriggerGroup)
		{
			this.iconPath = new vscode.ThemeIcon('run-all');
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsTriggerSavedPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket');
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsTriggerWithPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket-dot');
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsTriggerFilePayload)
		{
			this.iconPath = new vscode.ThemeIcon('file');
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsTriggerNoPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket-error');
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsResponsePayload)
		{
			this.iconPath = new vscode.ThemeIcon('output');
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsLogGroup)
		{
			this.iconPath = new vscode.ThemeIcon('output');
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsLogStream)
		{
			this.iconPath = new vscode.ThemeIcon('output');
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsCodePath)
		{
			this.iconPath = new vscode.ThemeIcon('file');
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsEnvironmentVariableGroup)
		{
			this.iconPath = new vscode.ThemeIcon('wrench');
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsEnvironmentVariable)
		{
			this.iconPath = new vscode.ThemeIcon('wrench');
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsExecutionGroup)
		{
			this.iconPath = new vscode.ThemeIcon('list-tree');
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsExecution)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-event');
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsSuccessfulExecutionGroup)
		{
			this.iconPath = new vscode.ThemeIcon('pass');
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsFailedExecutionGroup)
		{
			this.iconPath = new vscode.ThemeIcon('error');
		}
		else if(this.TreeItemType === TreeItemType.StepFunctionsRunningExecutionGroup)
		{
			this.iconPath = new vscode.ThemeIcon('sync');
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
