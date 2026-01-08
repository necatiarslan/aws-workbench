"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeItemType = exports.DynamodbTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
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
        if (this.TreeItemType !== TreeItemType.Code) {
            return;
        }
        this.codePath = path;
        if (path && this.Children.length === 0) {
            let node = new DynamodbTreeItem(path, TreeItemType.CodePath);
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
        if (this.TreeItemType === TreeItemType.Dynamodb) {
            this.iconPath = new vscode.ThemeIcon('server-process');
            this.contextValue = "Dynamodb";
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
        else if (this.TreeItemType === TreeItemType.PrimaryKey) {
            this.iconPath = new vscode.ThemeIcon('key');
            this.contextValue = "PrimaryKey";
        }
        else if (this.TreeItemType === TreeItemType.PartitionKey) {
            this.iconPath = new vscode.ThemeIcon('symbol-key');
            this.contextValue = "PartitionKey";
        }
        else if (this.TreeItemType === TreeItemType.SortKey) {
            this.iconPath = new vscode.ThemeIcon('symbol-key');
            this.contextValue = "SortKey";
        }
        else if (this.TreeItemType === TreeItemType.Capacity) {
            this.iconPath = new vscode.ThemeIcon('dashboard');
            this.contextValue = "Capacity";
        }
        else if (this.TreeItemType === TreeItemType.TableInfo) {
            this.iconPath = new vscode.ThemeIcon('info');
            this.contextValue = "TableInfo";
        }
        else if (this.TreeItemType === TreeItemType.Indexes) {
            this.iconPath = new vscode.ThemeIcon('list-tree');
            this.contextValue = "Indexes";
        }
        else if (this.TreeItemType === TreeItemType.Index) {
            this.iconPath = new vscode.ThemeIcon('symbol-array');
            this.contextValue = "Index";
        }
        else if (this.TreeItemType === TreeItemType.TableSize) {
            this.iconPath = new vscode.ThemeIcon('database');
            this.contextValue = "TableSize";
        }
        else if (this.TreeItemType === TreeItemType.ItemCount) {
            this.iconPath = new vscode.ThemeIcon('symbol-number');
            this.contextValue = "ItemCount";
        }
        else if (this.TreeItemType === TreeItemType.TableClass) {
            this.iconPath = new vscode.ThemeIcon('archive');
            this.contextValue = "TableClass";
        }
        else if (this.TreeItemType === TreeItemType.TableStatus) {
            this.iconPath = new vscode.ThemeIcon('pulse');
            this.contextValue = "TableStatus";
        }
        else if (this.TreeItemType === TreeItemType.ReadCapacity) {
            this.iconPath = new vscode.ThemeIcon('arrow-down');
            this.contextValue = "ReadCapacity";
        }
        else if (this.TreeItemType === TreeItemType.WriteCapacity) {
            this.iconPath = new vscode.ThemeIcon('arrow-up');
            this.contextValue = "WriteCapacity";
        }
        else if (this.TreeItemType === TreeItemType.Tags) {
            this.iconPath = new vscode.ThemeIcon('tag');
            this.contextValue = "Tags";
        }
        else if (this.TreeItemType === TreeItemType.TagItem) {
            this.iconPath = new vscode.ThemeIcon('tag');
            this.contextValue = "TagItem";
        }
        else if (this.TreeItemType === TreeItemType.CapacityExplanation) {
            this.iconPath = new vscode.ThemeIcon('info');
            this.contextValue = "CapacityExplanation";
        }
        else if (this.TreeItemType === TreeItemType.TableArn) {
            this.iconPath = new vscode.ThemeIcon('link');
            this.contextValue = "TableArn";
        }
        else if (this.TreeItemType === TreeItemType.AverageItemSize) {
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
var TreeItemType;
(function (TreeItemType) {
    TreeItemType[TreeItemType["Dynamodb"] = 1] = "Dynamodb";
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
    TreeItemType[TreeItemType["PrimaryKey"] = 14] = "PrimaryKey";
    TreeItemType[TreeItemType["PartitionKey"] = 15] = "PartitionKey";
    TreeItemType[TreeItemType["SortKey"] = 16] = "SortKey";
    TreeItemType[TreeItemType["Capacity"] = 17] = "Capacity";
    TreeItemType[TreeItemType["TableInfo"] = 18] = "TableInfo";
    TreeItemType[TreeItemType["Indexes"] = 19] = "Indexes";
    TreeItemType[TreeItemType["Index"] = 20] = "Index";
    TreeItemType[TreeItemType["TableSize"] = 21] = "TableSize";
    TreeItemType[TreeItemType["ItemCount"] = 22] = "ItemCount";
    TreeItemType[TreeItemType["TableClass"] = 23] = "TableClass";
    TreeItemType[TreeItemType["TableStatus"] = 24] = "TableStatus";
    TreeItemType[TreeItemType["ReadCapacity"] = 25] = "ReadCapacity";
    TreeItemType[TreeItemType["WriteCapacity"] = 26] = "WriteCapacity";
    TreeItemType[TreeItemType["Tags"] = 27] = "Tags";
    TreeItemType[TreeItemType["TagItem"] = 28] = "TagItem";
    TreeItemType[TreeItemType["CapacityExplanation"] = 29] = "CapacityExplanation";
    TreeItemType[TreeItemType["TableArn"] = 30] = "TableArn";
    TreeItemType[TreeItemType["AverageItemSize"] = 31] = "AverageItemSize";
})(TreeItemType || (exports.TreeItemType = TreeItemType = {}));
//# sourceMappingURL=DynamodbTreeItem.js.map