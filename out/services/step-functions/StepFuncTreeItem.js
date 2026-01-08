"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeItemType = exports.StepFuncTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
class StepFuncTreeItem extends vscode.TreeItem {
    IsFav = false;
    TreeItemType;
    Text;
    StepFuncArn = "";
    StepFuncName = "";
    Region = "";
    StepFuncDefinition;
    LogStreamName;
    Parent;
    Children = [];
    IsHidden = false;
    TriggerConfigPath;
    codePath;
    PayloadPath;
    ExecutionArn;
    ExecutionStatus;
    ExecutionDetails;
    EnvironmentVariableName;
    EnvironmentVariableValue;
    IsRunning = false;
    constructor(text, treeItemType) {
        super(text);
        this.Text = text;
        this.StepFuncName = text;
        this.TreeItemType = treeItemType;
        this.refreshUI();
    }
    static GetStepFuncName(stepFuncArn) {
        if (stepFuncArn) {
            let parts = stepFuncArn.split(":");
            return parts[parts.length - 1];
        }
        return "";
    }
    set CodePath(path) {
        if (this.TreeItemType !== TreeItemType.Code) {
            return;
        }
        this.codePath = path;
        if (path && this.Children.length === 0) {
            let node = new StepFuncTreeItem(path, TreeItemType.CodePath);
            node.StepFuncArn = this.StepFuncArn;
            node.Region = this.Region;
            node.Parent = this;
            this.Children.push(node);
            this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }
        else if (path && this.Children.length > 0) {
            let node = this.Children[0];
            node.label = path;
            node.Text = path;
        }
        else {
            this.Children = [];
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }
        //this.refreshUI();
    }
    get CodePath() {
        return this.codePath;
    }
    refreshUI() {
        if (this.TreeItemType === TreeItemType.StepFunc) {
            this.iconPath = new vscode.ThemeIcon('server-process');
            this.contextValue = "StepFunc";
        }
        else if (this.TreeItemType === TreeItemType.Code) {
            this.iconPath = new vscode.ThemeIcon('file-code');
            this.contextValue = "Code";
        }
        else if (this.TreeItemType === TreeItemType.TriggerGroup) {
            this.iconPath = new vscode.ThemeIcon('run-all');
            this.contextValue = "TriggerGroup";
        }
        else if (this.TreeItemType === TreeItemType.TriggerSavedPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket');
            this.contextValue = "TriggerSavedPayload";
        }
        else if (this.TreeItemType === TreeItemType.TriggerWithPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket-dot');
            this.contextValue = "TriggerWithPayload";
        }
        else if (this.TreeItemType === TreeItemType.TriggerFilePayload) {
            this.iconPath = new vscode.ThemeIcon('file');
            this.contextValue = "TriggerFilePayload";
        }
        else if (this.TreeItemType === TreeItemType.TriggerNoPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket-error');
            this.contextValue = "TriggerNoPayload";
        }
        else if (this.TreeItemType === TreeItemType.ResponsePayload) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "ResponsePayload";
        }
        else if (this.TreeItemType === TreeItemType.LogGroup) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "LogGroup";
        }
        else if (this.TreeItemType === TreeItemType.LogStream) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "LogStream";
        }
        else if (this.TreeItemType === TreeItemType.CodePath) {
            this.iconPath = new vscode.ThemeIcon('file');
            this.contextValue = "CodePath";
        }
        else if (this.TreeItemType === TreeItemType.EnvironmentVariableGroup) {
            this.iconPath = new vscode.ThemeIcon('wrench');
            this.contextValue = "EnvironmentVariableGroup";
        }
        else if (this.TreeItemType === TreeItemType.EnvironmentVariable) {
            this.iconPath = new vscode.ThemeIcon('wrench');
            this.contextValue = "EnvironmentVariable";
        }
        else if (this.TreeItemType === TreeItemType.ExecutionGroup) {
            this.iconPath = new vscode.ThemeIcon('list-tree');
            this.contextValue = "ExecutionGroup";
        }
        else if (this.TreeItemType === TreeItemType.Execution) {
            this.iconPath = new vscode.ThemeIcon('symbol-event');
            this.contextValue = "Execution";
        }
        else if (this.TreeItemType === TreeItemType.SuccessfulExecutionGroup) {
            this.iconPath = new vscode.ThemeIcon('pass');
            this.contextValue = "SuccessfulExecutionGroup";
        }
        else if (this.TreeItemType === TreeItemType.FailedExecutionGroup) {
            this.iconPath = new vscode.ThemeIcon('error');
            this.contextValue = "FailedExecutionGroup";
        }
        else if (this.TreeItemType === TreeItemType.RunningExecutionGroup) {
            this.iconPath = new vscode.ThemeIcon('sync');
            this.contextValue = "RunningExecutionGroup";
        }
        else {
            this.iconPath = new vscode.ThemeIcon('circle-outline');
            this.contextValue = "Other";
        }
        if (this.IsRunning) {
            this.iconPath = new vscode.ThemeIcon('loading~spin');
        }
    }
    IsAnyChidrenFav() {
        return this.IsAnyChidrenFavInternal(this);
    }
    IsAnyChidrenFavInternal(node) {
        for (var n of node.Children) {
            if (n.IsFav) {
                return true;
            }
            else if (n.Children.length > 0) {
                return this.IsAnyChidrenFavInternal(n);
            }
        }
        return false;
    }
    IsFilterStringMatch(FilterString) {
        if (this.Text.includes(FilterString)) {
            return true;
        }
        if (this.IsFilterStringMatchAnyChildren(this, FilterString)) {
            return true;
        }
        return false;
    }
    IsFilterStringMatchAnyChildren(node, FilterString) {
        for (var n of node.Children) {
            if (n.Text.includes(FilterString) || n.Region?.includes(FilterString) || n.StepFuncArn?.includes(FilterString)) {
                return true;
            }
            else if (n.Children.length > 0) {
                return this.IsFilterStringMatchAnyChildren(n, FilterString);
            }
        }
        return false;
    }
}
exports.StepFuncTreeItem = StepFuncTreeItem;
var TreeItemType;
(function (TreeItemType) {
    TreeItemType[TreeItemType["StepFunc"] = 1] = "StepFunc";
    TreeItemType[TreeItemType["Code"] = 2] = "Code";
    TreeItemType[TreeItemType["LogGroup"] = 3] = "LogGroup";
    TreeItemType[TreeItemType["LogStream"] = 4] = "LogStream";
    TreeItemType[TreeItemType["TriggerGroup"] = 5] = "TriggerGroup";
    TreeItemType[TreeItemType["TriggerSavedPayload"] = 6] = "TriggerSavedPayload";
    TreeItemType[TreeItemType["CodePath"] = 7] = "CodePath";
    TreeItemType[TreeItemType["TriggerNoPayload"] = 8] = "TriggerNoPayload";
    TreeItemType[TreeItemType["TriggerWithPayload"] = 9] = "TriggerWithPayload";
    TreeItemType[TreeItemType["TriggerFilePayload"] = 10] = "TriggerFilePayload";
    TreeItemType[TreeItemType["ResponsePayload"] = 11] = "ResponsePayload";
    TreeItemType[TreeItemType["EnvironmentVariableGroup"] = 12] = "EnvironmentVariableGroup";
    TreeItemType[TreeItemType["EnvironmentVariable"] = 13] = "EnvironmentVariable";
    TreeItemType[TreeItemType["ExecutionGroup"] = 14] = "ExecutionGroup";
    TreeItemType[TreeItemType["Execution"] = 15] = "Execution";
    TreeItemType[TreeItemType["SuccessfulExecutionGroup"] = 16] = "SuccessfulExecutionGroup";
    TreeItemType[TreeItemType["FailedExecutionGroup"] = 17] = "FailedExecutionGroup";
    TreeItemType[TreeItemType["RunningExecutionGroup"] = 18] = "RunningExecutionGroup";
})(TreeItemType || (exports.TreeItemType = TreeItemType = {}));
//# sourceMappingURL=StepFuncTreeItem.js.map