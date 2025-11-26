"use strict";
/**
 * Base Tree Data Provider for AWS Workbench
 *
 * Provides common data provider functionality for all service tree views
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTreeDataProvider = void 0;
const vscode = require("vscode");
class BaseTreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    rootItems = [];
    filterText = '';
    showOnlyFavorites = false;
    showHidden = false;
    currentProfile;
    /**
     * Refresh the tree view
     */
    refresh(item) {
        this._onDidChangeTreeData.fire(item);
    }
    /**
     * Get tree item representation
     */
    getTreeItem(element) {
        return element;
    }
    /**
     * Get children of a tree item
     */
    async getChildren(element) {
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
    getParent(element) {
        return element.parent;
    }
    /**
     * Filter items based on current filter settings
     */
    getFilteredItems(items) {
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
    matchesFilter(item, filterText) {
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
    setFilter(filterText) {
        this.filterText = filterText;
        this.refresh();
    }
    /**
     * Clear filter
     */
    clearFilter() {
        this.filterText = '';
        this.refresh();
    }
    /**
     * Toggle show only favorites
     */
    toggleShowOnlyFavorites() {
        this.showOnlyFavorites = !this.showOnlyFavorites;
        this.refresh();
    }
    /**
     * Toggle show hidden items
     */
    toggleShowHidden() {
        this.showHidden = !this.showHidden;
        this.refresh();
    }
    /**
     * Set current profile
     */
    setCurrentProfile(profileName) {
        this.currentProfile = profileName;
        this.refresh();
    }
    /**
     * Add a root item
     */
    addRootItem(item) {
        this.rootItems.push(item);
        this.refresh();
    }
    /**
     * Remove a root item
     */
    removeRootItem(item) {
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
    findItem(predicate) {
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
    findItemRecursive(item, predicate) {
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
    getAllItems() {
        const items = [];
        for (const rootItem of this.rootItems) {
            items.push(rootItem);
            items.push(...this.getAllItemsRecursive(rootItem));
        }
        return items;
    }
    /**
     * Get all items recursively from a subtree
     */
    getAllItemsRecursive(item) {
        const items = [];
        for (const child of item.children) {
            items.push(child);
            items.push(...this.getAllItemsRecursive(child));
        }
        return items;
    }
    /**
     * Clear all items
     */
    clearAllItems() {
        this.rootItems = [];
        this.refresh();
    }
    /**
     * Get root items (without filtering)
     */
    getRootItems() {
        return [...this.rootItems];
    }
}
exports.BaseTreeDataProvider = BaseTreeDataProvider;
//# sourceMappingURL=BaseTreeDataProvider.js.map