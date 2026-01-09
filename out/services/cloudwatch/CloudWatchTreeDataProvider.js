"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudWatchTreeDataProvider = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const CloudWatchTreeItem_1 = require("./CloudWatchTreeItem");
const TreeItemType_1 = require("../../tree/TreeItemType");
const CloudWatchService_1 = require("./CloudWatchService");
const Session_1 = require("../../common/Session");
const api = require("./API");
class CloudWatchTreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    RegionNodeList = [];
    constructor() {
    }
    Refresh() {
        if (this.RegionNodeList.length === 0) {
            this.LoadRegionNodeList();
        }
        this._onDidChangeTreeData.fire();
    }
    AddLogGroup(Region, LogGroup) {
        for (var item of CloudWatchService_1.CloudWatchService.Instance.LogGroupList) {
            if (item.Region === Region && item.LogGroup === LogGroup) {
                return this.RegionNodeList.find(node => node.label === Region)?.Children.find(child => child.LogGroup === LogGroup);
            }
        }
        CloudWatchService_1.CloudWatchService.Instance.LogGroupList.push({ Region: Region, LogGroup: LogGroup });
        const node = this.AddNewLogGroupNode(Region, LogGroup);
        this.Refresh();
        return node;
    }
    RemoveLogGroup(Region, LogGroup) {
        for (var i = 0; i < CloudWatchService_1.CloudWatchService.Instance.LogGroupList.length; i++) {
            if (CloudWatchService_1.CloudWatchService.Instance.LogGroupList[i].Region === Region && CloudWatchService_1.CloudWatchService.Instance.LogGroupList[i].LogGroup === LogGroup) {
                CloudWatchService_1.CloudWatchService.Instance.LogGroupList.splice(i, 1);
                break;
            }
        }
        this.RemoveLogGroupNode(Region, LogGroup);
        this.Refresh();
    }
    LoadRegionNodeList() {
        this.RegionNodeList = [];
        if (!CloudWatchService_1.CloudWatchService.Instance)
            return;
        for (var item of CloudWatchService_1.CloudWatchService.Instance.LogGroupList) {
            this.AddNewLogGroupNode(item.Region, item.LogGroup);
        }
    }
    AddNewLogGroupNode(Region, LogGroup) {
        let regionNode = this.RegionNodeList.find(node => node.label === Region);
        if (!regionNode) {
            regionNode = new CloudWatchTreeItem_1.CloudWatchTreeItem(Region, TreeItemType_1.TreeItemType.CloudWatchRegion);
            regionNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            regionNode.Region = Region;
            this.RegionNodeList.push(regionNode);
        }
        if (regionNode.Children.some(item => item.LogGroup === LogGroup)) {
            return regionNode.Children.find(item => item.LogGroup === LogGroup);
        }
        let treeItem = new CloudWatchTreeItem_1.CloudWatchTreeItem(LogGroup, TreeItemType_1.TreeItemType.CloudWatchLogGroup);
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        treeItem.Region = Region;
        treeItem.LogGroup = LogGroup;
        treeItem.Parent = regionNode;
        regionNode.Children.push(treeItem);
        return treeItem;
    }
    RemoveLogGroupNode(Region, LogGroup) {
        let regionNode = this.RegionNodeList.find(node => node.label === Region);
        if (!regionNode)
            return;
        for (var i = 0; i < regionNode.Children.length; i++) {
            if (regionNode.Children[i].LogGroup === LogGroup) {
                regionNode.Children.splice(i, 1);
                break;
            }
        }
        if (regionNode.Children.length === 0) {
            this.RegionNodeList = this.RegionNodeList.filter(node => node.label !== Region);
        }
    }
    getChildren(node) {
        let result = [];
        if (!node) {
            result.push(...this.GetRegionNodes());
        }
        else if (node.Children.length > 0) {
            result.push(...node.Children);
        }
        else if (node.TreeItemType === TreeItemType_1.TreeItemType.CloudWatchLogGroup) {
            return api.GetLogStreamList(node.Region, node.LogGroup).then(streams => {
                for (var stream of streams.result) {
                    let streamNode = new CloudWatchTreeItem_1.CloudWatchTreeItem(stream, TreeItemType_1.TreeItemType.CloudWatchLogStream);
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
    GetRegionNodes() {
        var result = [];
        if (!CloudWatchService_1.CloudWatchService.Instance)
            return result;
        for (var node of this.RegionNodeList) {
            // Filtering at region level might be tricky, let's filter children
            let filteredChildren = node.Children.filter(child => {
                if (Session_1.Session.Current?.FilterString && !child.IsFilterStringMatch(Session_1.Session.Current?.FilterString)) {
                    return false;
                }
                if (Session_1.Session.Current?.IsShowOnlyFavorite && !(child.IsFav || child.IsAnyChidrenFav())) {
                    return false;
                }
                if (Session_1.Session.Current?.IsShowHiddenNodes && (child.IsHidden)) {
                    return false;
                }
                return true;
            });
            if (filteredChildren.length > 0 || !Session_1.Session.Current?.FilterString) {
                // We should return a copy or just mock the filtered children
                result.push(node);
            }
        }
        return result;
    }
    getTreeItem(element) {
        return element;
    }
}
exports.CloudWatchTreeDataProvider = CloudWatchTreeDataProvider;
//# sourceMappingURL=CloudWatchTreeDataProvider.js.map