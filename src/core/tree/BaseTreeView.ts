/**
 * Base Tree View for AWS Workbench
 * 
 * Provides common tree view functionality for all AWS services
 */

import * as vscode from 'vscode';
import { BaseTreeItem, NodeType, ResourceType } from './BaseTreeItem';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';
import * as ui from '../../common/UI';

export interface BaseTreeViewConfig {
	viewId: string;
	serviceName: string;
	context: vscode.ExtensionContext;
}

/**
 * Abstract base class for all service tree views
 */
export abstract class BaseTreeView {
	protected readonly viewId: string;
	protected readonly serviceName: string;
	protected readonly context: vscode.ExtensionContext;
	protected readonly dataProvider: BaseTreeDataProvider;
	protected readonly view: vscode.TreeView<BaseTreeItem>;

	constructor(config: BaseTreeViewConfig, dataProvider: BaseTreeDataProvider) {
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
	public refresh(item?: BaseTreeItem): void {
		ui.logToOutput(`Refreshing ${this.serviceName} tree view`);
		this.dataProvider.refresh(item);
	}

	/**
	 * Filter the tree view
	 */
	public async filter(): Promise<void> {
		const filterText = await vscode.window.showInputBox({
			prompt: `Filter ${this.serviceName} resources`,
			placeHolder: 'Enter filter text...',
			value: this.dataProvider['filterText'] || '',
		});

		if (filterText !== undefined) {
			if (filterText === '') {
				this.dataProvider.clearFilter();
				ui.showInfoMessage('Filter cleared');
			} else {
				this.dataProvider.setFilter(filterText);
				ui.showInfoMessage(`Filter applied: ${filterText}`);
			}
		}
	}

	/**
	 * Show only favorite items
	 */
	public showOnlyFavorite(): void {
		this.dataProvider.toggleShowOnlyFavorites();
		const showingFavorites = this.dataProvider['showOnlyFavorites'];
		ui.showInfoMessage(
			showingFavorites 
				? 'Showing only favorite items' 
				: 'Showing all items'
		);
	}

	/**
	 * Show or hide hidden nodes
	 */
	public showHiddenNodes(): void {
		this.dataProvider.toggleShowHidden();
		const showingHidden = this.dataProvider['showHidden'];
		ui.showInfoMessage(
			showingHidden 
				? 'Showing hidden nodes' 
				: 'Hiding hidden nodes'
		);
	}

	// ==================== Favorite Management ====================

	/**
	 * Add item to favorites
	 */
	public addToFavorites(node: BaseTreeItem): void {
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
	public removeFromFavorites(node: BaseTreeItem): void {
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
	public hideNode(node: BaseTreeItem): void {
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
	public unhideNode(node: BaseTreeItem): void {
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
	public showOnlyInThisProfile(node: BaseTreeItem): void {
		const currentProfile = this.dataProvider['currentProfile'];
		if (currentProfile) {
			node.setProfile(currentProfile);
			this.refresh(node);
			ui.showInfoMessage(`${node.label} will only show in profile: ${currentProfile}`);
			this.saveState();
		} else {
			ui.showWarningMessage('No profile selected');
		}
	}

	/**
	 * Show node in any profile
	 */
	public showInAnyProfile(node: BaseTreeItem): void {
		node.setProfile(undefined);
		this.refresh(node);
		ui.showInfoMessage(`${node.label} will show in all profiles`);
		this.saveState();
	}

	// ==================== Folder Management ====================

	/**
	 * Add a folder to organize resources
	 */
	public async addFolder(parentNode?: BaseTreeItem): Promise<void> {
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
			const folder = new BaseTreeItem({
				label: folderName,
				resourceType: ResourceType.FOLDER,
				nodeType: NodeType.FOLDER,
				collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
				iconPath: new vscode.ThemeIcon('folder'),
			});

			if (parentNode) {
				parentNode.addChild(folder);
				this.refresh(parentNode);
			} else {
				this.dataProvider.addRootItem(folder);
			}

			ui.showInfoMessage(`Folder created: ${folderName}`);
			this.saveState();
		}
	}

	/**
	 * Rename a folder
	 */
	public async renameFolder(node: BaseTreeItem): Promise<void> {
		if (node.resourceType !== ResourceType.FOLDER) {
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
	public async removeFolder(node: BaseTreeItem): Promise<void> {
		if (node.resourceType !== ResourceType.FOLDER) {
			ui.showWarningMessage('This is not a folder');
			return;
		}

		const hasChildren = node.children.length > 0;
		const confirmMessage = hasChildren
			? `Delete folder "${node.label}" and remove all ${node.children.length} items inside?`
			: `Delete folder "${node.label}"?`;

		const confirm = await vscode.window.showWarningMessage(
			confirmMessage,
			{ modal: true },
			'Delete'
		);

		if (confirm === 'Delete') {
			if (node.parent) {
				node.parent.removeChild(node);
				this.refresh(node.parent);
			} else {
				this.dataProvider.removeRootItem(node);
			}
			ui.showInfoMessage(`Folder deleted: ${node.label}`);
			this.saveState();
		}
	}

	// ==================== Resource Management ====================

	/**
	 * Add a resource (to be implemented by subclasses)
	 */
	public abstract addResource(parentNode?: BaseTreeItem): Promise<void>;

	/**
	 * Remove a resource (to be implemented by subclasses)
	 */
	public abstract removeResource(node: BaseTreeItem): Promise<void>;

	// ==================== State Management ====================

	/**
	 * Save tree state to workspace/global state
	 */
	protected abstract saveState(): Promise<void>;

	/**
	 * Load tree state from workspace/global state
	 */
	protected abstract loadState(): Promise<void>;

	/**
	 * Export configuration to YAML
	 */
	public abstract exportToYaml(): Promise<void>;

	// ==================== Utility Methods ====================

	/**
	 * Reveal and select a node in the tree
	 */
	public async revealNode(node: BaseTreeItem): Promise<void> {
		try {
			await this.view.reveal(node, {
				select: true,
				focus: true,
				expand: true,
			});
		} catch (error) {
			ui.logToOutput(`Failed to reveal node: ${error}`, error as Error);
		}
	}

	/**
	 * Get the currently selected node
	 */
	public getSelectedNode(): BaseTreeItem | undefined {
		return this.view.selection.length > 0 ? this.view.selection[0] : undefined;
	}

	/**
	 * Get all selected nodes
	 */
	public getSelectedNodes(): BaseTreeItem[] {
		return [...this.view.selection];
	}

	/**
	 * Find a node by predicate
	 */
	public findNode(predicate: (node: BaseTreeItem) => boolean): BaseTreeItem | undefined {
		return this.dataProvider.findItem(predicate);
	}

	/**
	 * Get all nodes
	 */
	public getAllNodes(): BaseTreeItem[] {
		return this.dataProvider.getAllItems();
	}

	/**
	 * Dispose of the tree view
	 */
	public dispose(): void {
		this.view.dispose();
	}
}
