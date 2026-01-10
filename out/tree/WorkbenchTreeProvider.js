"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkbenchTreeProvider = void 0;
const vscode = require("vscode");
const ServiceManager_1 = require("../services/ServiceManager");
const WorkbenchTreeItem_1 = require("./WorkbenchTreeItem");
const Session_1 = require("../common/Session");
const FolderManager_1 = require("../common/FolderManager");
class WorkbenchTreeProvider {
    context;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    folderFilter;
    resourceNameFilter;
    constructor(context) {
        this.context = context;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    setFolderFilter(folderId) {
        this.folderFilter = folderId;
        if (Session_1.Session.Current) {
            Session_1.Session.Current.folderFilter = folderId;
            Session_1.Session.Current.SaveState();
        }
        this.refresh();
    }
    setResourceNameFilter(pattern) {
        this.resourceNameFilter = pattern;
        if (Session_1.Session.Current) {
            Session_1.Session.Current.resourceNameFilter = pattern;
            Session_1.Session.Current.SaveState();
        }
        this.refresh();
    }
    clearFilters() {
        this.folderFilter = undefined;
        this.resourceNameFilter = undefined;
        if (Session_1.Session.Current) {
            Session_1.Session.Current.folderFilter = undefined;
            Session_1.Session.Current.resourceNameFilter = undefined;
            Session_1.Session.Current.SaveState();
        }
        this.refresh();
    }
    getTreeItem(element) {
        const service = ServiceManager_1.ServiceManager.Instance.getService(element.serviceId);
        if (service && element.itemData) {
            try {
                return service.getTreeItem(element);
            }
            catch (error) {
                console.error(`Error getting tree item for ${element.label} (Service: ${element.serviceId}):`, error);
                const errorItem = new vscode.TreeItem(element.label || 'Error', vscode.TreeItemCollapsibleState.None);
                errorItem.description = 'Error loading item';
                errorItem.tooltip = error instanceof Error ? error.message : String(error);
                return errorItem;
            }
        }
        return element;
    }
    async getChildren(element) {
        if (!element) {
            // Root level: get folders + root-level resources
            let allItems = [];
            // Add root folders
            const session = Session_1.Session.Current;
            if (session) {
                const rootFolders = session.getFolderHierarchy(null);
                for (const folder of rootFolders) {
                    const folderItem = new WorkbenchTreeItem_1.WorkbenchTreeItem(folder.name, vscode.TreeItemCollapsibleState.Collapsed, 'folders', 'folder', folder);
                    folderItem.isFolder = true;
                    folderItem.iconPath = new vscode.ThemeIcon('folder');
                    const isFavorite = session.isFolderFavorite(folder.id);
                    const isHidden = session.isFolderHidden(folder.id);
                    folderItem.contextValue = `folder${isFavorite ? '#Fav#' : '#!Fav#'}${isHidden ? '#Hidden#' : '#!Hidden#'}`;
                    allItems.push(folderItem);
                }
            }
            // Add root-level resources from services
            const services = ServiceManager_1.ServiceManager.Instance.getAllServices();
            for (const service of services) {
                try {
                    const roots = await service.getRootNodes();
                    allItems.push(...roots);
                }
                catch (error) {
                    console.error(`Error loading root nodes for service ${service.serviceId}:`, error);
                    allItems.push(new WorkbenchTreeItem_1.WorkbenchTreeItem(`${service.serviceId.toUpperCase()} (Error)`, vscode.TreeItemCollapsibleState.None, service.serviceId, 'error', { error }));
                }
            }
            // Apply filters
            allItems = this.applyFilters(allItems);
            return allItems;
        }
        // If element is a folder, return its children
        if (element.isFolder && element.itemData) {
            const folder = element.itemData;
            const session = Session_1.Session.Current;
            let children = [];
            if (session) {
                // Add subfolders
                const subfolders = session.getFolderHierarchy(folder.id);
                for (const subfolder of subfolders) {
                    const subfolderItem = new WorkbenchTreeItem_1.WorkbenchTreeItem(subfolder.name, vscode.TreeItemCollapsibleState.Collapsed, 'folders', 'folder', subfolder);
                    subfolderItem.isFolder = true;
                    subfolderItem.parentFolderId = folder.id;
                    subfolderItem.iconPath = new vscode.ThemeIcon('folder');
                    const isFavorite = session.isFolderFavorite(subfolder.id);
                    const isHidden = session.isFolderHidden(subfolder.id);
                    subfolderItem.contextValue = `folder${isFavorite ? '#Fav#' : '#!Fav#'}${isHidden ? '#Hidden#' : '#!Hidden#'}`;
                    children.push(subfolderItem);
                }
                // Add custom resources in this folder
                const services = ServiceManager_1.ServiceManager.Instance.getAllServices();
                for (const service of services) {
                    const customResources = service.getCustomResourcesByFolder?.(folder.id) || [];
                    for (const resource of customResources) {
                        const item = new WorkbenchTreeItem_1.WorkbenchTreeItem(FolderManager_1.FolderManager.getDisplayName(resource), vscode.TreeItemCollapsibleState.Collapsed, service.serviceId, 'customResource', resource.resourceData);
                        item.isCustom = true;
                        item.parentFolderId = folder.id;
                        item.compositeKey = resource.compositeKey;
                        item.displayName = resource.displayName;
                        item.awsName = resource.awsName;
                        children.push(item);
                    }
                }
            }
            // Apply filters
            children = this.applyFilters(children);
            return children;
        }
        // Otherwise, delegate to service
        const service = ServiceManager_1.ServiceManager.Instance.getService(element.serviceId);
        if (service) {
            try {
                const children = await service.getChildren(element);
                return this.applyFilters(children);
            }
            catch (error) {
                console.error(`Error loading children for ${element.label} (Service: ${element.serviceId}):`, error);
                return [new WorkbenchTreeItem_1.WorkbenchTreeItem('Error loading children', vscode.TreeItemCollapsibleState.None, element.serviceId, 'error', { error })];
            }
        }
        return [];
    }
    applyFilters(items) {
        let filtered = items;
        // Filter by hidden status (if not showing hidden)
        const sessionCurrent = Session_1.Session.Current;
        if (sessionCurrent && !sessionCurrent.isShowHiddenNodes) {
            filtered = filtered.filter(item => {
                if (item.isFolder && item.itemData) {
                    return !sessionCurrent.isFolderHidden(item.itemData.id);
                }
                // For resources, check service hidden status
                if (item.serviceId) {
                    const service = ServiceManager_1.ServiceManager.Instance.getService(item.serviceId);
                    return !service || !service.isHidden?.(item);
                }
                return true;
            });
        }
        // Filter by favorites (if enabled)
        const session = Session_1.Session.Current;
        if (session && session.isShowOnlyFavorites) {
            filtered = filtered.filter(item => {
                if (item.isFolder && item.itemData) {
                    return session.isFolderFavorite(item.itemData.id);
                }
                if (item.isCustom && item.serviceId) {
                    const service = ServiceManager_1.ServiceManager.Instance.getService(item.serviceId);
                    return service && service.isFav?.(item);
                }
                // For AWS resources, check service favorite status
                if (item.serviceId) {
                    const service = ServiceManager_1.ServiceManager.Instance.getService(item.serviceId);
                    return service && service.isFav?.(item);
                }
                return false;
            });
        }
        // Filter by folder (includes all descendant folders and their resources)
        if (this.folderFilter) {
            const session = Session_1.Session.Current;
            if (session) {
                // Get all descendant folder IDs
                const descendantFolders = session.getAllDescendantFolders(this.folderFilter);
                const allTargetFolders = [this.folderFilter, ...descendantFolders];
                filtered = filtered.filter(item => {
                    // Show the filtered folder itself
                    if (item.isFolder && item.itemData && item.itemData.id === this.folderFilter) {
                        return true;
                    }
                    // Show direct subfolders of filtered folder
                    if (item.isFolder && item.itemData && item.itemData.parentFolderId === this.folderFilter) {
                        return true;
                    }
                    // Show resources in the filtered folder or any of its descendants
                    return item.parentFolderId && allTargetFolders.includes(item.parentFolderId);
                });
            }
        }
        // Filter by resource name (searches all folders recursively)
        if (this.resourceNameFilter) {
            // When filtering by name, we want to show matching items AND their containing folders
            const matchingItems = new Set();
            const parentFolderIds = new Set();
            try {
                const regex = new RegExp(this.resourceNameFilter, 'i');
                filtered.forEach(item => {
                    const label = typeof item.label === 'string' ? item.label : '';
                    const matches = regex.test(label) || (item.displayName && regex.test(item.displayName));
                    if (matches) {
                        matchingItems.add(item);
                        // Track parent folder IDs for matching resources
                        if (item.parentFolderId) {
                            parentFolderIds.add(item.parentFolderId);
                        }
                    }
                    else if (item.isFolder && item.itemData) {
                        // Always show folders that contain matches (will be determined later)
                        const folderId = item.itemData.id;
                        if (parentFolderIds.has(folderId)) {
                            matchingItems.add(item);
                        }
                    }
                });
            }
            catch (e) {
                // If regex is invalid, treat as plain text match
                const lowerFilter = this.resourceNameFilter.toLowerCase();
                filtered.forEach(item => {
                    const label = (typeof item.label === 'string' ? item.label : '').toLowerCase();
                    const displayName = (item.displayName || '').toLowerCase();
                    const matches = label.includes(lowerFilter) || displayName.includes(lowerFilter);
                    if (matches) {
                        matchingItems.add(item);
                        if (item.parentFolderId) {
                            parentFolderIds.add(item.parentFolderId);
                        }
                    }
                });
            }
            // Include folders that are ancestors of matching items
            filtered.forEach(item => {
                if (item.isFolder && item.itemData) {
                    const folderId = item.itemData.id;
                    if (parentFolderIds.has(folderId)) {
                        matchingItems.add(item);
                    }
                }
            });
            filtered = Array.from(matchingItems);
        }
        return filtered;
    }
}
exports.WorkbenchTreeProvider = WorkbenchTreeProvider;
//# sourceMappingURL=WorkbenchTreeProvider.js.map