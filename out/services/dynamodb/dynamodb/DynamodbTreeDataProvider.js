"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewType = exports.DynamodbTreeDataProvider = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const DynamodbTreeItem_1 = require("./DynamodbTreeItem");
const DynamodbTreeView_1 = require("./DynamodbTreeView");
const api = require("../common/API");
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
        for (var item of DynamodbTreeView_1.DynamodbTreeView.Current.DynamodbList) {
            if (item.Region === Region && item.Dynamodb === Dynamodb) {
                return;
            }
        }
        DynamodbTreeView_1.DynamodbTreeView.Current.DynamodbList.push({ Region: Region, Dynamodb: Dynamodb });
        this.AddNewDynamodbNode(Region, Dynamodb);
        this.Refresh();
    }
    RemoveDynamodb(Region, Dynamodb) {
        for (var i = 0; i < DynamodbTreeView_1.DynamodbTreeView.Current.DynamodbList.length; i++) {
            if (DynamodbTreeView_1.DynamodbTreeView.Current.DynamodbList[i].Region === Region && DynamodbTreeView_1.DynamodbTreeView.Current.DynamodbList[i].Dynamodb === Dynamodb) {
                DynamodbTreeView_1.DynamodbTreeView.Current.DynamodbList.splice(i, 1);
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
        for (var item of DynamodbTreeView_1.DynamodbTreeView.Current.DynamodbList) {
            let treeItem = this.NewDynamodbNode(item.Region, item.Dynamodb);
            this.DynamodbNodeList.push(treeItem);
        }
    }
    AddNewDynamodbNode(Region, Dynamodb) {
        if (this.DynamodbNodeList.some(item => item.Region === Region && item.Dynamodb === Dynamodb)) {
            return;
        }
        let treeItem = this.NewDynamodbNode(Region, Dynamodb);
        this.DynamodbNodeList.push(treeItem);
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
                        command: 'dynamodb.showCapacityExplanation',
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
                        command: 'dynamodb.showCapacityExplanation',
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
    AddPayloadPath(node, PayloadPath) {
        for (var i = 0; i < DynamodbTreeView_1.DynamodbTreeView.Current.PayloadPathList.length; i++) {
            if (DynamodbTreeView_1.DynamodbTreeView.Current.PayloadPathList[i].Region === node.Region
                && DynamodbTreeView_1.DynamodbTreeView.Current.CodePathList[i].Dynamodb === node.Dynamodb
                && DynamodbTreeView_1.DynamodbTreeView.Current.PayloadPathList[i].PayloadPath === PayloadPath) {
                return;
            }
        }
        this.AddNewPayloadPathNode(node, PayloadPath);
        DynamodbTreeView_1.DynamodbTreeView.Current.PayloadPathList.push({ Region: node.Region, Dynamodb: node.Dynamodb, PayloadPath: PayloadPath });
        this.Refresh();
    }
    AddNewPayloadPathNode(node, PayloadPath) {
        let fileName = PayloadPath.split("/").pop();
        if (!fileName) {
            fileName = PayloadPath;
        }
        let treeItem = new DynamodbTreeItem_1.DynamodbTreeItem(fileName, DynamodbTreeItem_1.TreeItemType.TriggerFilePayload);
        treeItem.Region = node.Region;
        treeItem.Dynamodb = node.Dynamodb;
        treeItem.PayloadPath = PayloadPath;
        treeItem.Parent = node;
        node.Children.push(treeItem);
    }
    RemovePayloadPath(node) {
        if (!node.Parent) {
            return;
        }
        for (var i = 0; i < DynamodbTreeView_1.DynamodbTreeView.Current.PayloadPathList.length; i++) {
            if (DynamodbTreeView_1.DynamodbTreeView.Current.PayloadPathList[i].Region === node.Region
                && DynamodbTreeView_1.DynamodbTreeView.Current.PayloadPathList[i].Dynamodb === node.Dynamodb
                && DynamodbTreeView_1.DynamodbTreeView.Current.PayloadPathList[i].PayloadPath === node.PayloadPath) {
                DynamodbTreeView_1.DynamodbTreeView.Current.PayloadPathList.splice(i, 1);
            }
        }
        let parentNode = node.Parent;
        for (var i = 0; i < parentNode.Children.length; i++) {
            if (parentNode.Children[i].Region === node.Region
                && parentNode.Children[i].Dynamodb === node.Dynamodb
                && parentNode.Children[i].PayloadPath === node.PayloadPath) {
                parentNode.Children.splice(i, 1);
            }
        }
        this.Refresh();
    }
    AddCodePath(Region, Dynamodb, CodePath) {
        //remove old
        for (var i = 0; i < DynamodbTreeView_1.DynamodbTreeView.Current.CodePathList.length; i++) {
            if (DynamodbTreeView_1.DynamodbTreeView.Current.CodePathList[i].Region === Region && DynamodbTreeView_1.DynamodbTreeView.Current.CodePathList[i].Dynamodb === Dynamodb) {
                DynamodbTreeView_1.DynamodbTreeView.Current.CodePathList.splice(i, 1);
            }
        }
        DynamodbTreeView_1.DynamodbTreeView.Current.CodePathList.push({ Region: Region, Dynamodb: Dynamodb, CodePath: CodePath });
        this.Refresh();
    }
    RemoveCodePath(Region, Dynamodb) {
        for (var i = 0; i < DynamodbTreeView_1.DynamodbTreeView.Current.CodePathList.length; i++) {
            if (DynamodbTreeView_1.DynamodbTreeView.Current.CodePathList[i].Region === Region && DynamodbTreeView_1.DynamodbTreeView.Current.CodePathList[i].Dynamodb === Dynamodb) {
                DynamodbTreeView_1.DynamodbTreeView.Current.CodePathList.splice(i, 1);
            }
        }
        this.Refresh();
    }
    GetCodePath(Region, Dynamodb) {
        for (var item of DynamodbTreeView_1.DynamodbTreeView.Current.CodePathList) {
            if (item.Region === Region && item.Dynamodb === Dynamodb) {
                return item.CodePath;
            }
        }
        return "";
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
        for (var node of this.DynamodbNodeList) {
            if (DynamodbTreeView_1.DynamodbTreeView.Current && DynamodbTreeView_1.DynamodbTreeView.Current.FilterString && !node.IsFilterStringMatch(DynamodbTreeView_1.DynamodbTreeView.Current.FilterString)) {
                continue;
            }
            if (DynamodbTreeView_1.DynamodbTreeView.Current && DynamodbTreeView_1.DynamodbTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (DynamodbTreeView_1.DynamodbTreeView.Current && !DynamodbTreeView_1.DynamodbTreeView.Current.isShowHiddenNodes && (node.IsHidden)) {
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
var ViewType;
(function (ViewType) {
    ViewType[ViewType["Dynamodb"] = 1] = "Dynamodb";
})(ViewType || (exports.ViewType = ViewType = {}));
//# sourceMappingURL=DynamodbTreeDataProvider.js.map