"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
class LambdaTreeItem extends WorkbenchTreeItem_1.WorkbenchTreeItem {
    // flag accessors inherited from WorkbenchTreeItem
    TreeItemType;
    Text;
    Lambda = "";
    Region = "";
    LogStreamName;
    // Parent/Children provided by WorkbenchTreeItem
    TriggerConfigPath;
    codePath;
    PayloadPath;
    ResponsePayload;
    EnvironmentVariableName;
    EnvironmentVariableValue;
    TagKey;
    TagValue;
    InfoKey;
    InfoValue;
    IsRunning = false;
    constructor(text, treeItemType) {
        super(text);
        this.Text = text;
        this.TreeItemType = treeItemType;
        this.refreshUI();
    }
    setContextValue() {
        let contextValue = "#Type:Lambda#";
        contextValue += this.IsFav ? "Fav#" : "!Fav#";
        contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
        contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";
        if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaFunction) {
            contextValue += "Lambda#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaCode) {
            contextValue += "Code#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTriggerGroup) {
            contextValue += "TriggerGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTriggerSavedPayload) {
            contextValue += "TriggerSavedPayload#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTriggerWithPayload) {
            contextValue += "TriggerWithPayload#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTriggerFilePayload) {
            contextValue += "TriggerFilePayload#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTriggerNoPayload) {
            contextValue += "TriggerNoPayload#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaResponsePayload) {
            contextValue += "ResponsePayload#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaLogGroup) {
            contextValue += "LogGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaLogStream) {
            contextValue += "LogStream#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaCodePath) {
            contextValue += "CodePath#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaEnvironmentVariableGroup) {
            contextValue += "EnvironmentVariableGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaEnvironmentVariable) {
            contextValue += "EnvironmentVariable#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTagsGroup) {
            contextValue += "TagsGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTag) {
            contextValue += "Tag#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaInfoGroup) {
            contextValue += "InfoGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaInfoItem) {
            contextValue += "InfoItem#";
        }
        else {
            contextValue += "Other#";
        }
        this.contextValue = contextValue;
    }
    set CodePath(path) {
        if (this.TreeItemType !== TreeItemType_1.TreeItemType.LambdaCode) {
            return;
        }
        this.codePath = path;
        if (path && this.Children.length === 0) {
            let node = new LambdaTreeItem(path, TreeItemType_1.TreeItemType.LambdaCodePath);
            node.Lambda = this.Lambda;
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
        if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaFunction) {
            this.iconPath = new vscode.ThemeIcon('server-process');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaCode) {
            this.iconPath = new vscode.ThemeIcon('file-code');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTriggerGroup) {
            this.iconPath = new vscode.ThemeIcon('run-all');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTriggerSavedPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTriggerWithPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket-dot');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTriggerFilePayload) {
            this.iconPath = new vscode.ThemeIcon('file');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTriggerNoPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket-error');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaResponsePayload) {
            this.iconPath = new vscode.ThemeIcon('output');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaLogGroup) {
            this.iconPath = new vscode.ThemeIcon('output');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaLogStream) {
            this.iconPath = new vscode.ThemeIcon('output');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaCodePath) {
            this.iconPath = new vscode.ThemeIcon('file');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaEnvironmentVariableGroup) {
            this.iconPath = new vscode.ThemeIcon('wrench');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaEnvironmentVariable) {
            this.iconPath = new vscode.ThemeIcon('wrench');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTagsGroup) {
            this.iconPath = new vscode.ThemeIcon('tag');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTag) {
            this.iconPath = new vscode.ThemeIcon('tag');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaInfoGroup) {
            this.iconPath = new vscode.ThemeIcon('info');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaInfoItem) {
            this.iconPath = new vscode.ThemeIcon('symbol-property');
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
exports.LambdaTreeItem = LambdaTreeItem;
//# sourceMappingURL=LambdaTreeItem.js.map