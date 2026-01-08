"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
class LambdaTreeItem extends vscode.TreeItem {
    IsFav = false;
    TreeItemType;
    Text;
    Lambda = "";
    Region = "";
    LogStreamName;
    Parent;
    Children = [];
    IsHidden = false;
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
            this.contextValue = "Lambda";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaCode) {
            this.iconPath = new vscode.ThemeIcon('file-code');
            this.contextValue = "Code";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTriggerGroup) {
            this.iconPath = new vscode.ThemeIcon('run-all');
            this.contextValue = "TriggerGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTriggerSavedPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket');
            this.contextValue = "TriggerSavedPayload";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTriggerWithPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket-dot');
            this.contextValue = "TriggerWithPayload";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTriggerFilePayload) {
            this.iconPath = new vscode.ThemeIcon('file');
            this.contextValue = "TriggerFilePayload";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTriggerNoPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket-error');
            this.contextValue = "TriggerNoPayload";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaResponsePayload) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "ResponsePayload";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaLogGroup) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "LogGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaLogStream) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "LogStream";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaCodePath) {
            this.iconPath = new vscode.ThemeIcon('file');
            this.contextValue = "CodePath";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaEnvironmentVariableGroup) {
            this.iconPath = new vscode.ThemeIcon('wrench');
            this.contextValue = "EnvironmentVariableGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaEnvironmentVariable) {
            this.iconPath = new vscode.ThemeIcon('wrench');
            this.contextValue = "EnvironmentVariable";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTagsGroup) {
            this.iconPath = new vscode.ThemeIcon('tag');
            this.contextValue = "TagsGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaTag) {
            this.iconPath = new vscode.ThemeIcon('tag');
            this.contextValue = "Tag";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaInfoGroup) {
            this.iconPath = new vscode.ThemeIcon('info');
            this.contextValue = "InfoGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.LambdaInfoItem) {
            this.iconPath = new vscode.ThemeIcon('symbol-property');
            this.contextValue = "InfoItem";
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
            if (n.Text.includes(FilterString) || n.Region?.includes(FilterString) || n.Lambda?.includes(FilterString)) {
                return true;
            }
            else if (n.Children.length > 0) {
                return this.IsFilterStringMatchAnyChildren(n, FilterString);
            }
        }
        return false;
    }
}
exports.LambdaTreeItem = LambdaTreeItem;
//# sourceMappingURL=LambdaTreeItem.js.map