"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamodbTreeDataProvider = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const DynamodbTreeItem_1 = require("./DynamodbTreeItem");
const DynamodbService_1 = require("./DynamodbService");
const api = require("./API");
class DynamodbTreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    DynamodbNodeList = [];
    constructor() {
    }
    Refresh() {
        if (this.DynamodbNodeList.length === 0) {
            this.LoadDynamodbNodeList();
        }
        this._onDidChangeTreeData.fire();
    }
    AddDynamodb(Region, Dynamodb) {
        for (var item of DynamodbService_1.DynamodbService.Instance.DynamodbList) {
            if (item.Region === Region && item.Dynamodb === Dynamodb) {
                return this.DynamodbNodeList.find(n => n.Region === Region && n.Dynamodb === Dynamodb);
            }
        }
        DynamodbService_1.DynamodbService.Instance.DynamodbList.push({ Region: Region, Dynamodb: Dynamodb });
        const node = this.AddNewDynamodbNode(Region, Dynamodb);
        this.Refresh();
        return node;
    }
    RemoveDynamodb(Region, Dynamodb) {
        for (var i = 0; i < DynamodbService_1.DynamodbService.Instance.DynamodbList.length; i++) {
            if (DynamodbService_1.DynamodbService.Instance.DynamodbList[i].Region === Region && DynamodbService_1.DynamodbService.Instance.DynamodbList[i].Dynamodb === Dynamodb) {
                DynamodbService_1.DynamodbService.Instance.DynamodbList.splice(i, 1);
                break;
            }
        }
        this.RemoveDynamodbNode(Region, Dynamodb);
        this.Refresh();
    }
    AddResponsePayload(node, payloadString) {
        let now = new Date();
        let currentTime = now.getHours().toString().padStart(2, '0') + ':' +
            now.getMinutes().toString().padStart(2, '0') + ':' +
            now.getSeconds().toString().padStart(2, '0');
        let treeItem = new DynamodbTreeItem_1.DynamodbTreeItem("Response - " + currentTime, DynamodbTreeItem_1.TreeItemType.ResponsePayload);
        treeItem.Region = node.Region;
        treeItem.Dynamodb = node.Dynamodb;
        treeItem.ResponsePayload = payloadString;
        treeItem.Parent = node;
        node.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        node.Children.push(treeItem);
        this.Refresh();
    }
    AddLogStreams(node, LogStreams) {
        for (var streamName of LogStreams) {
            if (node.Children.find((item) => item.LogStreamName === streamName)) {
                continue;
            }
            let treeItem = new DynamodbTreeItem_1.DynamodbTreeItem(streamName, DynamodbTreeItem_1.TreeItemType.LogStream);
            treeItem.Region = node.Region;
            treeItem.Dynamodb = node.Dynamodb;
            treeItem.LogStreamName = streamName;
            treeItem.Parent = node;
            node.Children.push(treeItem);
        }
        this.Refresh();
    }
    LoadDynamodbNodeList() {
        this.DynamodbNodeList = [];
        if (!DynamodbService_1.DynamodbService.Instance)
            return;
        for (var item of DynamodbService_1.DynamodbService.Instance.DynamodbList) {
            let treeItem = this.NewDynamodbNode(item.Region, item.Dynamodb);
            this.DynamodbNodeList.push(treeItem);
        }
    }
    AddNewDynamodbNode(Region, Dynamodb) {
        if (this.DynamodbNodeList.some(item => item.Region === Region && item.Dynamodb === Dynamodb)) {
            return this.DynamodbNodeList.find(n => n.Region === Region && n.Dynamodb === Dynamodb);
        }
        let treeItem = this.NewDynamodbNode(Region, Dynamodb);
        this.DynamodbNodeList.push(treeItem);
        return treeItem;
    }
    RemoveDynamodbNode(Region, Dynamodb) {
        for (var i = 0; i < this.DynamodbNodeList.length; i++) {
            if (this.DynamodbNodeList[i].Region === Region && this.DynamodbNodeList[i].Dynamodb === Dynamodb) {
                this.DynamodbNodeList.splice(i, 1);
                break;
            }
        }
    }
    NewDynamodbNode(Region, Dynamodb) {
        let treeItem = new DynamodbTreeItem_1.DynamodbTreeItem(Dynamodb, DynamodbTreeItem_1.TreeItemType.Dynamodb);
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        treeItem.Region = Region;
        treeItem.Dynamodb = Dynamodb;
        // Primary Keys node
        let primaryKeyItem = new DynamodbTreeItem_1.DynamodbTreeItem("Primary Keys", DynamodbTreeItem_1.TreeItemType.PrimaryKey);
        primaryKeyItem.Dynamodb = treeItem.Dynamodb;
        primaryKeyItem.Region = treeItem.Region;
        primaryKeyItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        primaryKeyItem.Parent = treeItem;
        treeItem.Children.push(primaryKeyItem);
        // Capacity node
        let capacityItem = new DynamodbTreeItem_1.DynamodbTreeItem("Capacity", DynamodbTreeItem_1.TreeItemType.Capacity);
        capacityItem.Dynamodb = treeItem.Dynamodb;
        capacityItem.Region = treeItem.Region;
        capacityItem.Parent = treeItem;
        treeItem.Children.push(capacityItem);
        // Table Info node
        let tableInfoItem = new DynamodbTreeItem_1.DynamodbTreeItem("Table Info", DynamodbTreeItem_1.TreeItemType.TableInfo);
        tableInfoItem.Dynamodb = treeItem.Dynamodb;
        tableInfoItem.Region = treeItem.Region;
        tableInfoItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        tableInfoItem.Parent = treeItem;
        treeItem.Children.push(tableInfoItem);
        // Indexes node
        let indexesItem = new DynamodbTreeItem_1.DynamodbTreeItem("Indexes", DynamodbTreeItem_1.TreeItemType.Indexes);
        indexesItem.Dynamodb = treeItem.Dynamodb;
        indexesItem.Region = treeItem.Region;
        indexesItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        indexesItem.Parent = treeItem;
        treeItem.Children.push(indexesItem);
        // Tags node
        let tagsItem = new DynamodbTreeItem_1.DynamodbTreeItem("Tags", DynamodbTreeItem_1.TreeItemType.Tags);
        tagsItem.Dynamodb = treeItem.Dynamodb;
        tagsItem.Region = treeItem.Region;
        tagsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        tagsItem.Parent = treeItem;
        treeItem.Children.push(tagsItem);
        return treeItem;
    }
    async PopulateTableDetails(node) {
        if (!node || node.TreeItemType !== DynamodbTreeItem_1.TreeItemType.Dynamodb) {
            return;
        }
        if (!DynamodbService_1.DynamodbService.Instance)
            return;
        try {
            const response = await api.GetDynamodb(node.Region, node.Dynamodb);
            if (!response.isSuccessful || !response.result) {
                return;
            }
            const details = api.ExtractTableDetails(response.result);
            // Find and populate Primary Keys node
            const primaryKeyNode = node.Children.find(c => c.TreeItemType === DynamodbTreeItem_1.TreeItemType.PrimaryKey);
            if (primaryKeyNode) {
                primaryKeyNode.Children = [];
                if (details.partitionKey) {
                    const pkItem = new DynamodbTreeItem_1.DynamodbTreeItem(`Partition Key: ${details.partitionKey.name} (${details.partitionKey.type})`, DynamodbTreeItem_1.TreeItemType.PartitionKey);
                    pkItem.Parent = primaryKeyNode;
                    primaryKeyNode.Children.push(pkItem);
                }
                if (details.sortKey) {
                    const skItem = new DynamodbTreeItem_1.DynamodbTreeItem(`Sort Key: ${details.sortKey.name} (${details.sortKey.type})`, DynamodbTreeItem_1.TreeItemType.SortKey);
                    skItem.Parent = primaryKeyNode;
                    primaryKeyNode.Children.push(skItem);
                }
            }
            // Update Capacity node
            const capacityNode = node.Children.find(c => c.TreeItemType === DynamodbTreeItem_1.TreeItemType.Capacity);
            if (capacityNode) {
                capacityNode.Children = [];
                capacityNode.tooltip = 'Click on read/write capacity for detailed information';
                if (details.billingMode === 'PAY_PER_REQUEST') {
                    capacityNode.label = `Capacity: On-Demand (${details.billingMode})`;
                    capacityNode.collapsibleState = vscode.TreeItemCollapsibleState.None;
                }
                else {
                    capacityNode.label = `Capacity: Provisioned`;
                    capacityNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
                    // Add Read Capacity sub-node
                    const readCapacityItem = new DynamodbTreeItem_1.DynamodbTreeItem(`Read Capacity: ${details.readCapacity || 0}`, DynamodbTreeItem_1.TreeItemType.ReadCapacity);
                    readCapacityItem.Parent = capacityNode;
                    readCapacityItem.Region = node.Region;
                    readCapacityItem.Dynamodb = node.Dynamodb;
                    readCapacityItem.ReadCapacity = details.readCapacity;
                    readCapacityItem.tooltip = 'Click for read capacity details';
                    readCapacityItem.command = {
                        command: 'DynamodbTreeView.showCapacityExplanation',
                        title: 'Show Capacity Explanation',
                        arguments: [readCapacityItem, 'read']
                    };
                    capacityNode.Children.push(readCapacityItem);
                    // Add Write Capacity sub-node
                    const writeCapacityItem = new DynamodbTreeItem_1.DynamodbTreeItem(`Write Capacity: ${details.writeCapacity || 0}`, DynamodbTreeItem_1.TreeItemType.WriteCapacity);
                    writeCapacityItem.Parent = capacityNode;
                    writeCapacityItem.Region = node.Region;
                    writeCapacityItem.Dynamodb = node.Dynamodb;
                    writeCapacityItem.WriteCapacity = details.writeCapacity;
                    writeCapacityItem.tooltip = 'Click for write capacity details';
                    writeCapacityItem.command = {
                        command: 'DynamodbTreeView.showCapacityExplanation',
                        title: 'Show Capacity Explanation',
                        arguments: [writeCapacityItem, 'write']
                    };
                    capacityNode.Children.push(writeCapacityItem);
                }
            }
            // Update Table Info node with children
            const tableInfoNode = node.Children.find(c => c.TreeItemType === DynamodbTreeItem_1.TreeItemType.TableInfo);
            if (tableInfoNode) {
                tableInfoNode.Children = [];
                tableInfoNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
                // Add Size node
                const sizeInMB = details.tableSize ? (details.tableSize / (1024 * 1024)).toFixed(2) : '0';
                const sizeNode = new DynamodbTreeItem_1.DynamodbTreeItem(`Size: ${sizeInMB} MB`, DynamodbTreeItem_1.TreeItemType.TableSize);
                sizeNode.Parent = tableInfoNode;
                tableInfoNode.Children.push(sizeNode);
                // Add Item Count node
                const itemCountNode = new DynamodbTreeItem_1.DynamodbTreeItem(`Item Count: ${details.itemCount || 0}`, DynamodbTreeItem_1.TreeItemType.ItemCount);
                itemCountNode.Parent = tableInfoNode;
                tableInfoNode.Children.push(itemCountNode);
                // Add Table Class node
                const tableClassNode = new DynamodbTreeItem_1.DynamodbTreeItem(`Table Class: ${details.tableClass || 'STANDARD'}`, DynamodbTreeItem_1.TreeItemType.TableClass);
                tableClassNode.Parent = tableInfoNode;
                tableInfoNode.Children.push(tableClassNode);
                // Add Table Status node
                const tableStatusNode = new DynamodbTreeItem_1.DynamodbTreeItem(`Status: ${details.tableStatus || 'UNKNOWN'}`, DynamodbTreeItem_1.TreeItemType.TableStatus);
                tableStatusNode.Parent = tableInfoNode;
                tableInfoNode.Children.push(tableStatusNode);
                // Add Table ARN node
                if (details.tableArn) {
                    const arnNode = new DynamodbTreeItem_1.DynamodbTreeItem(`ARN: ${details.tableArn}`, DynamodbTreeItem_1.TreeItemType.TableArn);
                    arnNode.Parent = tableInfoNode;
                    tableInfoNode.Children.push(arnNode);
                }
                // Add Average Item Size node
                if (details.averageItemSize !== undefined) {
                    const avgSizeNode = new DynamodbTreeItem_1.DynamodbTreeItem(`Avg Item Size: ${details.averageItemSize} bytes`, DynamodbTreeItem_1.TreeItemType.AverageItemSize);
                    avgSizeNode.Parent = tableInfoNode;
                    tableInfoNode.Children.push(avgSizeNode);
                }
            }
            // Populate Indexes node
            const indexesNode = node.Children.find(c => c.TreeItemType === DynamodbTreeItem_1.TreeItemType.Indexes);
            if (indexesNode) {
                indexesNode.Children = [];
                if (details.globalSecondaryIndexes) {
                    for (const gsi of details.globalSecondaryIndexes) {
                        const indexItem = new DynamodbTreeItem_1.DynamodbTreeItem(`GSI: ${gsi.name} - ${gsi.keys}`, DynamodbTreeItem_1.TreeItemType.Index);
                        indexItem.Parent = indexesNode;
                        indexesNode.Children.push(indexItem);
                    }
                }
                if (details.localSecondaryIndexes) {
                    for (const lsi of details.localSecondaryIndexes) {
                        const indexItem = new DynamodbTreeItem_1.DynamodbTreeItem(`LSI: ${lsi.name} - ${lsi.keys}`, DynamodbTreeItem_1.TreeItemType.Index);
                        indexItem.Parent = indexesNode;
                        indexesNode.Children.push(indexItem);
                    }
                }
                if (indexesNode.Children.length === 0) {
                    indexesNode.label = "Indexes: None";
                }
            }
            // Populate Tags node
            const tagsNode = node.Children.find(c => c.TreeItemType === DynamodbTreeItem_1.TreeItemType.Tags);
            if (tagsNode && details.tableArn) {
                tagsNode.Children = [];
                // Fetch tags from AWS
                const tagsResponse = await api.GetTableTags(node.Region, details.tableArn);
                if (tagsResponse.isSuccessful && tagsResponse.result && tagsResponse.result.length > 0) {
                    for (const tag of tagsResponse.result) {
                        const tagItem = new DynamodbTreeItem_1.DynamodbTreeItem(`${tag.key}: ${tag.value}`, DynamodbTreeItem_1.TreeItemType.TagItem);
                        tagItem.Parent = tagsNode;
                        tagsNode.Children.push(tagItem);
                    }
                    tagsNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
                }
                else {
                    tagsNode.label = "Tags: None";
                    tagsNode.collapsibleState = vscode.TreeItemCollapsibleState.None;
                }
            }
            this.Refresh();
        }
        catch (error) {
            // Silently fail - details will not be populated
        }
    }
    getChildren(node) {
        let result = [];
        if (!node) {
            result.push(...this.GetDynamodbNodes());
        }
        else if (node.Children.length > 0) {
            result.push(...node.Children);
        }
        return Promise.resolve(result);
    }
    GetDynamodbNodes() {
        var result = [];
        if (!DynamodbService_1.DynamodbService.Instance)
            return result;
        for (var node of this.DynamodbNodeList) {
            if (DynamodbService_1.DynamodbService.Instance.FilterString && !node.IsFilterStringMatch(DynamodbService_1.DynamodbService.Instance.FilterString)) {
                continue;
            }
            if (DynamodbService_1.DynamodbService.Instance.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (DynamodbService_1.DynamodbService.Instance.isShowHiddenNodes && (node.IsHidden)) {
                continue;
            }
            result.push(node);
        }
        return result;
    }
    getTreeItem(element) {
        return element;
    }
}
exports.DynamodbTreeDataProvider = DynamodbTreeDataProvider;
//# sourceMappingURL=DynamodbTreeDataProvider.js.map