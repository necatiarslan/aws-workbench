/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { S3TreeItem, TreeItemType } from './S3TreeItem';
import { S3TreeView } from './S3TreeView';
import * as ui from '../common/UI';

export class S3TreeDataProvider implements vscode.TreeDataProvider<S3TreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<S3TreeItem | undefined | void> = new vscode.EventEmitter<S3TreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<S3TreeItem | undefined | void> = this._onDidChangeTreeData.event;
	
	BucketNodeList: S3TreeItem[] = [];
	ShortcutNodeList: S3TreeItem[] = [];
	FolderNodeList: S3TreeItem[] = [];

	public BucketList: string[] = [];
	public ShortcutList: { Bucket:string, Shortcut:string }[] = [];
	public ViewType:ViewType = ViewType.Bucket_Shortcut;
	public BucketProfileList: { Bucket:string, Profile:string }[] = [];

	constructor() {
		
	}

	Refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	public GetBucketList(){
		return this.BucketList;
	}

	public GetShortcutList(){
		return this.ShortcutList;
	}

	public SetBucketList(BucketList: string[]){
		this.BucketList = BucketList;
		this.LoadBucketNodeList();
	}

	public SetShortcutList(ShortcutList: { Bucket:string, Shortcut:string }[]){
		this.ShortcutList = ShortcutList;
		this.LoadShortcutNodeList();
	}

	public AddBucketProfile(Bucket:string, Profile:string){
		if(!Bucket || !Profile) { return; }
		
		let profile = this.GetBucketProfile(Bucket);
		if(profile === Profile){ return; }
		if(profile && profile !== Profile){ this.RemoveBucketProfile(Bucket); }

		this.BucketProfileList.push({Bucket:Bucket, Profile:Profile});
	}

	public RemoveBucketProfile(Bucket:string){
		for(let i = 0; i < this.BucketProfileList.length; i++)
		{
			if(this.BucketProfileList[i].Bucket === Bucket)
			{
				this.BucketProfileList.splice(i, 1);
				i--;
			}
		}
	}

	public GetBucketProfile(Bucket:string){
		for(let i = 0; i < this.BucketProfileList.length; i++)
		{
			if(this.BucketProfileList[i].Bucket === Bucket)
			{
				return this.BucketProfileList[i].Profile;
			}
		}
		return "";
	}

	AddBucket(Bucket:string, parentNode?: S3TreeItem){
		if(this.BucketList.includes(Bucket)){ return; }

		this.BucketList.push(Bucket);
		
		let treeItem = new S3TreeItem(Bucket, TreeItemType.Bucket);
		treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		treeItem.Bucket = Bucket;
		treeItem.ProfileToShow = this.GetBucketProfile(Bucket);
		
		if (parentNode && parentNode.TreeItemType === TreeItemType.Folder) {
			if (!parentNode.Children) { parentNode.Children = []; }
			parentNode.Children.push(treeItem);
			treeItem.Parent = parentNode;
		} else {
			this.BucketNodeList.push(treeItem);
		}
		
		this.Refresh();
	}

	RemoveBucket(Bucket:string){
		for(let i = 0; i < this.ShortcutList.length; i++)
		{
			if(this.ShortcutList[i]["Bucket"] === Bucket)
			{
				this.ShortcutList.splice(i, 1);
				i--;
			}
		}
		this.LoadShortcutNodeList();

		for(let i = 0; i < this.BucketList.length; i++)
		{
			if(this.BucketList[i] === Bucket)
			{
				this.BucketList.splice(i, 1);
				i--;
			}
		}
		this.LoadBucketNodeList();
		this.Refresh();
	}

	RemoveAllShortcuts(Bucket:string){
		for(let i = 0; i < this.ShortcutList.length; i++)
		{
			if(this.ShortcutList[i]["Bucket"] === Bucket)
			{
				this.ShortcutList.splice(i, 1);
				i--;
			}
		}
		this.LoadShortcutNodeList();
		this.Refresh();
	}

	DoesShortcutExists(Bucket:string, Key:string):boolean{
		if(!Bucket || !Key) { return false; }

		for(var ls of this.ShortcutList)
		{
			if(ls["Bucket"] === Bucket && ls["Shortcut"] === Key)
			{
				return true;
			}
		}
		return false;
	}

	AddShortcut(Bucket:string, Key:string){
		if(!Bucket || !Key) { return; }
		
		if(this.DoesShortcutExists(Bucket, Key))
		{
			return;
		}

		this.ShortcutList.push({Bucket:Bucket, Shortcut:Key});
		this.LoadShortcutNodeList();
		this.Refresh();
	}

	RemoveShortcut(Bucket:string, Shortcut:string){
		for(let i = 0; i < this.ShortcutList.length; i++)
		{
			if(this.ShortcutList[i]["Bucket"] === Bucket && this.ShortcutList[i]["Shortcut"] === Shortcut)
			{
				this.ShortcutList.splice(i, 1);
				i--;
			}
		}
		this.LoadShortcutNodeList();
		this.Refresh();
	}

	UpdateShortcut(Bucket:string, Shortcut:string, NewShortcut:string){
		for(let i = 0; i < this.ShortcutList.length; i++)
		{
			if(this.ShortcutList[i]["Bucket"] === Bucket && this.ShortcutList[i]["Shortcut"] === Shortcut)
			{
				this.ShortcutList[i]["Shortcut"] = NewShortcut
			}
		}
		this.LoadShortcutNodeList();
		this.Refresh();
	}

	AddFolder(folderName: string, folderPath: string, parentNode?: S3TreeItem) {
		ui.logToOutput('S3TreeDataProvider.AddFolder Started');
		
		let folder = new S3TreeItem(folderName, TreeItemType.Folder);
		folder.FolderPath = folderPath;
		folder.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		
		if (parentNode && parentNode.TreeItemType === TreeItemType.Folder) {
			if (!parentNode.Children) { parentNode.Children = []; }
			parentNode.Children.push(folder);
			folder.Parent = parentNode;
		} else {
			this.FolderNodeList.push(folder);
		}
		
		this.Refresh();
	}

	RenameFolder(node: S3TreeItem, newName: string) {
		ui.logToOutput('S3TreeDataProvider.RenameFolder Started');
		
		node.Text = newName;
		node.label = newName;
		
		// Update folder path
		const oldPath = node.FolderPath || '';
		const parentPath = node.Parent?.FolderPath || '';
		const newPath = parentPath ? `${parentPath}/${newName}` : newName;
		
		// Update this folder and all children recursively
		this.updateFolderPathsRecursive(node, oldPath, newPath);
		
		this.Refresh();
	}

	RemoveFolder(node: S3TreeItem) {
		ui.logToOutput('S3TreeDataProvider.RemoveFolder Started');
		
		if (node.Parent) {
			const index = node.Parent.Children.indexOf(node);
			if (index > -1) {
				node.Parent.Children.splice(index, 1);
			}
		} else {
			const index = this.FolderNodeList.indexOf(node);
			if (index > -1) {
				this.FolderNodeList.splice(index, 1);
			}
		}
		
		this.Refresh();
	}

	private updateFolderPathsRecursive(node: S3TreeItem, oldPath: string, newPath: string) {
		node.FolderPath = newPath;
		
		if (node.Children) {
			for (const child of node.Children) {
				if (child.FolderPath) {
					child.FolderPath = child.FolderPath.replace(oldPath, newPath);
				}
				if (child.TreeItemType === TreeItemType.Folder) {
					this.updateFolderPathsRecursive(child, oldPath, newPath);
				}
			}
		}
	}

	LoadBucketNodeList(){
		this.BucketNodeList = [];
		
		for(var bucket of this.BucketList)
		{
			let treeItem = new S3TreeItem(bucket, TreeItemType.Bucket);
			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
			treeItem.Bucket = bucket;
			treeItem.ProfileToShow = this.GetBucketProfile(bucket);
			this.BucketNodeList.push(treeItem);
		}
	}

	LoadShortcutNodeList(){
		this.ShortcutNodeList = [];
		
		for(var lg of this.ShortcutList)
		{
			let treeItem = new S3TreeItem(lg["Shortcut"], TreeItemType.Shortcut);
			treeItem.Bucket = lg["Bucket"];
			treeItem.Shortcut = lg["Shortcut"];
			this.ShortcutNodeList.push(treeItem);
		}
	}

	getChildren(node: S3TreeItem): Thenable<S3TreeItem[]> {
		let result:S3TreeItem[] = [];

		if(this.ViewType === ViewType.Bucket_Shortcut)
		{
			result = this.GetNodesBucketShortcut(node);
		}

		return Promise.resolve(result);
	}

	GetNodesShortcut(node: S3TreeItem):S3TreeItem[]
	{
		let result:S3TreeItem[] = [];
		result = this.GetShortcutNodes();
		return result;
	}

	GetNodesBucketShortcut(node: S3TreeItem):S3TreeItem[]
	{
		let result:S3TreeItem[] = [];
		
		if (!node) {
			// Root level - show folders and buckets
			result = [...this.GetFolderNodes(), ...this.GetBucketNodes()];
		}
		else if(node.TreeItemType === TreeItemType.Folder){
			// Folder - show children
			result = node.Children || [];
		}
		else if(node.TreeItemType === TreeItemType.Bucket){
			result = this.GetShortcutNodesParentBucket(node);
		}

		return result;
	}

	GetBucketNodes(): S3TreeItem[]{
		var result: S3TreeItem[] = [];
		for (var node of this.BucketNodeList) {
			if (S3TreeView.Current && S3TreeView.Current.FilterString && !node.IsFilterStringMatch(S3TreeView.Current.FilterString)) { continue; }
			if (S3TreeView.Current && S3TreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (S3TreeView.Current && !S3TreeView.Current.isShowHiddenNodes && (node.IsHidden)) { continue; }
			if (S3TreeView.Current && !S3TreeView.Current.isShowHiddenNodes && (node.ProfileToShow && node.ProfileToShow !== S3TreeView.Current.AwsProfile)) { continue; }
			
			result.push(node);
		}
		return result;
	}

	GetFolderNodes(): S3TreeItem[]{
		var result: S3TreeItem[] = [];
		for (var node of this.FolderNodeList) {
			if (S3TreeView.Current && S3TreeView.Current.FilterString && !node.IsFilterStringMatch(S3TreeView.Current.FilterString)) { continue; }
			if (S3TreeView.Current && S3TreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (S3TreeView.Current && !S3TreeView.Current.isShowHiddenNodes && (node.IsHidden)) { continue; }
			
			result.push(node);
		}
		return result;
	}

	GetTreeStructure(): any[] {
		const { TreeItemType } = require('./S3TreeItem');
		
		const buildTree = (nodes: S3TreeItem[]): any[] => {
			const items: any[] = [];
			
			for (const node of nodes) {
				if (node.TreeItemType === TreeItemType.Folder) {
					const children = node.Children ? buildTree(node.Children) : [];
					items.push({
						type: 'folder',
						name: node.Text,
						children: children
					});
				} else if (node.TreeItemType === TreeItemType.Bucket) {
					const shortcuts: string[] = [];
					if (node.Children) {
						for (const child of node.Children) {
							if (child.TreeItemType === TreeItemType.Shortcut) {
								shortcuts.push(child.Shortcut || '');
							}
						}
					}
					
					items.push({
						type: 'bucket',
						name: node.Bucket || '',
						shortcuts: shortcuts
					});
				}
			}
			return items;
		};

		// Combine root folders and root buckets
		const rootNodes = [...this.FolderNodeList, ...this.BucketNodeList];
		return buildTree(rootNodes);
	}

	LoadFromTreeStructure(tree: any[]) {
		const { TreeItemType } = require('./S3TreeItem');
		
		// Clear existing lists
		this.BucketList = [];
		this.ShortcutList = [];
		this.BucketNodeList = [];
		this.FolderNodeList = [];
		this.ShortcutNodeList = [];

		const processItem = (item: any, parentNode?: S3TreeItem) => {
			if (item.type === 'folder') {
				// Create folder node
				const folder = new S3TreeItem(item.name, TreeItemType.Folder);
				folder.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
				
				// Set path
				const parentPath = parentNode?.FolderPath || '';
				folder.FolderPath = parentPath ? `${parentPath}/${item.name}` : item.name;

				// Add to parent or root list
				if (parentNode) {
					if (!parentNode.Children) { parentNode.Children = []; }
					parentNode.Children.push(folder);
					folder.Parent = parentNode;
				} else {
					this.FolderNodeList.push(folder);
				}

				// Process children
				if (item.children) {
					for (const child of item.children) {
						processItem(child, folder);
					}
				}

			} else if (item.type === 'bucket') {
				// Add to bucket list if not exists
				if (!this.BucketList.includes(item.name)) {
					this.BucketList.push(item.name);
				}

				// Create bucket node
				const bucketNode = new S3TreeItem(item.name, TreeItemType.Bucket);
				bucketNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
				bucketNode.Bucket = item.name;
				bucketNode.ProfileToShow = this.GetBucketProfile(item.name);

				// Add to parent or root list
				if (parentNode) {
					if (!parentNode.Children) { parentNode.Children = []; }
					parentNode.Children.push(bucketNode);
					bucketNode.Parent = parentNode;
				} else {
					this.BucketNodeList.push(bucketNode);
				}

				// Process shortcuts
				if (item.shortcuts) {
					for (const shortcut of item.shortcuts) {
						this.ShortcutList.push({ Bucket: item.name, Shortcut: shortcut });
						
						const shortcutNode = new S3TreeItem(shortcut, TreeItemType.Shortcut);
						shortcutNode.Bucket = item.name;
						shortcutNode.Shortcut = shortcut;
						shortcutNode.Parent = bucketNode;
						
						if (!bucketNode.Children) { bucketNode.Children = []; }
						bucketNode.Children.push(shortcutNode);
						this.ShortcutNodeList.push(shortcutNode);
					}
				}
			}
		};

		for (const item of tree) {
			processItem(item);
		}
		
		this.Refresh();
	}

	GetShortcutNodesParentBucket(BucketNode:S3TreeItem): S3TreeItem[]{
		var result: S3TreeItem[] = [];
		for (var node of this.ShortcutNodeList) {
			if(!(node.Bucket === BucketNode.Bucket)) { continue; }
			if (S3TreeView.Current && S3TreeView.Current.FilterString && !node.IsFilterStringMatch(S3TreeView.Current.FilterString)) { continue; }
			if (S3TreeView.Current && S3TreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (S3TreeView.Current && !S3TreeView.Current.isShowHiddenNodes && (node.IsHidden)) { continue; }
			if (S3TreeView.Current && !S3TreeView.Current.isShowHiddenNodes && (node.ProfileToShow && node.ProfileToShow !== S3TreeView.Current.AwsProfile)) { continue; }

			node.Parent = BucketNode;
			if(BucketNode.Children.indexOf(node) === -1)
			{
				BucketNode.Children.push(node);
			}
			result.push(node);
		}
		return result;
	}

	GetShortcutNodes(): S3TreeItem[]{
		var result: S3TreeItem[] = [];
		for (var node of this.ShortcutNodeList) {
			if (S3TreeView.Current && S3TreeView.Current.FilterString && !node.IsFilterStringMatch(S3TreeView.Current.FilterString)) { continue; }
			if (S3TreeView.Current && S3TreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (S3TreeView.Current && !S3TreeView.Current.isShowHiddenNodes && (node.IsHidden)) { continue; }

			result.push(node);
		}
		return result;
	}
	
	getTreeItem(element: S3TreeItem): S3TreeItem {
		return element;
	}
}

export enum ViewType{
	Bucket_Shortcut = 1
}