"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnsTreeDataProvider = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const SnsTreeItem_1 = require("./SnsTreeItem");
const TreeItemType_1 = require("../../tree/TreeItemType");
const SnsService_1 = require("./SnsService");
const Session_1 = require("../../common/Session");
const api = require("./API");
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
        for (var item of SnsService_1.SnsService.Instance.TopicList) {
            if (item.Region === Region && item.TopicArn === TopicArn) {
                return this.SnsNodeList.find(n => n.Region === Region && n.TopicArn === TopicArn);
            }
        }
        SnsService_1.SnsService.Instance.TopicList.push({ Region: Region, TopicArn: TopicArn });
        const node = this.AddNewSnsNode(Region, TopicArn);
        this.Refresh();
        return node;
    }
    RemoveTopic(Region, TopicArn) {
        for (var i = 0; i < SnsService_1.SnsService.Instance.TopicList.length; i++) {
            if (SnsService_1.SnsService.Instance.TopicList[i].Region === Region && SnsService_1.SnsService.Instance.TopicList[i].TopicArn === TopicArn) {
                SnsService_1.SnsService.Instance.TopicList.splice(i, 1);
                break;
            }
        }
        this.RemoveSnsNode(Region, TopicArn);
        this.Refresh();
    }
    LoadSnsNodeList() {
        this.SnsNodeList = [];
        if (!SnsService_1.SnsService.Instance)
            return;
        for (var item of SnsService_1.SnsService.Instance.TopicList) {
            let treeItem = this.NewSnsNode(item.Region, item.TopicArn);
            this.SnsNodeList.push(treeItem);
        }
    }
    AddNewSnsNode(Region, TopicArn) {
        if (this.SnsNodeList.some(item => item.Region === Region && item.TopicArn === TopicArn)) {
            return this.SnsNodeList.find(n => n.Region === Region && n.TopicArn === TopicArn);
        }
        let treeItem = this.NewSnsNode(Region, TopicArn);
        this.SnsNodeList.push(treeItem);
        return treeItem;
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
        if (!TopicArn) {
            return "Undefined Topic";
        }
        const topicName = TopicArn.split(":").pop();
        if (!topicName) {
            return TopicArn;
        }
        return topicName;
    }
    NewSnsNode(Region, TopicArn) {
        let topicName = this.GetTopicName(TopicArn);
        let treeItem = new SnsTreeItem_1.SnsTreeItem(topicName, TreeItemType_1.TreeItemType.SNSTopic);
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        treeItem.Region = Region;
        treeItem.TopicArn = TopicArn;
        let pubItem = new SnsTreeItem_1.SnsTreeItem("Publish", TreeItemType_1.TreeItemType.SNSPublishGroup);
        pubItem.TopicArn = treeItem.TopicArn;
        pubItem.Region = treeItem.Region;
        pubItem.collapsibleState = vscode.ThemeIcon.File === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.None; // Default to None
        pubItem.Parent = treeItem;
        treeItem.Children.push(pubItem);
        let subItem = new SnsTreeItem_1.SnsTreeItem("Subscriptions", TreeItemType_1.TreeItemType.SNSSubscriptionGroup);
        subItem.TopicArn = treeItem.TopicArn;
        subItem.Region = treeItem.Region;
        subItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        subItem.Parent = treeItem;
        treeItem.Children.push(subItem);
        return treeItem;
    }
    getChildren(node) {
        let result = [];
        if (!node) {
            result.push(...this.GetSnsNodes());
        }
        else if (node.TreeItemType === TreeItemType_1.TreeItemType.SNSSubscriptionGroup && node.Children.length === 0) {
            return api.GetSubscriptions(node.Region, node.TopicArn).then(subs => {
                if (subs.isSuccessful && subs.result && subs.result.Subscriptions) {
                    for (var sub of subs.result.Subscriptions) {
                        let subNode = new SnsTreeItem_1.SnsTreeItem(sub.SubscriptionArn ? sub.SubscriptionArn : "No ARN", TreeItemType_1.TreeItemType.SNSSubscription);
                        subNode.Region = node.Region;
                        subNode.TopicArn = node.TopicArn;
                        subNode.SubscriptionArn = sub.SubscriptionArn || "";
                        subNode.Protocol = sub.Protocol || "";
                        subNode.Endpoint = sub.Endpoint || "";
                        subNode.Parent = node;
                        node.Children.push(subNode);
                    }
                }
                return node.Children;
            });
        }
        else if (node.Children.length > 0) {
            result.push(...node.Children);
        }
        return Promise.resolve(result);
    }
    GetSnsNodes() {
        var result = [];
        if (!SnsService_1.SnsService.Instance)
            return result;
        for (var node of this.SnsNodeList) {
            if (Session_1.Session.Current?.FilterString && !node.IsFilterStringMatch(Session_1.Session.Current?.FilterString)) {
                continue;
            }
            if (Session_1.Session.Current?.IsShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (Session_1.Session.Current?.IsShowHiddenNodes && (node.IsHidden)) {
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
//# sourceMappingURL=SnsTreeDataProvider.js.map