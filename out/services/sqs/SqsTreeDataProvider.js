"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewType = exports.SqsTreeDataProvider = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const SqsTreeItem_1 = require("./SqsTreeItem");
const TreeItemType_1 = require("../../tree/TreeItemType");
const SqsService_1 = require("./SqsService");
const Session_1 = require("../../common/Session");
const api = require("./API");
class SqsTreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    SqsNodeList = [];
    constructor() {
    }
    Refresh() {
        if (this.SqsNodeList.length === 0) {
            this.LoadSqsNodeList();
        }
        this._onDidChangeTreeData.fire();
    }
    AddQueue(Region, QueueArn) {
        for (var item of SqsService_1.SqsService.Instance.QueueList) {
            if (item.Region === Region && item.QueueArn === QueueArn) {
                return this.SqsNodeList.find(n => n.Region === Region && n.QueueArn === QueueArn);
            }
        }
        SqsService_1.SqsService.Instance.QueueList.push({ Region: Region, QueueArn: QueueArn });
        const node = this.AddNewSqsNode(Region, QueueArn);
        this.Refresh();
        return node;
    }
    RemoveQueue(Region, QueueArn) {
        for (var i = 0; i < SqsService_1.SqsService.Instance.QueueList.length; i++) {
            if (SqsService_1.SqsService.Instance.QueueList[i].Region === Region && SqsService_1.SqsService.Instance.QueueList[i].QueueArn === QueueArn) {
                SqsService_1.SqsService.Instance.QueueList.splice(i, 1);
                break;
            }
        }
        this.RemoveSqsNode(Region, QueueArn);
        this.Refresh();
    }
    LoadSqsNodeList() {
        this.SqsNodeList = [];
        if (!SqsService_1.SqsService.Instance)
            return;
        for (var item of SqsService_1.SqsService.Instance.QueueList) {
            let treeItem = this.NewSqsNode(item.Region, item.QueueArn);
            this.SqsNodeList.push(treeItem);
        }
    }
    AddNewSqsNode(Region, QueueArn) {
        if (this.SqsNodeList.some(item => item.Region === Region && item.QueueArn === QueueArn)) {
            return this.SqsNodeList.find(n => n.Region === Region && n.QueueArn === QueueArn);
        }
        let treeItem = this.NewSqsNode(Region, QueueArn);
        this.SqsNodeList.push(treeItem);
        return treeItem;
    }
    AddNewReceivedMessageNode(Node, Region, QueueArn, Message) {
        let msgId = Message.MessageId ? Message.MessageId : "Undefined MessageId";
        let receiptHandle = Message.ReceiptHandle ? Message.ReceiptHandle : "Undefined ReceiptHandle";
        let body = Message.Body ? Message.Body : "Undefined Body";
        let treeItem = new SqsTreeItem_1.SqsTreeItem(msgId, TreeItemType_1.TreeItemType.SQSReceivedMessage);
        treeItem.Region = Region;
        treeItem.QueueArn = QueueArn;
        treeItem.MessageId = msgId;
        treeItem.ReceiptHandle = receiptHandle;
        treeItem.Body = body;
        treeItem.Parent = Node;
        Node.Children.push(treeItem);
        this.Refresh();
    }
    RemoveSqsNode(Region, QueueArn) {
        for (var i = 0; i < this.SqsNodeList.length; i++) {
            if (this.SqsNodeList[i].Region === Region && this.SqsNodeList[i].QueueArn === QueueArn) {
                this.SqsNodeList.splice(i, 1);
                break;
            }
        }
    }
    GetQueueName(QueueArn) {
        if (!QueueArn) {
            return "Undefined Queue";
        }
        const queueName = QueueArn.split("/").pop();
        if (!queueName) {
            return QueueArn;
        }
        return queueName;
    }
    NewSqsNode(Region, QueueArn) {
        let queueName = this.GetQueueName(QueueArn);
        let treeItem = new SqsTreeItem_1.SqsTreeItem(queueName, TreeItemType_1.TreeItemType.SQSQueue);
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        treeItem.Region = Region;
        treeItem.QueueArn = QueueArn;
        let detailGroup = new SqsTreeItem_1.SqsTreeItem("Details", TreeItemType_1.TreeItemType.SQSDetailGroup);
        detailGroup.QueueArn = treeItem.QueueArn;
        detailGroup.Region = treeItem.Region;
        detailGroup.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        detailGroup.Parent = treeItem;
        treeItem.Children.push(detailGroup);
        let policy = new SqsTreeItem_1.SqsTreeItem("Policy", TreeItemType_1.TreeItemType.SQSPolicy);
        policy.QueueArn = treeItem.QueueArn;
        policy.Region = treeItem.Region;
        policy.collapsibleState = vscode.TreeItemCollapsibleState.None;
        policy.Parent = treeItem;
        treeItem.Children.push(policy);
        let pubItem = new SqsTreeItem_1.SqsTreeItem("Send", TreeItemType_1.TreeItemType.SQSPublishGroup);
        pubItem.QueueArn = treeItem.QueueArn;
        pubItem.Region = treeItem.Region;
        pubItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        pubItem.Parent = treeItem;
        treeItem.Children.push(pubItem);
        let pubJson = new SqsTreeItem_1.SqsTreeItem("Adhoc", TreeItemType_1.TreeItemType.SQSPublishAdhoc);
        pubJson.QueueArn = treeItem.QueueArn;
        pubJson.Region = treeItem.Region;
        pubJson.Parent = pubItem;
        pubItem.Children.push(pubJson);
        for (var i = 0; i < SqsService_1.SqsService.Instance.MessageFilePathList.length; i++) {
            if (SqsService_1.SqsService.Instance.MessageFilePathList[i].Region === Region
                && SqsService_1.SqsService.Instance.MessageFilePathList[i].QueueArn === QueueArn) {
                this.AddNewMessagePathNode(pubItem, SqsService_1.SqsService.Instance.MessageFilePathList[i].MessageFilePath);
            }
        }
        let subItem = new SqsTreeItem_1.SqsTreeItem("Receive", TreeItemType_1.TreeItemType.SQSReceiveGroup);
        subItem.QueueArn = treeItem.QueueArn;
        subItem.Region = treeItem.Region;
        subItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        subItem.Parent = treeItem;
        treeItem.Children.push(subItem);
        //call API.GetQueueDetails
        api.GetQueueDetails(Region, QueueArn).then(details => {
            for (let [key, value] of Object.entries(details)) {
                let detailItem = new SqsTreeItem_1.SqsTreeItem(`${key}: ${value}`, TreeItemType_1.TreeItemType.SQSDetailItem);
                detailItem.QueueArn = treeItem.QueueArn;
                detailItem.Region = treeItem.Region;
                detailItem.Parent = detailGroup;
                detailGroup.Children.push(detailItem);
            }
        });
        return treeItem;
    }
    AddMessageFilePath(node, MessageFilePath) {
        for (var i = 0; i < SqsService_1.SqsService.Instance.MessageFilePathList.length; i++) {
            if (SqsService_1.SqsService.Instance.MessageFilePathList[i].Region === node.Region
                && SqsService_1.SqsService.Instance.MessageFilePathList[i].QueueArn === node.QueueArn
                && SqsService_1.SqsService.Instance.MessageFilePathList[i].MessageFilePath === MessageFilePath) {
                return;
            }
        }
        this.AddNewMessagePathNode(node, MessageFilePath);
        SqsService_1.SqsService.Instance.MessageFilePathList.push({ Region: node.Region, QueueArn: node.QueueArn, MessageFilePath: MessageFilePath });
        this.Refresh();
    }
    AddNewMessagePathNode(node, MessageFilePath) {
        let fileName = MessageFilePath.split("/").pop();
        if (!fileName) {
            fileName = MessageFilePath;
        }
        let treeItem = new SqsTreeItem_1.SqsTreeItem(fileName, TreeItemType_1.TreeItemType.SQSPublishFile);
        treeItem.Region = node.Region;
        treeItem.QueueArn = node.QueueArn;
        treeItem.MessageFilePath = MessageFilePath;
        treeItem.Parent = node;
        node.Children.push(treeItem);
    }
    RemoveMessageFilePath(node) {
        if (!node.Parent) {
            return;
        }
        for (var i = 0; i < SqsService_1.SqsService.Instance.MessageFilePathList.length; i++) {
            if (SqsService_1.SqsService.Instance.MessageFilePathList[i].Region === node.Region
                && SqsService_1.SqsService.Instance.MessageFilePathList[i].QueueArn === node.QueueArn
                && SqsService_1.SqsService.Instance.MessageFilePathList[i].MessageFilePath === node.MessageFilePath) {
                SqsService_1.SqsService.Instance.MessageFilePathList.splice(i, 1);
            }
        }
        let parentNode = node.Parent;
        for (var i = 0; i < parentNode.Children.length; i++) {
            if (parentNode.Children[i].Region === node.Region
                && parentNode.Children[i].QueueArn === node.QueueArn
                && parentNode.Children[i].MessageFilePath === node.MessageFilePath) {
                parentNode.Children.splice(i, 1);
            }
        }
        this.Refresh();
    }
    getChildren(node) {
        let result = [];
        if (!node) {
            result.push(...this.GetSqsNodes());
        }
        else if (node.Children.length > 0) {
            result.push(...node.Children);
        }
        return Promise.resolve(result);
    }
    GetSqsNodes() {
        var result = [];
        if (!SqsService_1.SqsService.Instance)
            return result;
        for (var node of this.SqsNodeList) {
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
exports.SqsTreeDataProvider = SqsTreeDataProvider;
var ViewType;
(function (ViewType) {
    ViewType[ViewType["Sqs"] = 1] = "Sqs";
})(ViewType || (exports.ViewType = ViewType = {}));
//# sourceMappingURL=SqsTreeDataProvider.js.map