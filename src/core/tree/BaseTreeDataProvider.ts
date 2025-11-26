/**
 * Base Tree Data Provider for AWS Workbench
 * 
 * Provides common data provider functionality for all service tree views
 */

import * as vscode from 'vscode';
import { BaseTreeItem } from './BaseTreeItem';

export abstract class BaseTreeDataProvider implements vscode.TreeDataProvider<BaseTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<BaseTreeItem | undefined | null | void> = 
		new vscode.EventEmitter<BaseTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<BaseTreeItem | undefined | null | void> = 
		this._onDidChangeTreeData.event;

	protected rootItems: BaseTreeItem[] = [];
	protected filterText: string = '';
	protected showOnlyFavorites: boolean = false;
	protected showHidden: boolean = false;
	protected currentProfile?: string;

	/**
	 * Refresh the tree view
	 */
	public refresh(item?: BaseTreeItem): void {
		this._onDidChangeTreeData.fire(item);
	}

	/**
	 * Get tree item representation
	 */
	public getTreeItem(element: BaseTreeItem): vscode.TreeItem {
		return element;
	}

	/**
	 * Get children of a tree item
	 */
	public async getChildren(element?: BaseTreeItem): Promise<BaseTreeItem[]> {
		if (!element) {
			// Root level - return filtered root items
			return this.getFilteredItems(this.rootItems);
		}
		
		// Return filtered children
		return this.getFilteredItems(element.children);
	}

	/**
	 * Get parent of a tree item
	 */
	public getParent(element: BaseTreeItem): BaseTreeItem | undefined {
		return element.parent;
	}

	/**
	 * Filter items based on current filter settings
	 */
	protected getFilteredItems(items: BaseTreeItem[]): BaseTreeItem[] {
		return items.filter(item => {
			// Check visibility based on filters
			if (!item.isVisible(this.showOnlyFavorites, this.showHidden, this.currentProfile)) {
				return false;
			}
			
			// Check text filter
			if (this.filterText && !this.matchesFilter(item, this.filterText)) {
				return false;
			}
			
			return true;
		});
	}

	/**
	 * Check if an item matches the filter text
	 */
	protected matchesFilter(item: BaseTreeItem, filterText: string): boolean {
		const searchText = filterText.toLowerCase();
		const label = item.label?.toString().toLowerCase() || '';
		const description = item.getDescription().toLowerCase();
		const resourceName = item.resourceName?.toLowerCase() || '';
		
		return label.includes(searchText) || 
		       description.includes(searchText) || 
		       resourceName.includes(searchText);
	}

	/**
	 * Set filter text
	 */
	public setFilter(filterText: string): void {
		this.filterText = filterText;
		this.refresh();
	}

	/**
	 * Clear filter
	 */
	public clearFilter(): void {
		this.filterText = '';
		this.refresh();
	}

	/**
	 * Toggle show only favorites
	 */
	public toggleShowOnlyFavorites(): void {
		this.showOnlyFavorites = !this.showOnlyFavorites;
		this.refresh();
	}

	/**
	 * Toggle show hidden items
	 */
	public toggleShowHidden(): void {
		this.showHidden = !this.showHidden;
		this.refresh();
	}

	/**
	 * Set current profile
	 */
	public setCurrentProfile(profileName?: string): void {
		this.currentProfile = profileName;
		this.refresh();
	}

	/**
	 * Add a root item
	 */
	public addRootItem(item: BaseTreeItem): void {
		this.rootItems.push(item);
		this.refresh();
	}

	/**
	 * Remove a root item
	 */
	public removeRootItem(item: BaseTreeItem): boolean {
		const index = this.rootItems.indexOf(item);
		if (index > -1) {
			this.rootItems.splice(index, 1);
			this.refresh();
			return true;
		}
		return false;
	}

	/**
	 * Find an item by predicate (searches all items recursively)
	 */
	public findItem(predicate: (item: BaseTreeItem) => boolean): BaseTreeItem | undefined {
		for (const rootItem of this.rootItems) {
			if (predicate(rootItem)) {
				return rootItem;
			}
			
			const found = this.findItemRecursive(rootItem, predicate);
			if (found) {
				return found;
			}
		}
		
		return undefined;
	}

	/**
	 * Find an item recursively within a subtree
	 */
	protected findItemRecursive(
		item: BaseTreeItem, 
		predicate: (item: BaseTreeItem) => boolean
	): BaseTreeItem | undefined {
		for (const child of item.children) {
			if (predicate(child)) {
				return child;
			}
			
			const found = this.findItemRecursive(child, predicate);
			if (found) {
				return found;
			}
		}
		
		return undefined;
	}

	/**
	 * Get all items (recursively)
	 */
	public getAllItems(): BaseTreeItem[] {
		const items: BaseTreeItem[] = [];
		
		for (const rootItem of this.rootItems) {
			items.push(rootItem);
			items.push(...this.getAllItemsRecursive(rootItem));
		}
		
		return items;
	}

	/**
	 * Get all items recursively from a subtree
	 */
	protected getAllItemsRecursive(item: BaseTreeItem): BaseTreeItem[] {
		const items: BaseTreeItem[] = [];
		
		for (const child of item.children) {
			items.push(child);
			items.push(...this.getAllItemsRecursive(child));
		}
		
		return items;
	}

	/**
	 * Clear all items
	 */
	public clearAllItems(): void {
		this.rootItems = [];
		this.refresh();
	}

	/**
	 * Get root items (without filtering)
	 */
	public getRootItems(): BaseTreeItem[] {
		return [...this.rootItems];
	}
}
