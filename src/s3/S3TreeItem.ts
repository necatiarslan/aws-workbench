/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';

export class S3TreeItem extends vscode.TreeItem {
	private _isFav: boolean = false;
	public TreeItemType:TreeItemType;
	public Text:string;
	public Bucket:string | undefined;
	public Shortcut:string | undefined;
	public FolderPath:string | undefined; // For folder hierarchy
	public Parent:S3TreeItem | undefined;
	public Children:S3TreeItem[] = [];
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

	constructor(text:string, treeItemType:TreeItemType) {
		super(text);
		this.Text = text;
		this.TreeItemType = treeItemType;
		this.refreshUI();
	}

	public setContextValue(){
		let contextValue = "#";
		contextValue += this.IsFav ? "Fav#" : "!Fav#";
		contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
		contextValue += this.TreeItemType === TreeItemType.Folder ? "Folder#" : "";
		contextValue += this.TreeItemType === TreeItemType.Bucket ? "Bucket#" : "";
		contextValue += this.TreeItemType === TreeItemType.Shortcut ? "Shortcut#" : "";
		contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";

		this.contextValue = contextValue;
	}

	public refreshUI() {

		if(this.TreeItemType === TreeItemType.Folder)
		{
			this.iconPath = new vscode.ThemeIcon('folder');
			this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		}
		else if(this.TreeItemType === TreeItemType.Bucket)
		{
			this.iconPath = new vscode.ThemeIcon('package');
		}
		else if(this.TreeItemType === TreeItemType.Shortcut)
		{
			this.iconPath = new vscode.ThemeIcon('file-symlink-directory');
		}
		else if(this.TreeItemType === TreeItemType.LambdaFunction)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-method');
		}
		else if(this.TreeItemType === TreeItemType.CloudWatchLogGroup)
		{
			this.iconPath = new vscode.ThemeIcon('output');
		}
		else if(this.TreeItemType === TreeItemType.SNSTopic)
		{
			this.iconPath = new vscode.ThemeIcon('broadcast');
		}
		else if(this.TreeItemType === TreeItemType.DynamoDBTable)
		{
			this.iconPath = new vscode.ThemeIcon('database');
		}
		else if(this.TreeItemType === TreeItemType.SQSQueue)
		{
			this.iconPath = new vscode.ThemeIcon('inbox');
		}
		else if(this.TreeItemType === TreeItemType.StepFunction)
		{
			this.iconPath = new vscode.ThemeIcon('symbol-namespace');
		}
		else if(this.TreeItemType === TreeItemType.IAMRole)
		{
			this.iconPath = new vscode.ThemeIcon('shield');
		}
		else
		{
			this.iconPath = new vscode.ThemeIcon('circle-outline');
		}
		this.setContextValue();
	}

	public IsAnyChidrenFav(){
		return this.IsAnyChidrenFavInternal(this);
	}

	public IsAnyChidrenFavInternal(node:S3TreeItem): boolean{
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

	public IsFilterStringMatchAnyChildren(node:S3TreeItem, FilterString:string): boolean{
		for(var n of node.Children)
		{
			if(n.Text.includes(FilterString))
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
	Folder = 0,
	Bucket = 1,
	Shortcut = 2,
	LambdaFunction = 3,
	CloudWatchLogGroup = 4,
	SNSTopic = 5,
	DynamoDBTable = 6,
	SQSQueue = 7,
	StepFunction = 8,
	IAMRole = 9,
}

export interface ResourceTypeOption {
	label: string;
	description: string;
	type: TreeItemType;
	icon: string;
}

export const RESOURCE_TYPE_OPTIONS: ResourceTypeOption[] = [
	{
		label: 'Folder',
		description: 'Organize resources into folders',
		type: TreeItemType.Folder,
		icon: 'folder'
	},
	{
		label: 'S3 Bucket',
		description: 'Add an S3 bucket',
		type: TreeItemType.Bucket,
		icon: 'package'
	},
	{
		label: 'Lambda Function',
		description: 'Add a Lambda function',
		type: TreeItemType.LambdaFunction,
		icon: 'symbol-method'
	},
	{
		label: 'CloudWatch Log Group',
		description: 'Add a CloudWatch log group',
		type: TreeItemType.CloudWatchLogGroup,
		icon: 'output'
	},
	{
		label: 'SNS Topic',
		description: 'Add an SNS topic',
		type: TreeItemType.SNSTopic,
		icon: 'broadcast'
	},
	{
		label: 'DynamoDB Table',
		description: 'Add a DynamoDB table',
		type: TreeItemType.DynamoDBTable,
		icon: 'database'
	},
	{
		label: 'SQS Queue',
		description: 'Add an SQS queue',
		type: TreeItemType.SQSQueue,
		icon: 'inbox'
	},
	{
		label: 'Step Function',
		description: 'Add a Step Function state machine',
		type: TreeItemType.StepFunction,
		icon: 'symbol-namespace'
	},
	{
		label: 'IAM Role',
		description: 'Add an IAM role',
		type: TreeItemType.IAMRole,
		icon: 'shield'
	}
];