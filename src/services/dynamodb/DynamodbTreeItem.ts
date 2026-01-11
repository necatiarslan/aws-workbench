/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';

export class DynamodbTreeItem extends WorkbenchTreeItem<any, DynamodbTreeItem> {
	public TreeItemType:TreeItemType
	public Text:string
	public Dynamodb:string = ""
	public Region:string = ""
	public LogStreamName:string | undefined
	// Parent/Children provided by WorkbenchTreeItem

	// flag accessors inherited from WorkbenchTreeItem
	public TriggerConfigPath: string | undefined
	private codePath: string | undefined;
	public PayloadPath: string | undefined;
	public ResponsePayload: string | undefined;
	public EnvironmentVariableName: string | undefined;
	public EnvironmentVariableValue: string | undefined;
	public IsRunning: boolean = false;
	public ReadCapacity: number | undefined;
	public WriteCapacity: number | undefined;

	constructor(text:string, treeItemType:TreeItemType) {
		super(text)
		this.Text = text
		this.TreeItemType = treeItemType
		this.refreshUI()
	}

	public set CodePath(path: string | undefined) {
		if(this.TreeItemType !== TreeItemType.DynamoDBCode) { return;}
		this.codePath = path;
		if (path && this.Children.length === 0) {
			let node = new DynamodbTreeItem(path, TreeItemType.DynamoDBCodePath)
			node.Dynamodb = this.Dynamodb;
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

	public setContextValue(){
		let contextValue = "#Type:DynamoDB#";
		contextValue += this.IsFav ? "Fav#" : "!Fav#";
		contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
		contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";

		if(this.TreeItemType === TreeItemType.DynamoDBTable)
		{
			contextValue += "Table#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBCode)
		{
			contextValue += "Code#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTriggerGroup)
		{
			contextValue += "TriggerGroup#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTriggerSavedPayload)
		{
			contextValue += "TriggerSavedPayload#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTriggerWithPayload)
		{
			contextValue += "TriggerWithPayload#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTriggerFilePayload)
		{
			contextValue += "TriggerFilePayload#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTriggerNoPayload)
		{
			contextValue += "TriggerNoPayload#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBResponsePayload)
		{
			contextValue += "ResponsePayload#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBLogGroup)
		{
			contextValue += "LogGroup#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBLogStream)
		{
			contextValue += "LogStream#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBCodePath)
		{
			contextValue += "CodePath#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBEnvironmentVariableGroup)
		{
			contextValue += "EnvironmentVariableGroup#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBEnvironmentVariable)
		{
			contextValue += "EnvironmentVariable#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBPrimaryKey)
		{
			contextValue += "PrimaryKey#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBPartitionKey)
		{
			contextValue += "PartitionKey#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBSortKey)
		{
			contextValue += "SortKey#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBCapacity)
		{
			contextValue += "Capacity#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTableInfo)
		{
			contextValue += "TableInfo#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBIndexes)
		{
			contextValue += "Indexes#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBIndex)
		{
			contextValue += "Index#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTableSize)
		{
			contextValue += "TableSize#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBItemCount)
		{
			contextValue += "ItemCount#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTableClass)
		{
			contextValue += "TableClass#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTableStatus)
		{
			contextValue += "TableStatus#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBReadCapacity)
		{
			contextValue += "ReadCapacity#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBWriteCapacity)
		{
			contextValue += "WriteCapacity#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTags)
		{
			contextValue += "Tags#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTagItem)
		{
			contextValue += "TagItem#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBCapacityExplanation)
		{
			contextValue += "CapacityExplanation#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTableArn)
		{
			contextValue += "TableArn#";
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBAverageItemSize)
		{
			contextValue += "AverageItemSize#";
		}
		else
		{
			contextValue += "Other#";
		}

		this.contextValue = contextValue;
	}

	public refreshUI() {

		if(this.TreeItemType === TreeItemType.DynamoDBTable)
		{
			this.iconPath = new vscode.ThemeIcon('server-process');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBCode)
		{
			this.iconPath = new vscode.ThemeIcon('file-code');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTriggerGroup)
		{
			this.iconPath = new vscode.ThemeIcon('run-all');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTriggerSavedPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTriggerWithPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket-dot');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTriggerFilePayload)
		{
			this.iconPath = new vscode.ThemeIcon('file');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTriggerNoPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket-error');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBResponsePayload)
		{
			this.iconPath = new vscode.ThemeIcon('output');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBLogGroup)
		{
			this.iconPath = new vscode.ThemeIcon('output');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBLogStream)
		{
			this.iconPath = new vscode.ThemeIcon('output');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBCodePath)
		{
			this.iconPath = new vscode.ThemeIcon('file');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBEnvironmentVariableGroup)
		{
			this.iconPath = new vscode.ThemeIcon('wrench');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBEnvironmentVariable)
		{
			this.iconPath = new vscode.ThemeIcon('wrench');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBPrimaryKey)
		{
			this.iconPath = new vscode.ThemeIcon('key');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBPartitionKey)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-key');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBSortKey)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-key');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBCapacity)
		{
			this.iconPath = new vscode.ThemeIcon('dashboard');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTableInfo)
		{
			this.iconPath = new vscode.ThemeIcon('info');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBIndexes)
		{
			this.iconPath = new vscode.ThemeIcon('list-tree');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBIndex)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-array');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTableSize)
		{
			this.iconPath = new vscode.ThemeIcon('database');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBItemCount)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-number');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTableClass)
		{
			this.iconPath = new vscode.ThemeIcon('archive');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTableStatus)
		{
			this.iconPath = new vscode.ThemeIcon('pulse');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBReadCapacity)
		{
			this.iconPath = new vscode.ThemeIcon('arrow-down');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBWriteCapacity)
		{
			this.iconPath = new vscode.ThemeIcon('arrow-up');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTags)
		{
			this.iconPath = new vscode.ThemeIcon('tag');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTagItem)
		{
			this.iconPath = new vscode.ThemeIcon('tag');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBCapacityExplanation)
		{
			this.iconPath = new vscode.ThemeIcon('info');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTableArn)
		{
			this.iconPath = new vscode.ThemeIcon('link');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBAverageItemSize)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-ruler');
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

	// filtering helpers inherited from WorkbenchTreeItem
}
