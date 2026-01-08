"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamodbTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
class DynamodbTreeItem extends vscode.TreeItem {
    IsFav = false;
    TreeItemType;
    Text;
    Dynamodb = "";
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
    IsRunning = false;
    ReadCapacity;
    WriteCapacity;
    constructor(text, treeItemType) {
        super(text);
        this.Text = text;
        this.TreeItemType = treeItemType;
        this.refreshUI();
    }
    set CodePath(path) {
        if (this.TreeItemType !== TreeItemType_1.TreeItemType.DynamoDBCode) {
            return;
        }
        this.codePath = path;
        if (path && this.Children.length === 0) {
            let node = new DynamodbTreeItem(path, TreeItemType_1.TreeItemType.DynamoDBCodePath);
            node.Dynamodb = this.Dynamodb;
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
        if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTable) {
            this.iconPath = new vscode.ThemeIcon('server-process');
            this.contextValue = "Dynamodb";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBCode) {
            this.iconPath = new vscode.ThemeIcon('file-code');
            this.contextValue = "Code";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTriggerGroup) {
            this.iconPath = new vscode.ThemeIcon('run-all');
            this.contextValue = "TriggerGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTriggerSavedPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket');
            this.contextValue = "TriggerSavedPayload";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTriggerWithPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket-dot');
            this.contextValue = "TriggerWithPayload";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTriggerFilePayload) {
            this.iconPath = new vscode.ThemeIcon('file');
            this.contextValue = "TriggerFilePayload";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTriggerNoPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket-error');
            this.contextValue = "TriggerNoPayload";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBResponsePayload) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "ResponsePayload";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBLogGroup) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "LogGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBLogStream) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "LogStream";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBCodePath) {
            this.iconPath = new vscode.ThemeIcon('file');
            this.contextValue = "CodePath";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBEnvironmentVariableGroup) {
            this.iconPath = new vscode.ThemeIcon('wrench');
            this.contextValue = "EnvironmentVariableGroup";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBEnvironmentVariable) {
            this.iconPath = new vscode.ThemeIcon('wrench');
            this.contextValue = "EnvironmentVariable";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBPrimaryKey) {
            this.iconPath = new vscode.ThemeIcon('key');
            this.contextValue = "PrimaryKey";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBPartitionKey) {
            this.iconPath = new vscode.ThemeIcon('symbol-key');
            this.contextValue = "PartitionKey";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBSortKey) {
            this.iconPath = new vscode.ThemeIcon('symbol-key');
            this.contextValue = "SortKey";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBCapacity) {
            this.iconPath = new vscode.ThemeIcon('dashboard');
            this.contextValue = "Capacity";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTableInfo) {
            this.iconPath = new vscode.ThemeIcon('info');
            this.contextValue = "TableInfo";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBIndexes) {
            this.iconPath = new vscode.ThemeIcon('list-tree');
            this.contextValue = "Indexes";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBIndex) {
            this.iconPath = new vscode.ThemeIcon('symbol-array');
            this.contextValue = "Index";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTableSize) {
            this.iconPath = new vscode.ThemeIcon('database');
            this.contextValue = "TableSize";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBItemCount) {
            this.iconPath = new vscode.ThemeIcon('symbol-number');
            this.contextValue = "ItemCount";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTableClass) {
            this.iconPath = new vscode.ThemeIcon('archive');
            this.contextValue = "TableClass";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTableStatus) {
            this.iconPath = new vscode.ThemeIcon('pulse');
            this.contextValue = "TableStatus";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBReadCapacity) {
            this.iconPath = new vscode.ThemeIcon('arrow-down');
            this.contextValue = "ReadCapacity";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBWriteCapacity) {
            this.iconPath = new vscode.ThemeIcon('arrow-up');
            this.contextValue = "WriteCapacity";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTags) {
            this.iconPath = new vscode.ThemeIcon('tag');
            this.contextValue = "Tags";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTagItem) {
            this.iconPath = new vscode.ThemeIcon('tag');
            this.contextValue = "TagItem";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBCapacityExplanation) {
            this.iconPath = new vscode.ThemeIcon('info');
            this.contextValue = "CapacityExplanation";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTableArn) {
            this.iconPath = new vscode.ThemeIcon('link');
            this.contextValue = "TableArn";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBAverageItemSize) {
            this.iconPath = new vscode.ThemeIcon('symbol-ruler');
            this.contextValue = "AverageItemSize";
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
            if (n.Text.includes(FilterString) || n.Region?.includes(FilterString) || n.Dynamodb?.includes(FilterString)) {
                return true;
            }
            else if (n.Children.length > 0) {
                return this.IsFilterStringMatchAnyChildren(n, FilterString);
            }
        }
        return false;
    }
}
exports.DynamodbTreeItem = DynamodbTreeItem;
//# sourceMappingURL=DynamodbTreeItem.js.map