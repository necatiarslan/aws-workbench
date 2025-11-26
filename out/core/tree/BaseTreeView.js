"use strict";
/**
 * Base Tree View for AWS Workbench
 *
 * Provides common tree view functionality for all AWS services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTreeView = void 0;
const vscode = require("vscode");
const BaseTreeItem_1 = require("./BaseTreeItem");
const ui = require("../../common/UI");
/**
 * Abstract base class for all service tree views
 */
class BaseTreeView {
    viewId;
    serviceName;
    context;
    dataProvider;
    view;
    constructor(config, dataProvider) {
        this.viewId = config.viewId;
        this.serviceName = config.serviceName;
        this.context = config.context;
        this.dataProvider = dataProvider;
        // Create the tree view
        this.view = vscode.window.createTreeView(this.viewId, {
            treeDataProvider: this.dataProvider,
            showCollapseAll: true,
            canSelectMany: false,
        });
        // Register for disposal
        this.context.subscriptions.push(this.view);
        ui.logToOutput(`${this.serviceName} Tree View initialized`);
    }
    // ==================== Common Operations ====================
    /**
     * Refresh the tree view
     */
    refresh(item) {
        ui.logToOutput(`Refreshing ${this.serviceName} tree view`);
        this.dataProvider.refresh(item);
    }
    /**
     * Filter the tree view
     */
    async filter() {
        const filterText = await vscode.window.showInputBox({
            prompt: `Filter ${this.serviceName} resources`,
            placeHolder: 'Enter filter text...',
            value: this.dataProvider['filterText'] || '',
        });
        if (filterText !== undefined) {
            if (filterText === '') {
                this.dataProvider.clearFilter();
                ui.showInfoMessage('Filter cleared');
            }
            else {
                this.dataProvider.setFilter(filterText);
                ui.showInfoMessage(`Filter applied: ${filterText}`);
            }
        }
    }
    /**
     * Show only favorite items
     */
    showOnlyFavorite() {
        this.dataProvider.toggleShowOnlyFavorites();
        const showingFavorites = this.dataProvider['showOnlyFavorites'];
        ui.showInfoMessage(showingFavorites
            ? 'Showing only favorite items'
            : 'Showing all items');
    }
    /**
     * Show or hide hidden nodes
     */
    showHiddenNodes() {
        this.dataProvider.toggleShowHidden();
        const showingHidden = this.dataProvider['showHidden'];
        ui.showInfoMessage(showingHidden
            ? 'Showing hidden nodes'
            : 'Hiding hidden nodes');
    }
    // ==================== Favorite Management ====================
    /**
     * Add item to favorites
     */
    addToFavorites(node) {
        if (!node.isFavorite) {
            node.toggleFavorite();
            this.refresh(node);
            ui.showInfoMessage(`Added to favorites: ${node.label}`);
            this.saveState();
        }
    }
    /**
     * Remove item from favorites
     */
    removeFromFavorites(node) {
        if (node.isFavorite) {
            node.toggleFavorite();
            this.refresh(node);
            ui.showInfoMessage(`Removed from favorites: ${node.label}`);
            this.saveState();
        }
    }
    // ==================== Visibility Management ====================
    /**
     * Hide a node
     */
    hideNode(node) {
        if (!node.isHidden) {
            node.toggleHidden();
            this.refresh();
            ui.showInfoMessage(`Hidden: ${node.label}`);
            this.saveState();
        }
    }
    /**
     * Unhide a node
     */
    unhideNode(node) {
        if (node.isHidden) {
            node.toggleHidden();
            this.refresh();
            ui.showInfoMessage(`Unhidden: ${node.label}`);
            this.saveState();
        }
    }
    // ==================== Profile Management ====================
    /**
     * Show node only in current profile
     */
    showOnlyInThisProfile(node) {
        const currentProfile = this.dataProvider['currentProfile'];
        if (currentProfile) {
            node.setProfile(currentProfile);
            this.refresh(node);
            ui.showInfoMessage(`${node.label} will only show in profile: ${currentProfile}`);
            this.saveState();
        }
        else {
            ui.showWarningMessage('No profile selected');
        }
    }
    /**
     * Show node in any profile
     */
    showInAnyProfile(node) {
        node.setProfile(undefined);
        this.refresh(node);
        ui.showInfoMessage(`${node.label} will show in all profiles`);
        this.saveState();
    }
    // ==================== Folder Management ====================
    /**
     * Add a folder to organize resources
     */
    async addFolder(parentNode) {
        const folderName = await vscode.window.showInputBox({
            prompt: 'Enter folder name',
            placeHolder: 'My Folder',
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Folder name cannot be empty';
                }
                return null;
            },
        });
        if (folderName) {
            const folder = new BaseTreeItem_1.BaseTreeItem({
                label: folderName,
                resourceType: BaseTreeItem_1.ResourceType.FOLDER,
                nodeType: BaseTreeItem_1.NodeType.FOLDER,
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                iconPath: new vscode.ThemeIcon('folder'),
            });
            if (parentNode) {
                parentNode.addChild(folder);
                this.refresh(parentNode);
            }
            else {
                this.dataProvider.addRootItem(folder);
            }
            ui.showInfoMessage(`Folder created: ${folderName}`);
            this.saveState();
        }
    }
    /**
     * Rename a folder
     */
    async renameFolder(node) {
        if (node.resourceType !== BaseTreeItem_1.ResourceType.FOLDER) {
            ui.showWarningMessage('This is not a folder');
            return;
        }
        const currentLabel = typeof node.label === 'string' ? node.label : (node.label?.label || '');
        const newName = await vscode.window.showInputBox({
            prompt: 'Enter new folder name',
            placeHolder: currentLabel || 'Folder',
            value: currentLabel,
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Folder name cannot be empty';
                }
                return null;
            },
        });
        if (newName && newName !== currentLabel) {
            const oldName = currentLabel;
            node.label = newName;
            this.refresh(node.parent);
            ui.showInfoMessage(`Folder renamed from "${oldName}" to "${newName}"`);
            this.saveState();
        }
    }
    /**
     * Remove a folder
     */
    async removeFolder(node) {
        if (node.resourceType !== BaseTreeItem_1.ResourceType.FOLDER) {
            ui.showWarningMessage('This is not a folder');
            return;
        }
        const hasChildren = node.children.length > 0;
        const confirmMessage = hasChildren
            ? `Delete folder "${node.label}" and remove all ${node.children.length} items inside?`
            : `Delete folder "${node.label}"?`;
        const confirm = await vscode.window.showWarningMessage(confirmMessage, { modal: true }, 'Delete');
        if (confirm === 'Delete') {
            if (node.parent) {
                node.parent.removeChild(node);
                this.refresh(node.parent);
            }
            else {
                this.dataProvider.removeRootItem(node);
            }
            ui.showInfoMessage(`Folder deleted: ${node.label}`);
            this.saveState();
        }
    }
    // ==================== Utility Methods ====================
    /**
     * Reveal and select a node in the tree
     */
    async revealNode(node) {
        try {
            await this.view.reveal(node, {
                select: true,
                focus: true,
                expand: true,
            });
        }
        catch (error) {
            ui.logToOutput(`Failed to reveal node: ${error}`, error);
        }
    }
    /**
     * Get the currently selected node
     */
    getSelectedNode() {
        return this.view.selection.length > 0 ? this.view.selection[0] : undefined;
    }
    /**
     * Get all selected nodes
     */
    getSelectedNodes() {
        return [...this.view.selection];
    }
    /**
     * Find a node by predicate
     */
    findNode(predicate) {
        return this.dataProvider.findItem(predicate);
    }
    /**
     * Get all nodes
     */
    getAllNodes() {
        return this.dataProvider.getAllItems();
    }
    /**
     * Dispose of the tree view
     */
    dispose() {
        this.view.dispose();
    }
}
exports.BaseTreeView = BaseTreeView;
//# sourceMappingURL=BaseTreeView.js.map