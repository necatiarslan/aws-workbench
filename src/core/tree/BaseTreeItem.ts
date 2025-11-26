/**
 * Base Tree Item for AWS Workbench
 * 
 * Provides common functionality for all service tree items
 */

import * as vscode from 'vscode';

export enum ResourceType {
	S3_BUCKET = 's3',
	LAMBDA_FUNCTION = 'lambda',
	CLOUDWATCH_LOG_GROUP = 'cloudwatch-logs',
	DYNAMODB_TABLE = 'dynamodb',
	IAM_USER = 'iam-user',
	IAM_ROLE = 'iam-role',
	IAM_POLICY = 'iam-policy',
	SNS_TOPIC = 'sns',
	SQS_QUEUE = 'sqs',
	EC2_INSTANCE = 'ec2',
	FOLDER = 'folder',
	SHORTCUT = 'shortcut',
}

export enum NodeType {
	ROOT = 'root',
	SERVICE = 'service',
	RESOURCE = 'resource',
	FOLDER = 'folder',
	SHORTCUT = 'shortcut',
	PROPERTY = 'property',
}

export interface BaseTreeItemConfig {
	label: string;
	resourceType: ResourceType;
	nodeType: NodeType;
	resourceArn?: string;
	resourceName?: string;
	collapsibleState?: vscode.TreeItemCollapsibleState;
	iconPath?: vscode.Uri | vscode.ThemeIcon | { light: vscode.Uri; dark: vscode.Uri };
	contextValue?: string;
	command?: vscode.Command;
	tooltip?: string | vscode.MarkdownString;
	description?: string;
}

/**
 * Base class for all tree items in the AWS Workbench
 */
export class BaseTreeItem extends vscode.TreeItem {
	public readonly resourceType: ResourceType;
	public readonly nodeType: NodeType;
	public readonly resourceArn?: string;
	public readonly resourceName?: string;
	public children: BaseTreeItem[] = [];
	
	// Visibility and favorite state
	public isFavorite: boolean = false;
	public isHidden: boolean = false;
	public profileName?: string; // If set, only show in this profile
	
	// Parent reference
	public parent?: BaseTreeItem;

	constructor(config: BaseTreeItemConfig) {
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
	public getId(): string {
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
	public addChild(child: BaseTreeItem): void {
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
	public removeChild(child: BaseTreeItem): boolean {
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
	public findChild(predicate: (child: BaseTreeItem) => boolean): BaseTreeItem | undefined {
		return this.children.find(predicate);
	}

	/**
	 * Find all children matching predicate (recursive)
	 */
	public findChildrenRecursive(predicate: (child: BaseTreeItem) => boolean): BaseTreeItem[] {
		const results: BaseTreeItem[] = [];
		
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
	public getPath(): BaseTreeItem[] {
		const path: BaseTreeItem[] = [this];
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
	public getDepth(): number {
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
	public updateContextValue(): void {
		const parts: string[] = [];
		
		// Add node type
		parts.push(`#${this.nodeType}#`);
		
		// Add resource type
		parts.push(`#${this.resourceType}#`);
		
		// Add state flags
		if (this.isFavorite) {
			parts.push('#Fav#');
		} else {
			parts.push('#!Fav#');
		}
		
		if (this.isHidden) {
			parts.push('#Hidden#');
		} else {
			parts.push('#!Hidden#');
		}
		
		if (this.profileName) {
			parts.push('#Profile#');
		} else {
			parts.push('#NoProfile#');
		}
		
		this.contextValue = parts.join('');
	}

	/**
	 * Check if this item should be visible based on filters
	 */
	public isVisible(showOnlyFavorites: boolean, showHidden: boolean, currentProfile?: string): boolean {
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
	public toggleFavorite(): void {
		this.isFavorite = !this.isFavorite;
		this.updateContextValue();
	}

	/**
	 * Toggle hidden state
	 */
	public toggleHidden(): void {
		this.isHidden = !this.isHidden;
		this.updateContextValue();
	}

	/**
	 * Set profile restriction
	 */
	public setProfile(profileName?: string): void {
		this.profileName = profileName;
		this.updateContextValue();
	}

	/**
	 * Get a user-friendly description of this item
	 */
	public getDescription(): string {
		const desc = typeof this.description === 'string' ? this.description : undefined;
		const label = typeof this.label === 'string' ? this.label : (this.label?.label || '');
		return desc || label || '';
	}

	/**
	 * Clone this tree item (shallow copy, without children)
	 */
	public clone(): BaseTreeItem {
		const label = typeof this.label === 'string' ? this.label : (this.label?.label || '');
		const desc = typeof this.description === 'string' ? this.description : undefined;
		
		const cloned = new BaseTreeItem({
			label: label,
			resourceType: this.resourceType,
			nodeType: this.nodeType,
			resourceArn: this.resourceArn,
			resourceName: this.resourceName,
			collapsibleState: this.collapsibleState,
			iconPath: this.iconPath as (vscode.Uri | vscode.ThemeIcon | { light: vscode.Uri; dark: vscode.Uri } | undefined),
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
