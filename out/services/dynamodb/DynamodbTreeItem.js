"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamodbTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
class DynamodbTreeItem extends WorkbenchTreeItem_1.WorkbenchTreeItem {
    TreeItemType;
    Text;
    Dynamodb = "";
    Region = "";
    LogStreamName;
    // Parent/Children provided by WorkbenchTreeItem
    // flag accessors inherited from WorkbenchTreeItem
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
    setContextValue() {
        let contextValue = "#Type:DynamoDB#";
        contextValue += this.IsFav ? "Fav#" : "!Fav#";
        contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
        contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";
        if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTable) {
            contextValue += "Table#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBCode) {
            contextValue += "Code#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTriggerGroup) {
            contextValue += "TriggerGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTriggerSavedPayload) {
            contextValue += "TriggerSavedPayload#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTriggerWithPayload) {
            contextValue += "TriggerWithPayload#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTriggerFilePayload) {
            contextValue += "TriggerFilePayload#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTriggerNoPayload) {
            contextValue += "TriggerNoPayload#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBResponsePayload) {
            contextValue += "ResponsePayload#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBLogGroup) {
            contextValue += "LogGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBLogStream) {
            contextValue += "LogStream#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBCodePath) {
            contextValue += "CodePath#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBEnvironmentVariableGroup) {
            contextValue += "EnvironmentVariableGroup#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBEnvironmentVariable) {
            contextValue += "EnvironmentVariable#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBPrimaryKey) {
            contextValue += "PrimaryKey#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBPartitionKey) {
            contextValue += "PartitionKey#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBSortKey) {
            contextValue += "SortKey#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBCapacity) {
            contextValue += "Capacity#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTableInfo) {
            contextValue += "TableInfo#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBIndexes) {
            contextValue += "Indexes#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBIndex) {
            contextValue += "Index#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTableSize) {
            contextValue += "TableSize#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBItemCount) {
            contextValue += "ItemCount#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTableClass) {
            contextValue += "TableClass#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTableStatus) {
            contextValue += "TableStatus#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBReadCapacity) {
            contextValue += "ReadCapacity#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBWriteCapacity) {
            contextValue += "WriteCapacity#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTags) {
            contextValue += "Tags#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTagItem) {
            contextValue += "TagItem#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBCapacityExplanation) {
            contextValue += "CapacityExplanation#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTableArn) {
            contextValue += "TableArn#";
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBAverageItemSize) {
            contextValue += "AverageItemSize#";
        }
        else {
            contextValue += "Other#";
        }
        this.contextValue = contextValue;
    }
    refreshUI() {
        if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTable) {
            this.iconPath = new vscode.ThemeIcon('server-process');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBCode) {
            this.iconPath = new vscode.ThemeIcon('file-code');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTriggerGroup) {
            this.iconPath = new vscode.ThemeIcon('run-all');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTriggerSavedPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTriggerWithPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket-dot');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTriggerFilePayload) {
            this.iconPath = new vscode.ThemeIcon('file');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTriggerNoPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket-error');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBResponsePayload) {
            this.iconPath = new vscode.ThemeIcon('output');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBLogGroup) {
            this.iconPath = new vscode.ThemeIcon('output');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBLogStream) {
            this.iconPath = new vscode.ThemeIcon('output');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBCodePath) {
            this.iconPath = new vscode.ThemeIcon('file');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBEnvironmentVariableGroup) {
            this.iconPath = new vscode.ThemeIcon('wrench');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBEnvironmentVariable) {
            this.iconPath = new vscode.ThemeIcon('wrench');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBPrimaryKey) {
            this.iconPath = new vscode.ThemeIcon('key');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBPartitionKey) {
            this.iconPath = new vscode.ThemeIcon('symbol-key');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBSortKey) {
            this.iconPath = new vscode.ThemeIcon('symbol-key');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBCapacity) {
            this.iconPath = new vscode.ThemeIcon('dashboard');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTableInfo) {
            this.iconPath = new vscode.ThemeIcon('info');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBIndexes) {
            this.iconPath = new vscode.ThemeIcon('list-tree');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBIndex) {
            this.iconPath = new vscode.ThemeIcon('symbol-array');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTableSize) {
            this.iconPath = new vscode.ThemeIcon('database');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBItemCount) {
            this.iconPath = new vscode.ThemeIcon('symbol-number');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTableClass) {
            this.iconPath = new vscode.ThemeIcon('archive');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTableStatus) {
            this.iconPath = new vscode.ThemeIcon('pulse');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBReadCapacity) {
            this.iconPath = new vscode.ThemeIcon('arrow-down');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBWriteCapacity) {
            this.iconPath = new vscode.ThemeIcon('arrow-up');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTags) {
            this.iconPath = new vscode.ThemeIcon('tag');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTagItem) {
            this.iconPath = new vscode.ThemeIcon('tag');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBCapacityExplanation) {
            this.iconPath = new vscode.ThemeIcon('info');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBTableArn) {
            this.iconPath = new vscode.ThemeIcon('link');
        }
        else if (this.TreeItemType === TreeItemType_1.TreeItemType.DynamoDBAverageItemSize) {
            this.iconPath = new vscode.ThemeIcon('symbol-ruler');
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
exports.DynamodbTreeItem = DynamodbTreeItem;
//# sourceMappingURL=DynamodbTreeItem.js.map