"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESOURCE_TYPE_OPTIONS = exports.TreeItemType = exports.S3TreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
class S3TreeItem extends vscode.TreeItem {
    _isFav = false;
    TreeItemType;
    Text;
    Bucket;
    Shortcut;
    FolderPath; // For folder hierarchy
    Parent;
    Children = [];
    _isHidden = false;
    _profileToShow = "";
    set ProfileToShow(value) {
        this._profileToShow = value;
        this.setContextValue();
    }
    get ProfileToShow() {
        return this._profileToShow;
    }
    set IsHidden(value) {
        this._isHidden = value;
        this.setContextValue();
    }
    get IsHidden() {
        return this._isHidden;
    }
    set IsFav(value) {
        this._isFav = value;
        this.setContextValue();
    }
    get IsFav() {
        return this._isFav;
    }
    constructor(text, treeItemType) {
        super(text);
        this.Text = text;
        this.TreeItemType = treeItemType;
        this.refreshUI();
    }
    setContextValue() {
        let contextValue = "#";
        contextValue += this.IsFav ? "Fav#" : "!Fav#";
        contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
        contextValue += this.TreeItemType === TreeItemType.Folder ? "Folder#" : "";
        contextValue += this.TreeItemType === TreeItemType.Bucket ? "Bucket#" : "";
        contextValue += this.TreeItemType === TreeItemType.Shortcut ? "Shortcut#" : "";
        contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";
        this.contextValue = contextValue;
    }
    refreshUI() {
        if (this.TreeItemType === TreeItemType.Folder) {
            this.iconPath = new vscode.ThemeIcon('folder');
            this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }
        else if (this.TreeItemType === TreeItemType.Bucket) {
            this.iconPath = new vscode.ThemeIcon('package');
        }
        else if (this.TreeItemType === TreeItemType.Shortcut) {
            this.iconPath = new vscode.ThemeIcon('file-symlink-directory');
        }
        else if (this.TreeItemType === TreeItemType.LambdaFunction) {
            this.iconPath = new vscode.ThemeIcon('symbol-method');
        }
        else if (this.TreeItemType === TreeItemType.CloudWatchLogGroup) {
            this.iconPath = new vscode.ThemeIcon('output');
        }
        else if (this.TreeItemType === TreeItemType.SNSTopic) {
            this.iconPath = new vscode.ThemeIcon('broadcast');
        }
        else if (this.TreeItemType === TreeItemType.DynamoDBTable) {
            this.iconPath = new vscode.ThemeIcon('database');
        }
        else if (this.TreeItemType === TreeItemType.SQSQueue) {
            this.iconPath = new vscode.ThemeIcon('inbox');
        }
        else if (this.TreeItemType === TreeItemType.StepFunction) {
            this.iconPath = new vscode.ThemeIcon('symbol-namespace');
        }
        else if (this.TreeItemType === TreeItemType.IAMRole) {
            this.iconPath = new vscode.ThemeIcon('shield');
        }
        else {
            this.iconPath = new vscode.ThemeIcon('circle-outline');
        }
        this.setContextValue();
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
            if (n.Text.includes(FilterString)) {
                return true;
            }
            else if (n.Children.length > 0) {
                return this.IsFilterStringMatchAnyChildren(n, FilterString);
            }
        }
        return false;
    }
}
exports.S3TreeItem = S3TreeItem;
var TreeItemType;
(function (TreeItemType) {
    TreeItemType[TreeItemType["Folder"] = 0] = "Folder";
    TreeItemType[TreeItemType["Bucket"] = 1] = "Bucket";
    TreeItemType[TreeItemType["Shortcut"] = 2] = "Shortcut";
    TreeItemType[TreeItemType["LambdaFunction"] = 3] = "LambdaFunction";
    TreeItemType[TreeItemType["CloudWatchLogGroup"] = 4] = "CloudWatchLogGroup";
    TreeItemType[TreeItemType["SNSTopic"] = 5] = "SNSTopic";
    TreeItemType[TreeItemType["DynamoDBTable"] = 6] = "DynamoDBTable";
    TreeItemType[TreeItemType["SQSQueue"] = 7] = "SQSQueue";
    TreeItemType[TreeItemType["StepFunction"] = 8] = "StepFunction";
    TreeItemType[TreeItemType["IAMRole"] = 9] = "IAMRole";
})(TreeItemType || (exports.TreeItemType = TreeItemType = {}));
exports.RESOURCE_TYPE_OPTIONS = [
    {
        label: 'Folder',
        description: 'Organize resources into folders',
        type: TreeItemType.Folder,
        icon: 'folder'
    },
    {
        label: 'S3 Bucket',
        description: 'Add an S3 bucket',
        type: TreeItemType.Bucket,
        icon: 'package'
    },
    {
        label: 'Lambda Function',
        description: 'Add a Lambda function',
        type: TreeItemType.LambdaFunction,
        icon: 'symbol-method'
    },
    {
        label: 'CloudWatch Log Group',
        description: 'Add a CloudWatch log group',
        type: TreeItemType.CloudWatchLogGroup,
        icon: 'output'
    },
    {
        label: 'SNS Topic',
        description: 'Add an SNS topic',
        type: TreeItemType.SNSTopic,
        icon: 'broadcast'
    },
    {
        label: 'DynamoDB Table',
        description: 'Add a DynamoDB table',
        type: TreeItemType.DynamoDBTable,
        icon: 'database'
    },
    {
        label: 'SQS Queue',
        description: 'Add an SQS queue',
        type: TreeItemType.SQSQueue,
        icon: 'inbox'
    },
    {
        label: 'Step Function',
        description: 'Add a Step Function state machine',
        type: TreeItemType.StepFunction,
        icon: 'symbol-namespace'
    },
    {
        label: 'IAM Role',
        description: 'Add an IAM role',
        type: TreeItemType.IAMRole,
        icon: 'shield'
    }
];
//# sourceMappingURL=S3TreeItem.js.map