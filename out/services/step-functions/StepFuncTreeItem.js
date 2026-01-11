"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepFuncTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
class StepFuncTreeItem extends WorkbenchTreeItem_1.WorkbenchTreeItem {
    // flag accessors inherited from WorkbenchTreeItem
    TreeItemType;
    Text;
    StepFuncArn = "";
    StepFuncName = "";
    Region = "";
    StepFuncDefinition;
    LogStreamName;
    // Parent/Children provided by WorkbenchTreeItem
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
    setContextValue() {
        let contextValue = "#Type:StepFunctions#";
        contextValue += this.IsFav ? "Fav#" : "!Fav#";
        contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
        contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";
        if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsStateMachine) {
            contextValue += "StepFunc#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsCode) {
            contextValue += "Code#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsTriggerGroup) {
            contextValue += "TriggerGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsTriggerSavedPayload) {
            contextValue += "TriggerSavedPayload#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsTriggerWithPayload) {
            contextValue += "TriggerWithPayload#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsTriggerFilePayload) {
            contextValue += "TriggerFilePayload#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsTriggerNoPayload) {
            contextValue += "TriggerNoPayload#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsResponsePayload) {
            contextValue += "ResponsePayload#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsLogGroup) {
            contextValue += "LogGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsLogStream) {
            contextValue += "LogStream#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsCodePath) {
            contextValue += "CodePath#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsEnvironmentVariableGroup) {
            contextValue += "EnvironmentVariableGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsEnvironmentVariable) {
            contextValue += "EnvironmentVariable#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsExecutionGroup) {
            contextValue += "ExecutionGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsExecution) {
            contextValue += "Execution#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsSuccessfulExecutionGroup) {
            contextValue += "SuccessfulExecutionGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsFailedExecutionGroup) {
            contextValue += "FailedExecutionGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsRunningExecutionGroup) {
            contextValue += "RunningExecutionGroup#";
        }
        else {
            contextValue += "Other#";
        }
        this.contextValue = contextValue;
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
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsCode) {
            this.iconPath = new vscode.ThemeIcon('file-code');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsTriggerGroup) {
            this.iconPath = new vscode.ThemeIcon('run-all');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsTriggerSavedPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsTriggerWithPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket-dot');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsTriggerFilePayload) {
            this.iconPath = new vscode.ThemeIcon('file');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsTriggerNoPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket-error');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsResponsePayload) {
            this.iconPath = new vscode.ThemeIcon('output');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsLogGroup) {
            this.iconPath = new vscode.ThemeIcon('output');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsLogStream) {
            this.iconPath = new vscode.ThemeIcon('output');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsCodePath) {
            this.iconPath = new vscode.ThemeIcon('file');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsEnvironmentVariableGroup) {
            this.iconPath = new vscode.ThemeIcon('wrench');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsEnvironmentVariable) {
            this.iconPath = new vscode.ThemeIcon('wrench');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsExecutionGroup) {
            this.iconPath = new vscode.ThemeIcon('list-tree');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsExecution) {
            this.iconPath = new vscode.ThemeIcon('symbol-event');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsSuccessfulExecutionGroup) {
            this.iconPath = new vscode.ThemeIcon('pass');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsFailedExecutionGroup) {
            this.iconPath = new vscode.ThemeIcon('error');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.StepFunctionsRunningExecutionGroup) {
            this.iconPath = new vscode.ThemeIcon('sync');
        }
        else {
            this.iconPath = new vscode.ThemeIcon('circle-outline');
        }
        if (this.IsRunning) {
            this.iconPath = new vscode.ThemeIcon('loading~spin');
        }
        this.setContextValue();
    }
}
exports.StepFuncTreeItem = StepFuncTreeItem;
//# sourceMappingURL=StepFuncTreeItem.js.map