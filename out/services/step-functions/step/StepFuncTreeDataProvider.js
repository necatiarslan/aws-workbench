"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewType = exports.StepFuncTreeDataProvider = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const StepFuncTreeItem_1 = require("./StepFuncTreeItem");
const StepFuncTreeView_1 = require("./StepFuncTreeView");
class StepFuncTreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    StepFuncNodeList = [];
    constructor() {
    }
    Refresh() {
        if (this.StepFuncNodeList.length === 0) {
            this.LoadStepFuncNodeList();
        }
        this._onDidChangeTreeData.fire();
    }
    AddStepFunc(Region, StepFuncArn) {
        for (var item of StepFuncTreeView_1.StepFuncTreeView.Current.StepFuncList) {
            if (item.Region === Region && item.StepFunc === StepFuncArn) {
                return;
            }
        }
        StepFuncTreeView_1.StepFuncTreeView.Current.StepFuncList.push({ Region: Region, StepFunc: StepFuncArn });
        this.AddNewStepFuncNode(Region, StepFuncArn);
        this.Refresh();
    }
    RemoveStepFunc(Region, StepFunc) {
        for (var i = 0; i < StepFuncTreeView_1.StepFuncTreeView.Current.StepFuncList.length; i++) {
            if (StepFuncTreeView_1.StepFuncTreeView.Current.StepFuncList[i].Region === Region && StepFuncTreeView_1.StepFuncTreeView.Current.StepFuncList[i].StepFunc === StepFunc) {
                StepFuncTreeView_1.StepFuncTreeView.Current.StepFuncList.splice(i, 1);
                break;
            }
        }
        this.RemoveStepFuncNode(Region, StepFunc);
        this.Refresh();
    }
    AddExecutionNode(Node, ExecutionArn) {
        let now = new Date();
        let currentTime = now.getHours().toString().padStart(2, '0') + ':' +
            now.getMinutes().toString().padStart(2, '0') + ':' +
            now.getSeconds().toString().padStart(2, '0');
        let treeItem = new StepFuncTreeItem_1.StepFuncTreeItem("Execution - " + currentTime, StepFuncTreeItem_1.TreeItemType.Execution);
        treeItem.Region = Node.Region;
        treeItem.StepFuncArn = Node.StepFuncArn;
        treeItem.ExecutionArn = ExecutionArn;
        treeItem.Parent = Node;
        Node.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        Node.Children.push(treeItem);
        this.Refresh();
    }
    AddLogStreams(node, LogStreams) {
        for (var streamName of LogStreams) {
            if (node.Children.find((item) => item.LogStreamName === streamName)) {
                continue;
            }
            let treeItem = new StepFuncTreeItem_1.StepFuncTreeItem(streamName, StepFuncTreeItem_1.TreeItemType.LogStream);
            treeItem.Region = node.Region;
            treeItem.StepFuncArn = node.StepFuncArn;
            treeItem.LogStreamName = streamName;
            treeItem.Parent = node;
            node.Children.push(treeItem);
        }
        this.Refresh();
    }
    AddExecutions(node, executions) {
        node.Children = []; // Clear existing executions
        for (var execution of executions) {
            const executionName = execution.name || 'Unknown';
            const status = execution.status || 'UNKNOWN';
            const startDate = execution.startDate ? new Date(execution.startDate).toLocaleString() : '';
            let label = `${executionName} [${status}]`;
            if (startDate) {
                label += ` - ${startDate}`;
            }
            let treeItem = new StepFuncTreeItem_1.StepFuncTreeItem(label, StepFuncTreeItem_1.TreeItemType.Execution);
            treeItem.Region = node.Region;
            treeItem.StepFuncArn = node.StepFuncArn;
            treeItem.ExecutionArn = execution.executionArn;
            treeItem.ExecutionStatus = status;
            treeItem.Parent = node;
            node.Children.push(treeItem);
        }
        this.Refresh();
    }
    LoadStepFuncNodeList() {
        this.StepFuncNodeList = [];
        for (var item of StepFuncTreeView_1.StepFuncTreeView.Current.StepFuncList) {
            let treeItem = this.NewStepFuncNode(item.Region, item.StepFunc);
            this.StepFuncNodeList.push(treeItem);
        }
    }
    AddNewStepFuncNode(Region, StepFuncArn) {
        if (this.StepFuncNodeList.some(item => item.Region === Region && item.StepFuncArn === StepFuncArn)) {
            return;
        }
        let treeItem = this.NewStepFuncNode(Region, StepFuncArn);
        this.StepFuncNodeList.push(treeItem);
    }
    RemoveStepFuncNode(Region, StepFunc) {
        for (var i = 0; i < this.StepFuncNodeList.length; i++) {
            if (this.StepFuncNodeList[i].Region === Region && this.StepFuncNodeList[i].StepFuncArn === StepFunc) {
                this.StepFuncNodeList.splice(i, 1);
                break;
            }
        }
    }
    NewStepFuncNode(Region, StepFuncArn) {
        let StepFuncName = StepFuncTreeItem_1.StepFuncTreeItem.GetStepFuncName(StepFuncArn);
        let treeItem = new StepFuncTreeItem_1.StepFuncTreeItem(StepFuncName, StepFuncTreeItem_1.TreeItemType.StepFunc);
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        treeItem.Region = Region;
        treeItem.StepFuncArn = StepFuncArn;
        let codeItem = new StepFuncTreeItem_1.StepFuncTreeItem("Code", StepFuncTreeItem_1.TreeItemType.Code);
        codeItem.StepFuncArn = treeItem.StepFuncArn;
        codeItem.Region = treeItem.Region;
        codeItem.Parent = treeItem;
        codeItem.CodePath = this.GetCodePath(treeItem.Region, treeItem.StepFuncArn);
        treeItem.Children.push(codeItem);
        let triggerItem = new StepFuncTreeItem_1.StepFuncTreeItem("Trigger", StepFuncTreeItem_1.TreeItemType.TriggerGroup);
        triggerItem.StepFuncArn = treeItem.StepFuncArn;
        triggerItem.Region = treeItem.Region;
        triggerItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        triggerItem.Parent = treeItem;
        treeItem.Children.push(triggerItem);
        let triggerWithPayload = new StepFuncTreeItem_1.StepFuncTreeItem("With Paylod", StepFuncTreeItem_1.TreeItemType.TriggerWithPayload);
        triggerWithPayload.StepFuncArn = treeItem.StepFuncArn;
        triggerWithPayload.Region = treeItem.Region;
        triggerWithPayload.Parent = triggerItem;
        triggerItem.Children.push(triggerWithPayload);
        let triggerWithoutPayload = new StepFuncTreeItem_1.StepFuncTreeItem("Without Paylod", StepFuncTreeItem_1.TreeItemType.TriggerNoPayload);
        triggerWithoutPayload.StepFuncArn = treeItem.StepFuncArn;
        triggerWithoutPayload.Region = treeItem.Region;
        triggerWithoutPayload.Parent = triggerItem;
        triggerItem.Children.push(triggerWithoutPayload);
        for (var i = 0; i < StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList.length; i++) {
            if (StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList[i].Region === Region
                && StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList[i].StepFunc === StepFuncArn) {
                this.AddNewPayloadPathNode(triggerItem, StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList[i].PayloadPath);
            }
        }
        let logsItem = new StepFuncTreeItem_1.StepFuncTreeItem("Logs", StepFuncTreeItem_1.TreeItemType.LogGroup);
        logsItem.StepFuncArn = treeItem.StepFuncArn;
        logsItem.Region = treeItem.Region;
        logsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        logsItem.Parent = treeItem;
        treeItem.Children.push(logsItem);
        let executionsItem = new StepFuncTreeItem_1.StepFuncTreeItem("Executions", StepFuncTreeItem_1.TreeItemType.ExecutionGroup);
        executionsItem.StepFuncArn = treeItem.StepFuncArn;
        executionsItem.Region = treeItem.Region;
        executionsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        executionsItem.Parent = treeItem;
        treeItem.Children.push(executionsItem);
        let runningExecutionsItem = new StepFuncTreeItem_1.StepFuncTreeItem("Running Executions", StepFuncTreeItem_1.TreeItemType.RunningExecutionGroup);
        runningExecutionsItem.StepFuncArn = treeItem.StepFuncArn;
        runningExecutionsItem.Region = treeItem.Region;
        runningExecutionsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        runningExecutionsItem.Parent = treeItem;
        treeItem.Children.push(runningExecutionsItem);
        let successfulExecutionsItem = new StepFuncTreeItem_1.StepFuncTreeItem("Successful Executions", StepFuncTreeItem_1.TreeItemType.SuccessfulExecutionGroup);
        successfulExecutionsItem.StepFuncArn = treeItem.StepFuncArn;
        successfulExecutionsItem.Region = treeItem.Region;
        successfulExecutionsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        successfulExecutionsItem.Parent = treeItem;
        treeItem.Children.push(successfulExecutionsItem);
        let failedExecutionsItem = new StepFuncTreeItem_1.StepFuncTreeItem("Failed Executions", StepFuncTreeItem_1.TreeItemType.FailedExecutionGroup);
        failedExecutionsItem.StepFuncArn = treeItem.StepFuncArn;
        failedExecutionsItem.Region = treeItem.Region;
        failedExecutionsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        failedExecutionsItem.Parent = treeItem;
        treeItem.Children.push(failedExecutionsItem);
        return treeItem;
    }
    AddPayloadPath(node, PayloadPath) {
        for (var i = 0; i < StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList.length; i++) {
            if (StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList[i].Region === node.Region
                && StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList[i].StepFunc === node.StepFuncArn
                && StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList[i].PayloadPath === PayloadPath) {
                return;
            }
        }
        this.AddNewPayloadPathNode(node, PayloadPath);
        StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList.push({ Region: node.Region, StepFunc: node.StepFuncArn, PayloadPath: PayloadPath });
        this.Refresh();
    }
    AddNewPayloadPathNode(node, PayloadPath) {
        let fileName = PayloadPath.split("/").pop();
        if (!fileName) {
            fileName = PayloadPath;
        }
        let treeItem = new StepFuncTreeItem_1.StepFuncTreeItem(fileName, StepFuncTreeItem_1.TreeItemType.TriggerFilePayload);
        treeItem.Region = node.Region;
        treeItem.StepFuncArn = node.StepFuncArn;
        treeItem.PayloadPath = PayloadPath;
        treeItem.Parent = node;
        node.Children.push(treeItem);
    }
    RemovePayloadPath(node) {
        if (!node.Parent) {
            return;
        }
        for (var i = 0; i < StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList.length; i++) {
            if (StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList[i].Region === node.Region
                && StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList[i].StepFunc === node.StepFuncArn
                && StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList[i].PayloadPath === node.PayloadPath) {
                StepFuncTreeView_1.StepFuncTreeView.Current.PayloadPathList.splice(i, 1);
            }
        }
        let parentNode = node.Parent;
        for (var i = 0; i < parentNode.Children.length; i++) {
            if (parentNode.Children[i].Region === node.Region
                && parentNode.Children[i].StepFuncArn === node.StepFuncArn
                && parentNode.Children[i].PayloadPath === node.PayloadPath) {
                parentNode.Children.splice(i, 1);
            }
        }
        this.Refresh();
    }
    AddCodePath(Region, StepFunc, CodePath) {
        //remove old
        for (var i = 0; i < StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList.length; i++) {
            if (StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList[i].Region === Region && StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList[i].StepFunc === StepFunc) {
                StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList.splice(i, 1);
            }
        }
        StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList.push({ Region: Region, StepFunc: StepFunc, CodePath: CodePath });
        this.Refresh();
    }
    RemoveCodePath(Region, StepFunc) {
        for (var i = 0; i < StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList.length; i++) {
            if (StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList[i].Region === Region && StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList[i].StepFunc === StepFunc) {
                StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList.splice(i, 1);
            }
        }
        this.Refresh();
    }
    GetCodePath(Region, StepFunc) {
        for (var item of StepFuncTreeView_1.StepFuncTreeView.Current.CodePathList) {
            if (item.Region === Region && item.StepFunc === StepFunc) {
                return item.CodePath;
            }
        }
        return "";
    }
    getChildren(node) {
        let result = [];
        if (!node) {
            result.push(...this.GetStepFuncNodes());
        }
        else if (node.Children.length > 0) {
            result.push(...node.Children);
        }
        return Promise.resolve(result);
    }
    GetStepFuncNodes() {
        var result = [];
        for (var node of this.StepFuncNodeList) {
            if (StepFuncTreeView_1.StepFuncTreeView.Current && StepFuncTreeView_1.StepFuncTreeView.Current.FilterString && !node.IsFilterStringMatch(StepFuncTreeView_1.StepFuncTreeView.Current.FilterString)) {
                continue;
            }
            if (StepFuncTreeView_1.StepFuncTreeView.Current && StepFuncTreeView_1.StepFuncTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (StepFuncTreeView_1.StepFuncTreeView.Current && !StepFuncTreeView_1.StepFuncTreeView.Current.isShowHiddenNodes && (node.IsHidden)) {
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
exports.StepFuncTreeDataProvider = StepFuncTreeDataProvider;
var ViewType;
(function (ViewType) {
    ViewType[ViewType["StepFunc"] = 1] = "StepFunc";
})(ViewType || (exports.ViewType = ViewType = {}));
//# sourceMappingURL=StepFuncTreeDataProvider.js.map