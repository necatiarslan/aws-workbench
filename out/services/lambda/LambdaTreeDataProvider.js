"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewType = exports.LambdaTreeDataProvider = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const LambdaTreeItem_1 = require("./LambdaTreeItem");
const TreeItemType_1 = require("../../tree/TreeItemType");
const LambdaService_1 = require("./LambdaService");
const Session_1 = require("../../common/Session");
class LambdaTreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    LambdaNodeList = [];
    constructor() {
    }
    Refresh() {
        if (this.LambdaNodeList.length === 0) {
            this.LoadLambdaNodeList();
        }
        this._onDidChangeTreeData.fire();
    }
    AddLambda(Region, Lambda) {
        for (var item of LambdaService_1.LambdaService.Instance.LambdaList) {
            if (item.Region === Region && item.Lambda === Lambda) {
                return this.LambdaNodeList.find(n => n.Region === Region && n.Lambda === Lambda);
            }
        }
        LambdaService_1.LambdaService.Instance.LambdaList.push({ Region: Region, Lambda: Lambda });
        const node = this.AddNewLambdaNode(Region, Lambda);
        this.Refresh();
        return node;
    }
    RemoveLambda(Region, Lambda) {
        for (var i = 0; i < LambdaService_1.LambdaService.Instance.LambdaList.length; i++) {
            if (LambdaService_1.LambdaService.Instance.LambdaList[i].Region === Region && LambdaService_1.LambdaService.Instance.LambdaList[i].Lambda === Lambda) {
                LambdaService_1.LambdaService.Instance.LambdaList.splice(i, 1);
                break;
            }
        }
        this.RemoveLambdaNode(Region, Lambda);
        this.Refresh();
    }
    AddResponsePayload(node, payloadString) {
        let now = new Date();
        let currentTime = now.getHours().toString().padStart(2, '0') + ':' +
            now.getMinutes().toString().padStart(2, '0') + ':' +
            now.getSeconds().toString().padStart(2, '0');
        let treeItem = new LambdaTreeItem_1.LambdaTreeItem("Response - " + currentTime, TreeItemType_1.TreeItemType.LambdaResponsePayload);
        treeItem.Region = node.Region;
        treeItem.Lambda = node.Lambda;
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
            let treeItem = new LambdaTreeItem_1.LambdaTreeItem(streamName, TreeItemType_1.TreeItemType.LambdaLogStream);
            treeItem.Region = node.Region;
            treeItem.Lambda = node.Lambda;
            treeItem.LogStreamName = streamName;
            treeItem.Parent = node;
            node.Children.push(treeItem);
        }
        this.Refresh();
    }
    LoadLambdaNodeList() {
        this.LambdaNodeList = [];
        if (!LambdaService_1.LambdaService.Instance)
            return;
        for (var item of LambdaService_1.LambdaService.Instance.LambdaList) {
            let treeItem = this.NewLambdaNode(item.Region, item.Lambda);
            this.LambdaNodeList.push(treeItem);
        }
    }
    AddNewLambdaNode(Region, Lambda) {
        if (this.LambdaNodeList.some(item => item.Region === Region && item.Lambda === Lambda)) {
            return this.LambdaNodeList.find(n => n.Region === Region && n.Lambda === Lambda);
        }
        let treeItem = this.NewLambdaNode(Region, Lambda);
        this.LambdaNodeList.push(treeItem);
        return treeItem;
    }
    RemoveLambdaNode(Region, Lambda) {
        for (var i = 0; i < this.LambdaNodeList.length; i++) {
            if (this.LambdaNodeList[i].Region === Region && this.LambdaNodeList[i].Lambda === Lambda) {
                this.LambdaNodeList.splice(i, 1);
                break;
            }
        }
    }
    NewLambdaNode(Region, Lambda) {
        let treeItem = new LambdaTreeItem_1.LambdaTreeItem(Lambda, TreeItemType_1.TreeItemType.LambdaFunction);
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        treeItem.Region = Region;
        treeItem.Lambda = Lambda;
        let codeItem = new LambdaTreeItem_1.LambdaTreeItem("Code", TreeItemType_1.TreeItemType.LambdaCode);
        codeItem.Lambda = treeItem.Lambda;
        codeItem.Region = treeItem.Region;
        codeItem.Parent = treeItem;
        codeItem.CodePath = this.GetCodePath(treeItem.Region, treeItem.Lambda);
        treeItem.Children.push(codeItem);
        let triggerItem = new LambdaTreeItem_1.LambdaTreeItem("Trigger", TreeItemType_1.TreeItemType.LambdaTriggerGroup);
        triggerItem.Lambda = treeItem.Lambda;
        triggerItem.Region = treeItem.Region;
        triggerItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        triggerItem.Parent = treeItem;
        treeItem.Children.push(triggerItem);
        let triggerWithPayload = new LambdaTreeItem_1.LambdaTreeItem("With Paylod", TreeItemType_1.TreeItemType.LambdaTriggerWithPayload);
        triggerWithPayload.Lambda = treeItem.Lambda;
        triggerWithPayload.Region = treeItem.Region;
        triggerWithPayload.Parent = triggerItem;
        triggerItem.Children.push(triggerWithPayload);
        let triggerWithoutPayload = new LambdaTreeItem_1.LambdaTreeItem("Without Paylod", TreeItemType_1.TreeItemType.LambdaTriggerNoPayload);
        triggerWithoutPayload.Lambda = treeItem.Lambda;
        triggerWithoutPayload.Region = treeItem.Region;
        triggerWithoutPayload.Parent = triggerItem;
        triggerItem.Children.push(triggerWithoutPayload);
        for (var i = 0; i < LambdaService_1.LambdaService.Instance.PayloadPathList.length; i++) {
            if (LambdaService_1.LambdaService.Instance.PayloadPathList[i].Region === Region
                && LambdaService_1.LambdaService.Instance.PayloadPathList[i].Lambda === Lambda) {
                this.AddNewPayloadPathNode(triggerItem, LambdaService_1.LambdaService.Instance.PayloadPathList[i].PayloadPath);
            }
        }
        let logsItem = new LambdaTreeItem_1.LambdaTreeItem("Logs", TreeItemType_1.TreeItemType.LambdaLogGroup);
        logsItem.Lambda = treeItem.Lambda;
        logsItem.Region = treeItem.Region;
        logsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        logsItem.Parent = treeItem;
        treeItem.Children.push(logsItem);
        // Add Environment Variables Group
        let envVarsItem = new LambdaTreeItem_1.LambdaTreeItem("Environment Variables", TreeItemType_1.TreeItemType.LambdaEnvironmentVariableGroup);
        envVarsItem.Lambda = treeItem.Lambda;
        envVarsItem.Region = treeItem.Region;
        envVarsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        envVarsItem.Parent = treeItem;
        treeItem.Children.push(envVarsItem);
        // Add Tags Group
        let tagsItem = new LambdaTreeItem_1.LambdaTreeItem("Tags", TreeItemType_1.TreeItemType.LambdaTagsGroup);
        tagsItem.Lambda = treeItem.Lambda;
        tagsItem.Region = treeItem.Region;
        tagsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        tagsItem.Parent = treeItem;
        treeItem.Children.push(tagsItem);
        // Add Info Group
        let infoItem = new LambdaTreeItem_1.LambdaTreeItem("Info", TreeItemType_1.TreeItemType.LambdaInfoGroup);
        infoItem.Lambda = treeItem.Lambda;
        infoItem.Region = treeItem.Region;
        infoItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        infoItem.Parent = treeItem;
        treeItem.Children.push(infoItem);
        return treeItem;
    }
    AddPayloadPath(node, PayloadPath) {
        for (var i = 0; i < LambdaService_1.LambdaService.Instance.PayloadPathList.length; i++) {
            if (LambdaService_1.LambdaService.Instance.PayloadPathList[i].Region === node.Region
                && LambdaService_1.LambdaService.Instance.CodePathList[i].Lambda === node.Lambda
                && LambdaService_1.LambdaService.Instance.PayloadPathList[i].PayloadPath === PayloadPath) {
                return;
            }
        }
        this.AddNewPayloadPathNode(node, PayloadPath);
        LambdaService_1.LambdaService.Instance.PayloadPathList.push({ Region: node.Region, Lambda: node.Lambda, PayloadPath: PayloadPath });
        this.Refresh();
    }
    AddNewPayloadPathNode(node, PayloadPath) {
        let fileName = PayloadPath.split("/").pop();
        if (!fileName) {
            fileName = PayloadPath;
        }
        let treeItem = new LambdaTreeItem_1.LambdaTreeItem(fileName, TreeItemType_1.TreeItemType.LambdaTriggerFilePayload);
        treeItem.Region = node.Region;
        treeItem.Lambda = node.Lambda;
        treeItem.PayloadPath = PayloadPath;
        treeItem.Parent = node;
        node.Children.push(treeItem);
    }
    RemovePayloadPath(node) {
        if (!node.Parent) {
            return;
        }
        for (var i = 0; i < LambdaService_1.LambdaService.Instance.PayloadPathList.length; i++) {
            if (LambdaService_1.LambdaService.Instance.PayloadPathList[i].Region === node.Region
                && LambdaService_1.LambdaService.Instance.PayloadPathList[i].Lambda === node.Lambda
                && LambdaService_1.LambdaService.Instance.PayloadPathList[i].PayloadPath === node.PayloadPath) {
                LambdaService_1.LambdaService.Instance.PayloadPathList.splice(i, 1);
            }
        }
        let parentNode = node.Parent;
        for (var i = 0; i < parentNode.Children.length; i++) {
            if (parentNode.Children[i].Region === node.Region
                && parentNode.Children[i].Lambda === node.Lambda
                && parentNode.Children[i].PayloadPath === node.PayloadPath) {
                parentNode.Children.splice(i, 1);
            }
        }
        this.Refresh();
    }
    AddCodePath(Region, Lambda, CodePath) {
        //remove old
        for (var i = 0; i < LambdaService_1.LambdaService.Instance.CodePathList.length; i++) {
            if (LambdaService_1.LambdaService.Instance.CodePathList[i].Region === Region && LambdaService_1.LambdaService.Instance.CodePathList[i].Lambda === Lambda) {
                LambdaService_1.LambdaService.Instance.CodePathList.splice(i, 1);
            }
        }
        LambdaService_1.LambdaService.Instance.CodePathList.push({ Region: Region, Lambda: Lambda, CodePath: CodePath });
        this.Refresh();
    }
    RemoveCodePath(Region, Lambda) {
        for (var i = 0; i < LambdaService_1.LambdaService.Instance.CodePathList.length; i++) {
            if (LambdaService_1.LambdaService.Instance.CodePathList[i].Region === Region && LambdaService_1.LambdaService.Instance.CodePathList[i].Lambda === Lambda) {
                LambdaService_1.LambdaService.Instance.CodePathList.splice(i, 1);
            }
        }
        this.Refresh();
    }
    GetCodePath(Region, Lambda) {
        if (!LambdaService_1.LambdaService.Instance)
            return "";
        for (var item of LambdaService_1.LambdaService.Instance.CodePathList) {
            if (item.Region === Region && item.Lambda === Lambda) {
                return item.CodePath;
            }
        }
        return "";
    }
    getChildren(node) {
        let result = [];
        if (!node) {
            result.push(...this.GetLambdaNodes());
        }
        else if (node.TreeItemType === TreeItemType_1.TreeItemType.LambdaEnvironmentVariableGroup && node.Children.length === 0) {
            // Auto-load environment variables when the node is expanded
            LambdaService_1.LambdaService.Instance.LoadEnvironmentVariables(node);
        }
        else if (node.TreeItemType === TreeItemType_1.TreeItemType.LambdaTagsGroup && node.Children.length === 0) {
            // Auto-load tags when the node is expanded
            LambdaService_1.LambdaService.Instance.LoadTags(node);
        }
        else if (node.TreeItemType === TreeItemType_1.TreeItemType.LambdaInfoGroup && node.Children.length === 0) {
            // Auto-load info when the node is expanded
            LambdaService_1.LambdaService.Instance.LoadInfo(node);
        }
        else if (node.Children.length > 0) {
            result.push(...node.Children);
        }
        return Promise.resolve(result);
    }
    GetLambdaNodes() {
        var result = [];
        if (!LambdaService_1.LambdaService.Instance)
            return result;
        for (var node of this.LambdaNodeList) {
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
exports.LambdaTreeDataProvider = LambdaTreeDataProvider;
var ViewType;
(function (ViewType) {
    ViewType[ViewType["Lambda"] = 1] = "Lambda";
})(ViewType || (exports.ViewType = ViewType = {}));
//# sourceMappingURL=LambdaTreeDataProvider.js.map