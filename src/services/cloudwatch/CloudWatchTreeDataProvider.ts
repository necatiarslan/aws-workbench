/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { CloudWatchTreeItem } from './CloudWatchTreeItem';
import { TreeItemType } from '../../tree/TreeItemType';
import { CloudWatchService } from './CloudWatchService';
import { Session } from '../../common/Session';
import * as api from './API';

export class CloudWatchTreeDataProvider implements vscode.TreeDataProvider<CloudWatchTreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<CloudWatchTreeItem | undefined | void> = new vscode.EventEmitter<CloudWatchTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<CloudWatchTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	
	RegionNodeList: CloudWatchTreeItem[] = [];

	constructor() {
		
	}

	Refresh(): void {
		if(this.RegionNodeList.length === 0){ this.LoadRegionNodeList(); }
		this._onDidChangeTreeData.fire();
	}

	AddLogGroup(Region:string, LogGroup:string): CloudWatchTreeItem | undefined {
		for(var item of CloudWatchService.Instance.LogGroupList)
		{
			if(item.Region === Region && item.LogGroup === LogGroup)
			{
				return this.RegionNodeList.find(node => node.label === Region)?.Children.find(child => child.LogGroup === LogGroup);
			}
		}
		
		CloudWatchService.Instance.LogGroupList.push({Region: Region, LogGroup: LogGroup});
		const node = this.AddNewLogGroupNode(Region, LogGroup);
		this.Refresh();
		return node;
	}

	RemoveLogGroup(Region:string, LogGroup:string){
		for(var i=0; i<CloudWatchService.Instance.LogGroupList.length; i++)
		{
			if(CloudWatchService.Instance.LogGroupList[i].Region === Region && CloudWatchService.Instance.LogGroupList[i].LogGroup === LogGroup)
			{
				CloudWatchService.Instance.LogGroupList.splice(i, 1);
				break;
			}
		}

		this.RemoveLogGroupNode(Region, LogGroup);
		this.Refresh();
	}
	
	LoadRegionNodeList(){
		this.RegionNodeList = [];
		if(!CloudWatchService.Instance) return;
		
		for(var item of CloudWatchService.Instance.LogGroupList)
		{
			this.AddNewLogGroupNode(item.Region, item.LogGroup);
		}
	}

	AddNewLogGroupNode(Region:string, LogGroup:string): CloudWatchTreeItem | undefined {
		let regionNode = this.RegionNodeList.find(node => node.label === Region);
		if(!regionNode)
		{
			regionNode = new CloudWatchTreeItem(Region, TreeItemType.CloudWatchRegion);
			regionNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
			regionNode.Region = Region;
			this.RegionNodeList.push(regionNode);
		}

		if (regionNode.Children.some(item => item.LogGroup === LogGroup)) { 
			return regionNode.Children.find(item => item.LogGroup === LogGroup);
		}

		let treeItem = new CloudWatchTreeItem(LogGroup, TreeItemType.CloudWatchLogGroup);
		treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		treeItem.Region = Region;
		treeItem.LogGroup = LogGroup;
		treeItem.Parent = regionNode;
		regionNode.Children.push(treeItem);
		return treeItem;
	}

	RemoveLogGroupNode(Region:string, LogGroup:string){
		let regionNode = this.RegionNodeList.find(node => node.label === Region);
		if(!regionNode) return;

		for(var i=0; i<regionNode.Children.length; i++)
		{
			if(regionNode.Children[i].LogGroup === LogGroup)
			{
				regionNode.Children.splice(i, 1);
				break;
			}
		}
		if(regionNode.Children.length === 0)
		{
			this.RegionNodeList = this.RegionNodeList.filter(node => node.label !== Region);
		}
	}


	getChildren(node: CloudWatchTreeItem): Thenable<CloudWatchTreeItem[]> {
		let result:CloudWatchTreeItem[] = [];

		if(!node)
		{
			result.push(...this.GetRegionNodes());
		}
		else if(node.Children.length > 0)
		{
			result.push(...node.Children);
		}
		else if(node.TreeItemType === TreeItemType.CloudWatchLogGroup)
		{
			return api.GetLogStreamList(node.Region!, node.LogGroup!).then(streams => {
				for(var stream of streams.result)
				{
					let streamNode = new CloudWatchTreeItem(stream, TreeItemType.CloudWatchLogStream);
					streamNode.Region = node.Region;
					streamNode.LogGroup = node.LogGroup;
					streamNode.LogStream = stream;
					streamNode.Parent = node;
					node.Children.push(streamNode);
				}
				return node.Children;
			});
		}

		return Promise.resolve(result);
	}


	GetRegionNodes(): CloudWatchTreeItem[]{
		var result: CloudWatchTreeItem[] = [];
		if(!CloudWatchService.Instance) return result;
		for (var node of this.RegionNodeList) {
			// Filtering at region level might be tricky, let's filter children
			let filteredChildren = node.Children.filter(child => {
				if (Session.Current?.FilterString && !child.IsFilterStringMatch(Session.Current?.FilterString)) { return false; }
				if (Session.Current?.IsShowOnlyFavorite && !(child.IsFav || child.IsAnyChidrenFav())) { return false; }
				if (Session.Current?.IsShowHiddenNodes && (child.IsHidden)) { return false; }
				return true;
			});

			if(filteredChildren.length > 0 || !Session.Current?.FilterString)
			{
				// We should return a copy or just mock the filtered children
				result.push(node);
			}
		}
		return result;
	}
	
	getTreeItem(element: CloudWatchTreeItem): CloudWatchTreeItem {
		return element;
	}
}