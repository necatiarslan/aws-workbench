"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewType = exports.SnsTreeDataProvider = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const SnsTreeItem_1 = require("./SnsTreeItem");
const SnsTreeView_1 = require("./SnsTreeView");
class SnsTreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    SnsNodeList = [];
    constructor() {
    }
    Refresh() {
        if (this.SnsNodeList.length === 0) {
            this.LoadSnsNodeList();
        }
        this._onDidChangeTreeData.fire();
    }
    AddTopic(Region, TopicArn) {
        for (var item of SnsTreeView_1.SnsTreeView.Current.TopicList) {
            if (item.Region === Region && item.TopicArn === TopicArn) {
                return;
            }
        }
        SnsTreeView_1.SnsTreeView.Current.TopicList.push({ Region: Region, TopicArn: TopicArn });
        this.AddNewSnsNode(Region, TopicArn);
        this.Refresh();
    }
    RemoveTopic(Region, TopicArn) {
        for (var i = 0; i < SnsTreeView_1.SnsTreeView.Current.TopicList.length; i++) {
            if (SnsTreeView_1.SnsTreeView.Current.TopicList[i].Region === Region && SnsTreeView_1.SnsTreeView.Current.TopicList[i].TopicArn === TopicArn) {
                SnsTreeView_1.SnsTreeView.Current.TopicList.splice(i, 1);
                break;
            }
        }
        this.RemoveSnsNode(Region, TopicArn);
        this.Refresh();
    }
    LoadSnsNodeList() {
        this.SnsNodeList = [];
        for (var item of SnsTreeView_1.SnsTreeView.Current.TopicList) {
            let treeItem = this.NewSnsNode(item.Region, item.TopicArn);
            this.SnsNodeList.push(treeItem);
        }
    }
    AddNewSnsNode(Region, TopicArn) {
        if (this.SnsNodeList.some(item => item.Region === Region && item.TopicArn === TopicArn)) {
            return;
        }
        let treeItem = this.NewSnsNode(Region, TopicArn);
        this.SnsNodeList.push(treeItem);
    }
    RemoveSnsNode(Region, TopicArn) {
        for (var i = 0; i < this.SnsNodeList.length; i++) {
            if (this.SnsNodeList[i].Region === Region && this.SnsNodeList[i].TopicArn === TopicArn) {
                this.SnsNodeList.splice(i, 1);
                break;
            }
        }
    }
    GetTopicName(TopicArn) {
        const topicName = TopicArn.split(":").pop();
        if (!topicName) {
            return TopicArn;
        }
        return topicName;
    }
    NewSnsNode(Region, TopicArn) {
        let topicName = this.GetTopicName(TopicArn);
        let treeItem = new SnsTreeItem_1.SnsTreeItem(topicName, SnsTreeItem_1.TreeItemType.Topic);
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        treeItem.Region = Region;
        treeItem.TopicArn = TopicArn;
        let pubItem = new SnsTreeItem_1.SnsTreeItem("Publish", SnsTreeItem_1.TreeItemType.PublishGroup);
        pubItem.TopicArn = treeItem.TopicArn;
        pubItem.Region = treeItem.Region;
        pubItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        pubItem.Parent = treeItem;
        treeItem.Children.push(pubItem);
        let pubJson = new SnsTreeItem_1.SnsTreeItem("Adhoc", SnsTreeItem_1.TreeItemType.PublishAdhoc);
        pubJson.TopicArn = treeItem.TopicArn;
        pubJson.Region = treeItem.Region;
        pubJson.Parent = pubItem;
        pubItem.Children.push(pubJson);
        for (var i = 0; i < SnsTreeView_1.SnsTreeView.Current.MessageFilePathList.length; i++) {
            if (SnsTreeView_1.SnsTreeView.Current.MessageFilePathList[i].Region === Region
                && SnsTreeView_1.SnsTreeView.Current.MessageFilePathList[i].TopicArn === TopicArn) {
                this.AddNewMessagePathNode(pubItem, SnsTreeView_1.SnsTreeView.Current.MessageFilePathList[i].MessageFilePath);
            }
        }
        let subItem = new SnsTreeItem_1.SnsTreeItem("Subscriptions", SnsTreeItem_1.TreeItemType.SubscriptionGroup);
        subItem.TopicArn = treeItem.TopicArn;
        subItem.Region = treeItem.Region;
        subItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        subItem.Parent = treeItem;
        treeItem.Children.push(subItem);
        return treeItem;
    }
    AddMessageFilePath(node, MessageFilePath) {
        for (var i = 0; i < SnsTreeView_1.SnsTreeView.Current.MessageFilePathList.length; i++) {
            if (SnsTreeView_1.SnsTreeView.Current.MessageFilePathList[i].Region === node.Region
                && SnsTreeView_1.SnsTreeView.Current.MessageFilePathList[i].TopicArn === node.TopicArn
                && SnsTreeView_1.SnsTreeView.Current.MessageFilePathList[i].MessageFilePath === MessageFilePath) {
                return;
            }
        }
        this.AddNewMessagePathNode(node, MessageFilePath);
        SnsTreeView_1.SnsTreeView.Current.MessageFilePathList.push({ Region: node.Region, TopicArn: node.TopicArn, MessageFilePath: MessageFilePath });
        this.Refresh();
    }
    AddNewMessagePathNode(node, MessageFilePath) {
        let fileName = MessageFilePath.split("/").pop();
        if (!fileName) {
            fileName = MessageFilePath;
        }
        let treeItem = new SnsTreeItem_1.SnsTreeItem(fileName, SnsTreeItem_1.TreeItemType.PublishFile);
        treeItem.Region = node.Region;
        treeItem.TopicArn = node.TopicArn;
        treeItem.MessageFilePath = MessageFilePath;
        treeItem.Parent = node;
        node.Children.push(treeItem);
    }
    RemoveMessageFilePath(node) {
        if (!node.Parent) {
            return;
        }
        for (var i = 0; i < SnsTreeView_1.SnsTreeView.Current.MessageFilePathList.length; i++) {
            if (SnsTreeView_1.SnsTreeView.Current.MessageFilePathList[i].Region === node.Region
                && SnsTreeView_1.SnsTreeView.Current.MessageFilePathList[i].TopicArn === node.TopicArn
                && SnsTreeView_1.SnsTreeView.Current.MessageFilePathList[i].MessageFilePath === node.MessageFilePath) {
                SnsTreeView_1.SnsTreeView.Current.MessageFilePathList.splice(i, 1);
            }
        }
        let parentNode = node.Parent;
        for (var i = 0; i < parentNode.Children.length; i++) {
            if (parentNode.Children[i].Region === node.Region
                && parentNode.Children[i].TopicArn === node.TopicArn
                && parentNode.Children[i].MessageFilePath === node.MessageFilePath) {
                parentNode.Children.splice(i, 1);
            }
        }
        this.Refresh();
    }
    AddSubscriptions(node, Subscriptions) {
        node.Children = [];
        if (!Subscriptions.Subscriptions) {
            return;
        }
        for (var i = 0; i < Subscriptions.Subscriptions.length; i++) {
            let endpoint = Subscriptions.Subscriptions[i].Endpoint;
            let protocol = Subscriptions.Subscriptions[i].Protocol;
            if (!endpoint) {
                continue;
            }
            let treeItem = new SnsTreeItem_1.SnsTreeItem(protocol?.toUpperCase() + " : " + endpoint, SnsTreeItem_1.TreeItemType.Subscription);
            treeItem.TopicArn = node.TopicArn;
            treeItem.Region = node.Region;
            treeItem.Parent = node;
            node.Children.push(treeItem);
        }
    }
    getChildren(node) {
        let result = [];
        if (!node) {
            result.push(...this.GetSnsNodes());
        }
        else if (node.Children.length > 0) {
            result.push(...node.Children);
        }
        return Promise.resolve(result);
    }
    GetSnsNodes() {
        var result = [];
        for (var node of this.SnsNodeList) {
            if (SnsTreeView_1.SnsTreeView.Current && SnsTreeView_1.SnsTreeView.Current.FilterString && !node.IsFilterStringMatch(SnsTreeView_1.SnsTreeView.Current.FilterString)) {
                continue;
            }
            if (SnsTreeView_1.SnsTreeView.Current && SnsTreeView_1.SnsTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (SnsTreeView_1.SnsTreeView.Current && !SnsTreeView_1.SnsTreeView.Current.isShowHiddenNodes && (node.IsHidden)) {
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
exports.SnsTreeDataProvider = SnsTreeDataProvider;
var ViewType;
(function (ViewType) {
    ViewType[ViewType["Sns"] = 1] = "Sns";
})(ViewType || (exports.ViewType = ViewType = {}));
//# sourceMappingURL=SnsTreeDataProvider.js.map