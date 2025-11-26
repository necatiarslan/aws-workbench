"use strict";
/**
 * S3 Tree Item
 *
 * Tree item for S3 resources extending BaseTreeItem
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESOURCE_TYPE_OPTIONS = exports.S3TreeItem = exports.TreeItemType = void 0;
const vscode = require("vscode");
const BaseTreeItem_1 = require("../../../core/tree/BaseTreeItem");
// Keep the old TreeItemType for backward compatibility during migration
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
/**
 * S3TreeItem extends BaseTreeItem with S3-specific functionality
 */
class S3TreeItem extends BaseTreeItem_1.BaseTreeItem {
    // S3-specific properties
    Text;
    Bucket;
    Shortcut;
    FolderPath;
    TreeItemType;
    // Parent and children (provide both readonly and writable access)
    get Parent() {
        return this.parent;
    }
    set Parent(value) {
        this.parent = value;
    }
    // Expose children array directly (writable)
    get Children() {
        return this.children;
    }
    set Children(value) {
        this.children = value;
    }
    // Mapped properties for backward compatibility
    get IsFav() {
        return this.isFavorite;
    }
    set IsFav(value) {
        this.isFavorite = value;
        this.updateContextValue();
    }
    get IsHidden() {
        return this.isHidden;
    }
    set IsHidden(value) {
        this.isHidden = value;
        this.updateContextValue();
    }
    get ProfileToShow() {
        return this.profileName || '';
    }
    set ProfileToShow(value) {
        this.profileName = value || undefined;
        this.updateContextValue();
    }
    constructor(text, treeItemType) {
        // Map TreeItemType to ResourceType and NodeType
        const { resourceType, nodeType } = S3TreeItem.mapTreeItemType(treeItemType);
        super({
            label: text,
            resourceType: resourceType,
            nodeType: nodeType,
            collapsibleState: treeItemType === TreeItemType.Folder
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None,
        });
        this.Text = text;
        this.TreeItemType = treeItemType;
        this.refreshUI();
    }
    /**
     * Map old TreeItemType to new ResourceType and NodeType
     */
    static mapTreeItemType(treeItemType) {
        switch (treeItemType) {
            case TreeItemType.Folder:
                return { resourceType: BaseTreeItem_1.ResourceType.FOLDER, nodeType: BaseTreeItem_1.NodeType.FOLDER };
            case TreeItemType.Bucket:
                return { resourceType: BaseTreeItem_1.ResourceType.S3_BUCKET, nodeType: BaseTreeItem_1.NodeType.RESOURCE };
            case TreeItemType.Shortcut:
                return { resourceType: BaseTreeItem_1.ResourceType.SHORTCUT, nodeType: BaseTreeItem_1.NodeType.SHORTCUT };
            case TreeItemType.LambdaFunction:
                return { resourceType: BaseTreeItem_1.ResourceType.LAMBDA_FUNCTION, nodeType: BaseTreeItem_1.NodeType.RESOURCE };
            case TreeItemType.CloudWatchLogGroup:
                return { resourceType: BaseTreeItem_1.ResourceType.CLOUDWATCH_LOG_GROUP, nodeType: BaseTreeItem_1.NodeType.RESOURCE };
            case TreeItemType.SNSTopic:
                return { resourceType: BaseTreeItem_1.ResourceType.SNS_TOPIC, nodeType: BaseTreeItem_1.NodeType.RESOURCE };
            case TreeItemType.DynamoDBTable:
                return { resourceType: BaseTreeItem_1.ResourceType.DYNAMODB_TABLE, nodeType: BaseTreeItem_1.NodeType.RESOURCE };
            case TreeItemType.SQSQueue:
                return { resourceType: BaseTreeItem_1.ResourceType.SQS_QUEUE, nodeType: BaseTreeItem_1.NodeType.RESOURCE };
            case TreeItemType.StepFunction:
                return { resourceType: BaseTreeItem_1.ResourceType.S3_BUCKET, nodeType: BaseTreeItem_1.NodeType.RESOURCE }; // TODO: Add StepFunction type
            case TreeItemType.IAMRole:
                return { resourceType: BaseTreeItem_1.ResourceType.IAM_ROLE, nodeType: BaseTreeItem_1.NodeType.RESOURCE };
            default:
                return { resourceType: BaseTreeItem_1.ResourceType.S3_BUCKET, nodeType: BaseTreeItem_1.NodeType.RESOURCE };
        }
    }
    /**
     * Set context value for command filtering
     */
    setContextValue() {
        let contextValue = '#';
        contextValue += this.IsFav ? 'Fav#' : '!Fav#';
        contextValue += this.IsHidden ? 'Hidden#' : '!Hidden#';
        contextValue += this.TreeItemType === TreeItemType.Folder ? 'Folder#' : '';
        contextValue += this.TreeItemType === TreeItemType.Bucket ? 'Bucket#' : '';
        contextValue += this.TreeItemType === TreeItemType.Shortcut ? 'Shortcut#' : '';
        contextValue += this.ProfileToShow ? 'Profile#' : 'NoProfile#';
        this.contextValue = contextValue;
    }
    /**
     * Refresh UI elements
     */
    refreshUI() {
        switch (this.TreeItemType) {
            case TreeItemType.Folder:
                this.iconPath = new vscode.ThemeIcon('folder');
                this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
                break;
            case TreeItemType.Bucket:
                this.iconPath = new vscode.ThemeIcon('package');
                break;
            case TreeItemType.Shortcut:
                this.iconPath = new vscode.ThemeIcon('file-symlink-directory');
                break;
            case TreeItemType.LambdaFunction:
                this.iconPath = new vscode.ThemeIcon('symbol-method');
                break;
            case TreeItemType.CloudWatchLogGroup:
                this.iconPath = new vscode.ThemeIcon('output');
                break;
            case TreeItemType.SNSTopic:
                this.iconPath = new vscode.ThemeIcon('broadcast');
                break;
            case TreeItemType.DynamoDBTable:
                this.iconPath = new vscode.ThemeIcon('database');
                break;
            case TreeItemType.SQSQueue:
                this.iconPath = new vscode.ThemeIcon('inbox');
                break;
            case TreeItemType.StepFunction:
                this.iconPath = new vscode.ThemeIcon('symbol-namespace');
                break;
            case TreeItemType.IAMRole:
                this.iconPath = new vscode.ThemeIcon('shield');
                break;
            default:
                this.iconPath = new vscode.ThemeIcon('circle-outline');
                break;
        }
        this.setContextValue();
    }
    /**
     * Check if any children are favorites
     */
    IsAnyChidrenFav() {
        return this.IsAnyChidrenFavInternal(this);
    }
    /**
     * Internal recursive check for favorite children
     */
    IsAnyChidrenFavInternal(node) {
        for (const child of node.Children) {
            if (child.IsFav) {
                return true;
            }
            else if (child.Children.length > 0) {
                if (this.IsAnyChidrenFavInternal(child)) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Check if filter string matches this node or any children
     */
    IsFilterStringMatch(filterString) {
        if (this.Text.includes(filterString)) {
            return true;
        }
        return this.IsFilterStringMatchAnyChildren(this, filterString);
    }
    /**
     * Internal recursive check for filter string match in children
     */
    IsFilterStringMatchAnyChildren(node, filterString) {
        for (const child of node.Children) {
            if (child.Text.includes(filterString)) {
                return true;
            }
            else if (child.Children.length > 0) {
                if (this.IsFilterStringMatchAnyChildren(child, filterString)) {
                    return true;
                }
            }
        }
        return false;
    }
}
exports.S3TreeItem = S3TreeItem;
/**
 * Available resource types for selection
 */
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