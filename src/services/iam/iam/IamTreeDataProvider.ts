/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { IamTreeItem, TreeItemType } from './IamTreeItem';
import { IamTreeView } from './IamTreeView';

export class IamTreeDataProvider implements vscode.TreeDataProvider<IamTreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<IamTreeItem | undefined | void> = new vscode.EventEmitter<IamTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<IamTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	
	IamRoleNodeList: IamTreeItem[] = [];

	constructor() {
		
	}

	Refresh(): void {
		if(this.IamRoleNodeList.length === 0){ this.LoadIamRoleNodeList(); }
		this._onDidChangeTreeData.fire();
	}

	AddIamRole(Region:string, IamRole:string){
		for(var item of IamTreeView.Current.IamRoleList)
		{
			if(item.Region === Region && item.IamRole === IamRole)
			{
				return;
			}
		}
		
		IamTreeView.Current.IamRoleList.push({Region: Region, IamRole: IamRole});
		this.AddNewIamRoleNode(Region, IamRole);
		this.Refresh();
	}

	RemoveIamRole(Region:string, IamRole:string){
		for(var i=0; i<IamTreeView.Current.IamRoleList.length; i++)
		{
			if(IamTreeView.Current.IamRoleList[i].Region === Region && IamTreeView.Current.IamRoleList[i].IamRole === IamRole)
			{
				IamTreeView.Current.IamRoleList.splice(i, 1);
				break;
			}
		}

		this.RemoveIamRoleNode(Region, IamRole);
		this.Refresh();
	}
	
	LoadIamRoleNodeList(){
		this.IamRoleNodeList = [];
		
		for(var item of IamTreeView.Current.IamRoleList)
		{
			let treeItem = this.NewIamRoleNode(item.Region, item.IamRole);

			this.IamRoleNodeList.push(treeItem);
		}
	}

	AddNewIamRoleNode(Region:string, IamRole:string){
		if (this.IamRoleNodeList.some(item => item.Region === Region && item.IamRole === IamRole)) { return; }

		let treeItem = this.NewIamRoleNode(Region, IamRole);
		this.IamRoleNodeList.push(treeItem);
	}

	RemoveIamRoleNode(Region:string, IamRole:string){
		for(var i=0; i<this.IamRoleNodeList.length; i++)
		{
			if(this.IamRoleNodeList[i].Region === Region && this.IamRoleNodeList[i].IamRole === IamRole)
			{
				this.IamRoleNodeList.splice(i, 1);
				break;
			}
		}
	}

	private NewIamRoleNode(Region: string, IamRole: string) : IamTreeItem
	{
		let treeItem = new IamTreeItem(IamRole, TreeItemType.IamRole);
		treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		treeItem.Region = Region;
		treeItem.IamRole = IamRole;

		// Add Permissions Group
		let permissionsItem = new IamTreeItem("Permissions", TreeItemType.PermissionsGroup);
		permissionsItem.IamRole = treeItem.IamRole;
		permissionsItem.Region = treeItem.Region;
		permissionsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		permissionsItem.Parent = treeItem;
		treeItem.Children.push(permissionsItem);

		// Add Trust Relationships Group
		let trustItem = new IamTreeItem("Trust Relationships", TreeItemType.TrustRelationshipsGroup);
		trustItem.IamRole = treeItem.IamRole;
		trustItem.Region = treeItem.Region;
		trustItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		trustItem.Parent = treeItem;
		treeItem.Children.push(trustItem);

		// Add Tags Group
		let tagsItem = new IamTreeItem("Tags", TreeItemType.TagsGroup);
		tagsItem.IamRole = treeItem.IamRole;
		tagsItem.Region = treeItem.Region;
		tagsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		tagsItem.Parent = treeItem;
		treeItem.Children.push(tagsItem);

		// Add Info Group
		let infoItem = new IamTreeItem("Info", TreeItemType.InfoGroup);
		infoItem.IamRole = treeItem.IamRole;
		infoItem.Region = treeItem.Region;
		infoItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		infoItem.Parent = treeItem;
		treeItem.Children.push(infoItem);

		return treeItem;
	}

	getChildren(node: IamTreeItem): Thenable<IamTreeItem[]> {
		let result:IamTreeItem[] = [];

		if(!node)
		{
			result.push(...this.GetIamRoleNodes());
		}
		else if(node.TreeItemType === TreeItemType.PermissionsGroup && node.Children.length === 0)
		{
			// Auto-load permissions when the node is expanded
			IamTreeView.Current.LoadPermissions(node);
		}
		else if(node.TreeItemType === TreeItemType.TrustRelationshipsGroup && node.Children.length === 0)
		{
			// Auto-load trust relationships when the node is expanded
			IamTreeView.Current.LoadTrustRelationships(node);
		}
		else if(node.TreeItemType === TreeItemType.TagsGroup && node.Children.length === 0)
		{
			// Auto-load tags when the node is expanded
			IamTreeView.Current.LoadTags(node);
		}
		else if(node.TreeItemType === TreeItemType.InfoGroup && node.Children.length === 0)
		{
			// Auto-load info when the node is expanded
			IamTreeView.Current.LoadInfo(node);
		}
		else if(node.Children.length > 0)
		{
			result.push(...node.Children);
		}

		return Promise.resolve(result);
	}


	GetIamRoleNodes(): IamTreeItem[]{
		var result: IamTreeItem[] = [];
		for (var node of this.IamRoleNodeList) {
			if (IamTreeView.Current && IamTreeView.Current.FilterString && !node.IsFilterStringMatch(IamTreeView.Current.FilterString)) { continue; }
			if (IamTreeView.Current && IamTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (IamTreeView.Current && !IamTreeView.Current.isShowHiddenNodes && (node.IsHidden)) { continue; }

			result.push(node);
		}
		return result;
	}
	
	getTreeItem(element: IamTreeItem): IamTreeItem {
		return element;
	}
}

export enum ViewType{
	IamRole = 1
}