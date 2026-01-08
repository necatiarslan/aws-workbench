/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { TreeItemType } from '../../tree/TreeItemType';

export class DynamodbTreeItem extends vscode.TreeItem {
	public IsFav: boolean = false
	public TreeItemType:TreeItemType
	public Text:string
	public Dynamodb:string = ""
	public Region:string = ""
	public LogStreamName:string | undefined
	public Parent:DynamodbTreeItem | undefined
	public Children:DynamodbTreeItem[] = []
	public IsHidden: boolean = false
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

	public refreshUI() {

		if(this.TreeItemType === TreeItemType.DynamoDBTable)
		{
			this.iconPath = new vscode.ThemeIcon('server-process');
			this.contextValue = "Dynamodb"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBCode)
		{
			this.iconPath = new vscode.ThemeIcon('file-code');
			this.contextValue = "Code"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTriggerGroup)
		{
			this.iconPath = new vscode.ThemeIcon('run-all');
			this.contextValue = "TriggerGroup"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTriggerSavedPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket');
			this.contextValue = "TriggerSavedPayload"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTriggerWithPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket-dot');
			this.contextValue = "TriggerWithPayload"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTriggerFilePayload)
		{
			this.iconPath = new vscode.ThemeIcon('file');
			this.contextValue = "TriggerFilePayload"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTriggerNoPayload)
		{
			this.iconPath = new vscode.ThemeIcon('bracket-error');
			this.contextValue = "TriggerNoPayload"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBResponsePayload)
		{
			this.iconPath = new vscode.ThemeIcon('output');
			this.contextValue = "ResponsePayload"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBLogGroup)
		{
			this.iconPath = new vscode.ThemeIcon('output');
			this.contextValue = "LogGroup"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBLogStream)
		{
			this.iconPath = new vscode.ThemeIcon('output');
			this.contextValue = "LogStream"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBCodePath)
		{
			this.iconPath = new vscode.ThemeIcon('file');
			this.contextValue = "CodePath"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBEnvironmentVariableGroup)
		{
			this.iconPath = new vscode.ThemeIcon('wrench');
			this.contextValue = "EnvironmentVariableGroup"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBEnvironmentVariable)
		{
			this.iconPath = new vscode.ThemeIcon('wrench');
			this.contextValue = "EnvironmentVariable"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBPrimaryKey)
		{
			this.iconPath = new vscode.ThemeIcon('key');
			this.contextValue = "PrimaryKey"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBPartitionKey)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-key');
			this.contextValue = "PartitionKey"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBSortKey)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-key');
			this.contextValue = "SortKey"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBCapacity)
		{
			this.iconPath = new vscode.ThemeIcon('dashboard');
			this.contextValue = "Capacity"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTableInfo)
		{
			this.iconPath = new vscode.ThemeIcon('info');
			this.contextValue = "TableInfo"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBIndexes)
		{
			this.iconPath = new vscode.ThemeIcon('list-tree');
			this.contextValue = "Indexes"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBIndex)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-array');
			this.contextValue = "Index"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTableSize)
		{
			this.iconPath = new vscode.ThemeIcon('database');
			this.contextValue = "TableSize"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBItemCount)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-number');
			this.contextValue = "ItemCount"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTableClass)
		{
			this.iconPath = new vscode.ThemeIcon('archive');
			this.contextValue = "TableClass"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTableStatus)
		{
			this.iconPath = new vscode.ThemeIcon('pulse');
			this.contextValue = "TableStatus"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBReadCapacity)
		{
			this.iconPath = new vscode.ThemeIcon('arrow-down');
			this.contextValue = "ReadCapacity"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBWriteCapacity)
		{
			this.iconPath = new vscode.ThemeIcon('arrow-up');
			this.contextValue = "WriteCapacity"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTags)
		{
			this.iconPath = new vscode.ThemeIcon('tag');
			this.contextValue = "Tags"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTagItem)
		{
			this.iconPath = new vscode.ThemeIcon('tag');
			this.contextValue = "TagItem"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBCapacityExplanation)
		{
			this.iconPath = new vscode.ThemeIcon('info');
			this.contextValue = "CapacityExplanation"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTableArn)
		{
			this.iconPath = new vscode.ThemeIcon('link');
			this.contextValue = "TableArn"
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBAverageItemSize)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-ruler');
			this.contextValue = "AverageItemSize"
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

	public IsAnyChidrenFavInternal(node:DynamodbTreeItem): boolean{
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

	public IsFilterStringMatchAnyChildren(node:DynamodbTreeItem, FilterString:string): boolean{
		for(var n of node.Children)
		{
			if(n.Text.includes(FilterString) || n.Region?.includes(FilterString) || n.Dynamodb?.includes(FilterString))
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
