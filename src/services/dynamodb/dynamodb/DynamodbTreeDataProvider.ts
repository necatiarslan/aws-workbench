/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { DynamodbTreeItem, TreeItemType } from './DynamodbTreeItem';
import { DynamodbTreeView } from './DynamodbTreeView';
import * as api from '../common/API';

export class DynamodbTreeDataProvider implements vscode.TreeDataProvider<DynamodbTreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<DynamodbTreeItem | undefined | void> = new vscode.EventEmitter<DynamodbTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<DynamodbTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	
	DynamodbNodeList: DynamodbTreeItem[] = [];

	constructor() {
		
	}

	Refresh(): void {
		if(this.DynamodbNodeList.length === 0){ this.LoadDynamodbNodeList(); }
		this._onDidChangeTreeData.fire();
	}

	AddDynamodb(Region:string, Dynamodb:string){
		for(var item of DynamodbTreeView.Current.DynamodbList)
		{
			if(item.Region === Region && item.Dynamodb === Dynamodb)
			{
				return;
			}
		}
		
		DynamodbTreeView.Current.DynamodbList.push({Region: Region, Dynamodb: Dynamodb});
		this.AddNewDynamodbNode(Region, Dynamodb);
		this.Refresh();
	}

	RemoveDynamodb(Region:string, Dynamodb:string){
		for(var i=0; i<DynamodbTreeView.Current.DynamodbList.length; i++)
		{
			if(DynamodbTreeView.Current.DynamodbList[i].Region === Region && DynamodbTreeView.Current.DynamodbList[i].Dynamodb === Dynamodb)
			{
				DynamodbTreeView.Current.DynamodbList.splice(i, 1);
				break;
			}
		}

		this.RemoveDynamodbNode(Region, Dynamodb);
		this.Refresh();
	}
	
	AddResponsePayload(node: DynamodbTreeItem, payloadString: string) {
		let now = new Date();
		let currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
						now.getMinutes().toString().padStart(2, '0') + ':' + 
						now.getSeconds().toString().padStart(2, '0');

		let treeItem = new DynamodbTreeItem("Response - " + currentTime, TreeItemType.ResponsePayload);
		treeItem.Region = node.Region;
		treeItem.Dynamodb = node.Dynamodb;
		treeItem.ResponsePayload = payloadString
		treeItem.Parent = node
		node.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed
		node.Children.push(treeItem)
		this.Refresh();
	}

	AddLogStreams(node: DynamodbTreeItem, LogStreams:string[]){
		for(var streamName of LogStreams)
		{
			if(node.Children.find((item) => item.LogStreamName === streamName)){ continue; }
			
			let treeItem = new DynamodbTreeItem(streamName, TreeItemType.LogStream);
			treeItem.Region = node.Region;
			treeItem.Dynamodb = node.Dynamodb;
			treeItem.LogStreamName = streamName
			treeItem.Parent = node
			node.Children.push(treeItem)
		}
		this.Refresh();
	}
	LoadDynamodbNodeList(){
		this.DynamodbNodeList = [];
		
		for(var item of DynamodbTreeView.Current.DynamodbList)
		{
			let treeItem = this.NewDynamodbNode(item.Region, item.Dynamodb);

			this.DynamodbNodeList.push(treeItem);
		}
	}

	AddNewDynamodbNode(Region:string, Dynamodb:string){
		if (this.DynamodbNodeList.some(item => item.Region === Region && item.Dynamodb === Dynamodb)) { return; }

		let treeItem = this.NewDynamodbNode(Region, Dynamodb);
		this.DynamodbNodeList.push(treeItem);
	}

	RemoveDynamodbNode(Region:string, Dynamodb:string){
		for(var i=0; i<this.DynamodbNodeList.length; i++)
		{
			if(this.DynamodbNodeList[i].Region === Region && this.DynamodbNodeList[i].Dynamodb === Dynamodb)
			{
				this.DynamodbNodeList.splice(i, 1);
				break;
			}
		}
	}

	private NewDynamodbNode(Region: string, Dynamodb: string) : DynamodbTreeItem
	{
		let treeItem = new DynamodbTreeItem(Dynamodb, TreeItemType.Dynamodb);
		treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		treeItem.Region = Region;
		treeItem.Dynamodb = Dynamodb;

		// Primary Keys node
		let primaryKeyItem = new DynamodbTreeItem("Primary Keys", TreeItemType.PrimaryKey);
		primaryKeyItem.Dynamodb = treeItem.Dynamodb;
		primaryKeyItem.Region = treeItem.Region;
		primaryKeyItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		primaryKeyItem.Parent = treeItem;
		treeItem.Children.push(primaryKeyItem);

		// Capacity node
		let capacityItem = new DynamodbTreeItem("Capacity", TreeItemType.Capacity);
		capacityItem.Dynamodb = treeItem.Dynamodb;
		capacityItem.Region = treeItem.Region;
		capacityItem.Parent = treeItem;
		treeItem.Children.push(capacityItem);

		// Table Info node
		let tableInfoItem = new DynamodbTreeItem("Table Info", TreeItemType.TableInfo);
		tableInfoItem.Dynamodb = treeItem.Dynamodb;
		tableInfoItem.Region = treeItem.Region;
		tableInfoItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		tableInfoItem.Parent = treeItem;
		treeItem.Children.push(tableInfoItem);

		// Indexes node
	let indexesItem = new DynamodbTreeItem("Indexes", TreeItemType.Indexes);
	indexesItem.Dynamodb = treeItem.Dynamodb;
	indexesItem.Region = treeItem.Region;
	indexesItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
	indexesItem.Parent = treeItem;
	treeItem.Children.push(indexesItem);

	// Tags node
	let tagsItem = new DynamodbTreeItem("Tags", TreeItemType.Tags);
	tagsItem.Dynamodb = treeItem.Dynamodb;
	tagsItem.Region = treeItem.Region;
	tagsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
	tagsItem.Parent = treeItem;
	treeItem.Children.push(tagsItem);

	return treeItem;
	}

	async PopulateTableDetails(node: DynamodbTreeItem) {
		if (!node || node.TreeItemType !== TreeItemType.Dynamodb) { return; }
		
		try {
			const response = await api.GetDynamodb(node.Region, node.Dynamodb);
			if (!response.isSuccessful || !response.result) { return; }

			const details = api.ExtractTableDetails(response.result);

			// Find and populate Primary Keys node
			const primaryKeyNode = node.Children.find(c => c.TreeItemType === TreeItemType.PrimaryKey);
			if (primaryKeyNode) {
				primaryKeyNode.Children = [];
				
				if (details.partitionKey) {
					const pkItem = new DynamodbTreeItem(
						`Partition Key: ${details.partitionKey.name} (${details.partitionKey.type})`,
						TreeItemType.PartitionKey
					);
					pkItem.Parent = primaryKeyNode;
					primaryKeyNode.Children.push(pkItem);
				}
				
				if (details.sortKey) {
					const skItem = new DynamodbTreeItem(
						`Sort Key: ${details.sortKey.name} (${details.sortKey.type})`,
						TreeItemType.SortKey
					);
					skItem.Parent = primaryKeyNode;
					primaryKeyNode.Children.push(skItem);
				}
			}

			// Update Capacity node
		const capacityNode = node.Children.find(c => c.TreeItemType === TreeItemType.Capacity);
	if (capacityNode) {
		capacityNode.Children = [];
		capacityNode.tooltip = 'Click on read/write capacity for detailed information';
		
		if (details.billingMode === 'PAY_PER_REQUEST') {
			capacityNode.label = `Capacity: On-Demand (${details.billingMode})`;
			capacityNode.collapsibleState = vscode.TreeItemCollapsibleState.None;
		} else {
			capacityNode.label = `Capacity: Provisioned`;
			capacityNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
			
			// Add Read Capacity sub-node
			const readCapacityItem = new DynamodbTreeItem(
				`Read Capacity: ${details.readCapacity || 0}`,
				TreeItemType.ReadCapacity
			);
			readCapacityItem.Parent = capacityNode;
			readCapacityItem.Region = node.Region;
			readCapacityItem.Dynamodb = node.Dynamodb;
			readCapacityItem.ReadCapacity = details.readCapacity;
			readCapacityItem.tooltip = 'Click for read capacity details';
			readCapacityItem.command = {
				command: 'dynamodb.showCapacityExplanation',
				title: 'Show Capacity Explanation',
				arguments: [readCapacityItem, 'read']
			};
			capacityNode.Children.push(readCapacityItem);
			
			// Add Write Capacity sub-node
			const writeCapacityItem = new DynamodbTreeItem(
				`Write Capacity: ${details.writeCapacity || 0}`,
				TreeItemType.WriteCapacity
			);
			writeCapacityItem.Parent = capacityNode;
			writeCapacityItem.Region = node.Region;
			writeCapacityItem.Dynamodb = node.Dynamodb;
			writeCapacityItem.WriteCapacity = details.writeCapacity;
			writeCapacityItem.tooltip = 'Click for write capacity details';
			writeCapacityItem.command = {
				command: 'dynamodb.showCapacityExplanation',
				title: 'Show Capacity Explanation',
				arguments: [writeCapacityItem, 'write']
			};
			capacityNode.Children.push(writeCapacityItem);
		}
	}

			// Update Table Info node with children
		const tableInfoNode = node.Children.find(c => c.TreeItemType === TreeItemType.TableInfo);
		if (tableInfoNode) {
			tableInfoNode.Children = [];
			tableInfoNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
			
			// Add Size node
			const sizeInMB = details.tableSize ? (details.tableSize / (1024 * 1024)).toFixed(2) : '0';
			const sizeNode = new DynamodbTreeItem(
				`Size: ${sizeInMB} MB`,
				TreeItemType.TableSize
			);
			sizeNode.Parent = tableInfoNode;
			tableInfoNode.Children.push(sizeNode);
			
			// Add Item Count node
			const itemCountNode = new DynamodbTreeItem(
				`Item Count: ${details.itemCount || 0}`,
				TreeItemType.ItemCount
			);
			itemCountNode.Parent = tableInfoNode;
			tableInfoNode.Children.push(itemCountNode);
			
			// Add Table Class node
			const tableClassNode = new DynamodbTreeItem(
				`Table Class: ${details.tableClass || 'STANDARD'}`,
				TreeItemType.TableClass
			);
			tableClassNode.Parent = tableInfoNode;
			tableInfoNode.Children.push(tableClassNode);
			
			// Add Table Status node
		const tableStatusNode = new DynamodbTreeItem(
			`Status: ${details.tableStatus || 'UNKNOWN'}`,
			TreeItemType.TableStatus
		);
		tableStatusNode.Parent = tableInfoNode;
		tableInfoNode.Children.push(tableStatusNode);
		
		// Add Table ARN node
		if (details.tableArn) {
			const arnNode = new DynamodbTreeItem(
				`ARN: ${details.tableArn}`,
				TreeItemType.TableArn
			);
			arnNode.Parent = tableInfoNode;
			tableInfoNode.Children.push(arnNode);
		}
		
		// Add Average Item Size node
		if (details.averageItemSize !== undefined) {
			const avgSizeNode = new DynamodbTreeItem(
				`Avg Item Size: ${details.averageItemSize} bytes`,
				TreeItemType.AverageItemSize
			);
			avgSizeNode.Parent = tableInfoNode;
			tableInfoNode.Children.push(avgSizeNode);
		}
	}

			// Populate Indexes node
			const indexesNode = node.Children.find(c => c.TreeItemType === TreeItemType.Indexes);
			if (indexesNode) {
				indexesNode.Children = [];
				
				if (details.globalSecondaryIndexes) {
					for (const gsi of details.globalSecondaryIndexes) {
						const indexItem = new DynamodbTreeItem(
							`GSI: ${gsi.name} - ${gsi.keys}`,
							TreeItemType.Index
						);
						indexItem.Parent = indexesNode;
						indexesNode.Children.push(indexItem);
					}
				}
				
				if (details.localSecondaryIndexes) {
					for (const lsi of details.localSecondaryIndexes) {
						const indexItem = new DynamodbTreeItem(
							`LSI: ${lsi.name} - ${lsi.keys}`,
							TreeItemType.Index
						);
						indexItem.Parent = indexesNode;
						indexesNode.Children.push(indexItem);
					}
				}

				if (indexesNode.Children.length === 0) {
				indexesNode.label = "Indexes: None";
			}
		}

		// Populate Tags node
		const tagsNode = node.Children.find(c => c.TreeItemType === TreeItemType.Tags);
		if (tagsNode && details.tableArn) {
			tagsNode.Children = [];
			
			// Fetch tags from AWS
			const tagsResponse = await api.GetTableTags(node.Region, details.tableArn);
			if (tagsResponse.isSuccessful && tagsResponse.result && tagsResponse.result.length > 0) {
				for (const tag of tagsResponse.result) {
					const tagItem = new DynamodbTreeItem(
						`${tag.key}: ${tag.value}`,
						TreeItemType.TagItem
					);
					tagItem.Parent = tagsNode;
					tagsNode.Children.push(tagItem);
				}
				tagsNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
			} else {
				tagsNode.label = "Tags: None";
				tagsNode.collapsibleState = vscode.TreeItemCollapsibleState.None;
			}
		}

		this.Refresh();
	} catch (error) {
		// Silently fail - details will not be populated
	}
}

	AddPayloadPath(node: DynamodbTreeItem, PayloadPath:string){
		
		for(var i=0; i<DynamodbTreeView.Current.PayloadPathList.length; i++)
		{
			if(DynamodbTreeView.Current.PayloadPathList[i].Region === node.Region 
				&& DynamodbTreeView.Current.CodePathList[i].Dynamodb === node.Dynamodb
				&& DynamodbTreeView.Current.PayloadPathList[i].PayloadPath === PayloadPath)
			{
				return;
			}
		}
		this.AddNewPayloadPathNode(node, PayloadPath);
		DynamodbTreeView.Current.PayloadPathList.push({Region: node.Region, Dynamodb: node.Dynamodb, PayloadPath: PayloadPath});
		this.Refresh();
	}

	private AddNewPayloadPathNode(node: DynamodbTreeItem, PayloadPath: string) {
		let fileName = PayloadPath.split("/").pop();
		if (!fileName) { fileName = PayloadPath; }

		let treeItem = new DynamodbTreeItem(fileName, TreeItemType.TriggerFilePayload);
		treeItem.Region = node.Region;
		treeItem.Dynamodb = node.Dynamodb;
		treeItem.PayloadPath = PayloadPath;
		treeItem.Parent = node;
		node.Children.push(treeItem);
	}

	RemovePayloadPath(node: DynamodbTreeItem){
		if(!node.Parent) { return; }

		for(var i=0; i<DynamodbTreeView.Current.PayloadPathList.length; i++)
		{
			if(DynamodbTreeView.Current.PayloadPathList[i].Region === node.Region 
				&& DynamodbTreeView.Current.PayloadPathList[i].Dynamodb === node.Dynamodb
				&& DynamodbTreeView.Current.PayloadPathList[i].PayloadPath === node.PayloadPath
			)
			{
				DynamodbTreeView.Current.PayloadPathList.splice(i, 1);
			}
		}
		
		let parentNode = node.Parent;
		for(var i=0; i<parentNode.Children.length; i++)
		{
			if(parentNode.Children[i].Region === node.Region 
				&& parentNode.Children[i].Dynamodb === node.Dynamodb
				&& parentNode.Children[i].PayloadPath === node.PayloadPath
			)
			{
				parentNode.Children.splice(i, 1);
			}
		}
		this.Refresh();
	}

	AddCodePath(Region:string, Dynamodb:string, CodePath:string){
		//remove old
		for(var i=0; i<DynamodbTreeView.Current.CodePathList.length; i++)
		{
			if(DynamodbTreeView.Current.CodePathList[i].Region === Region && DynamodbTreeView.Current.CodePathList[i].Dynamodb === Dynamodb)
			{
				DynamodbTreeView.Current.CodePathList.splice(i, 1);
			}
		}
		
		DynamodbTreeView.Current.CodePathList.push({Region: Region, Dynamodb: Dynamodb, CodePath: CodePath});
		this.Refresh();
	}

	RemoveCodePath(Region:string, Dynamodb:string){
		for(var i=0; i<DynamodbTreeView.Current.CodePathList.length; i++)
		{
			if(DynamodbTreeView.Current.CodePathList[i].Region === Region && DynamodbTreeView.Current.CodePathList[i].Dynamodb === Dynamodb)
			{
				DynamodbTreeView.Current.CodePathList.splice(i, 1);
			}
		}
		this.Refresh();
	}

	GetCodePath(Region:string, Dynamodb:string){
		for(var item of DynamodbTreeView.Current.CodePathList)
		{
			if(item.Region === Region && item.Dynamodb === Dynamodb)
			{
				return item.CodePath;
			}
		}
		return "";
	}

	getChildren(node: DynamodbTreeItem): Thenable<DynamodbTreeItem[]> {
		let result:DynamodbTreeItem[] = [];

		if(!node)
		{
			result.push(...this.GetDynamodbNodes());
		}
		else if(node.Children.length > 0)
		{
			result.push(...node.Children);
		}

		return Promise.resolve(result);
	}


	GetDynamodbNodes(): DynamodbTreeItem[]{
		var result: DynamodbTreeItem[] = [];
		for (var node of this.DynamodbNodeList) {
			if (DynamodbTreeView.Current && DynamodbTreeView.Current.FilterString && !node.IsFilterStringMatch(DynamodbTreeView.Current.FilterString)) { continue; }
			if (DynamodbTreeView.Current && DynamodbTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (DynamodbTreeView.Current && !DynamodbTreeView.Current.isShowHiddenNodes && (node.IsHidden)) { continue; }

			result.push(node);
		}
		return result;
	}
	
	getTreeItem(element: DynamodbTreeItem): DynamodbTreeItem {
		return element;
	}
}

export enum ViewType{
	Dynamodb = 1
}