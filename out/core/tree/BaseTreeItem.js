"use strict";
/**
 * Base Tree Item for AWS Workbench
 *
 * Provides common functionality for all service tree items
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTreeItem = exports.NodeType = exports.ResourceType = void 0;
const vscode = require("vscode");
var ResourceType;
(function (ResourceType) {
    ResourceType["S3_BUCKET"] = "s3";
    ResourceType["LAMBDA_FUNCTION"] = "lambda";
    ResourceType["CLOUDWATCH_LOG_GROUP"] = "cloudwatch-logs";
    ResourceType["DYNAMODB_TABLE"] = "dynamodb";
    ResourceType["IAM_USER"] = "iam-user";
    ResourceType["IAM_ROLE"] = "iam-role";
    ResourceType["IAM_POLICY"] = "iam-policy";
    ResourceType["SNS_TOPIC"] = "sns";
    ResourceType["SQS_QUEUE"] = "sqs";
    ResourceType["EC2_INSTANCE"] = "ec2";
    ResourceType["FOLDER"] = "folder";
    ResourceType["SHORTCUT"] = "shortcut";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var NodeType;
(function (NodeType) {
    NodeType["ROOT"] = "root";
    NodeType["SERVICE"] = "service";
    NodeType["RESOURCE"] = "resource";
    NodeType["FOLDER"] = "folder";
    NodeType["SHORTCUT"] = "shortcut";
    NodeType["PROPERTY"] = "property";
})(NodeType || (exports.NodeType = NodeType = {}));
/**
 * Base class for all tree items in the AWS Workbench
 */
class BaseTreeItem extends vscode.TreeItem {
    resourceType;
    nodeType;
    resourceArn;
    resourceName;
    children = [];
    // Visibility and favorite state
    isFavorite = false;
    isHidden = false;
    profileName; // If set, only show in this profile
    // Parent reference
    parent;
    constructor(config) {
        super(config.label, config.collapsibleState || vscode.TreeItemCollapsibleState.None);
        this.resourceType = config.resourceType;
        this.nodeType = config.nodeType;
        this.resourceArn = config.resourceArn;
        this.resourceName = config.resourceName;
        if (config.iconPath) {
            this.iconPath = config.iconPath;
        }
        if (config.contextValue) {
            this.contextValue = config.contextValue;
        }
        if (config.command) {
            this.command = config.command;
        }
        if (config.tooltip) {
            this.tooltip = config.tooltip;
        }
        if (config.description) {
            this.description = config.description;
        }
    }
    /**
     * Get the unique identifier for this tree item
     */
    getId() {
        if (this.resourceArn) {
            return this.resourceArn;
        }
        if (this.resourceName) {
            return `${this.resourceType}:${this.resourceName}`;
        }
        return `${this.resourceType}:${this.label}`;
    }
    /**
     * Add a child item
     */
    addChild(child) {
        child.parent = this;
        this.children.push(child);
        // Update collapsible state if we now have children
        if (this.children.length > 0 && this.collapsibleState === vscode.TreeItemCollapsibleState.None) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }
    }
    /**
     * Remove a child item
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            child.parent = undefined;
            // Update collapsible state if we no longer have children
            if (this.children.length === 0) {
                this.collapsibleState = vscode.TreeItemCollapsibleState.None;
            }
            return true;
        }
        return false;
    }
    /**
     * Find a child by predicate
     */
    findChild(predicate) {
        return this.children.find(predicate);
    }
    /**
     * Find all children matching predicate (recursive)
     */
    findChildrenRecursive(predicate) {
        const results = [];
        for (const child of this.children) {
            if (predicate(child)) {
                results.push(child);
            }
            results.push(...child.findChildrenRecursive(predicate));
        }
        return results;
    }
    /**
     * Get the full path from root to this item
     */
    getPath() {
        const path = [this];
        let current = this.parent;
        while (current) {
            path.unshift(current);
            current = current.parent;
        }
        return path;
    }
    /**
     * Get the depth of this item in the tree
     */
    getDepth() {
        let depth = 0;
        let current = this.parent;
        while (current) {
            depth++;
            current = current.parent;
        }
        return depth;
    }
    /**
     * Update the context value with state flags
     */
    updateContextValue() {
        const parts = [];
        // Add node type
        parts.push(`#${this.nodeType}#`);
        // Add resource type
        parts.push(`#${this.resourceType}#`);
        // Add state flags
        if (this.isFavorite) {
            parts.push('#Fav#');
        }
        else {
            parts.push('#!Fav#');
        }
        if (this.isHidden) {
            parts.push('#Hidden#');
        }
        else {
            parts.push('#!Hidden#');
        }
        if (this.profileName) {
            parts.push('#Profile#');
        }
        else {
            parts.push('#NoProfile#');
        }
        this.contextValue = parts.join('');
    }
    /**
     * Check if this item should be visible based on filters
     */
    isVisible(showOnlyFavorites, showHidden, currentProfile) {
        // Check favorite filter
        if (showOnlyFavorites && !this.isFavorite) {
            return false;
        }
        // Check hidden filter
        if (!showHidden && this.isHidden) {
            return false;
        }
        // Check profile filter
        if (this.profileName && currentProfile && this.profileName !== currentProfile) {
            return false;
        }
        return true;
    }
    /**
     * Toggle favorite state
     */
    toggleFavorite() {
        this.isFavorite = !this.isFavorite;
        this.updateContextValue();
    }
    /**
     * Toggle hidden state
     */
    toggleHidden() {
        this.isHidden = !this.isHidden;
        this.updateContextValue();
    }
    /**
     * Set profile restriction
     */
    setProfile(profileName) {
        this.profileName = profileName;
        this.updateContextValue();
    }
    /**
     * Get a user-friendly description of this item
     */
    getDescription() {
        const desc = typeof this.description === 'string' ? this.description : undefined;
        const label = typeof this.label === 'string' ? this.label : (this.label?.label || '');
        return desc || label || '';
    }
    /**
     * Clone this tree item (shallow copy, without children)
     */
    clone() {
        const label = typeof this.label === 'string' ? this.label : (this.label?.label || '');
        const desc = typeof this.description === 'string' ? this.description : undefined;
        const cloned = new BaseTreeItem({
            label: label,
            resourceType: this.resourceType,
            nodeType: this.nodeType,
            resourceArn: this.resourceArn,
            resourceName: this.resourceName,
            collapsibleState: this.collapsibleState,
            iconPath: this.iconPath,
            contextValue: this.contextValue,
            command: this.command,
            tooltip: this.tooltip,
            description: desc,
        });
        cloned.isFavorite = this.isFavorite;
        cloned.isHidden = this.isHidden;
        cloned.profileName = this.profileName;
        return cloned;
    }
}
exports.BaseTreeItem = BaseTreeItem;
//# sourceMappingURL=BaseTreeItem.js.map