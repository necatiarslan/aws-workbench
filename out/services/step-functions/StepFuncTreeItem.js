"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepFuncTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
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
        if (this.TreeItemType !== TreeItemType_1.TreeItemType.StepFunctionsCode) {
            return;
        }
        this.codePath = path;
        if (path && this.Children.length === 0) {
            let node = new StepFuncTreeItem(path, TreeItemType_1.TreeItemType.StepFunctionsCodePath);
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
        if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsStateMachine) {
            this.iconPath = new vscode.ThemeIcon('server-process');
            this.contextValue = "StepFunc";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsCode) {
            this.iconPath = new vscode.ThemeIcon('file-code');
            this.contextValue = "Code";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsTriggerGroup) {
            this.iconPath = new vscode.ThemeIcon('run-all');
            this.contextValue = "TriggerGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsTriggerSavedPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket');
            this.contextValue = "TriggerSavedPayload";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsTriggerWithPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket-dot');
            this.contextValue = "TriggerWithPayload";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsTriggerFilePayload) {
            this.iconPath = new vscode.ThemeIcon('file');
            this.contextValue = "TriggerFilePayload";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsTriggerNoPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket-error');
            this.contextValue = "TriggerNoPayload";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsResponsePayload) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "ResponsePayload";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsLogGroup) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "LogGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsLogStream) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "LogStream";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsCodePath) {
            this.iconPath = new vscode.ThemeIcon('file');
            this.contextValue = "CodePath";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsEnvironmentVariableGroup) {
            this.iconPath = new vscode.ThemeIcon('wrench');
            this.contextValue = "EnvironmentVariableGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsEnvironmentVariable) {
            this.iconPath = new vscode.ThemeIcon('wrench');
            this.contextValue = "EnvironmentVariable";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsExecutionGroup) {
            this.iconPath = new vscode.ThemeIcon('list-tree');
            this.contextValue = "ExecutionGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsExecution) {
            this.iconPath = new vscode.ThemeIcon('symbol-event');
            this.contextValue = "Execution";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsSuccessfulExecutionGroup) {
            this.iconPath = new vscode.ThemeIcon('pass');
            this.contextValue = "SuccessfulExecutionGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsFailedExecutionGroup) {
            this.iconPath = new vscode.ThemeIcon('error');
            this.contextValue = "FailedExecutionGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsRunningExecutionGroup) {
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
//# sourceMappingURL=StepFuncTreeItem.js.map