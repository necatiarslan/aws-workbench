"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemService = void 0;
const vscode = require("vscode");
const uuid_1 = require("uuid");
const ServiceManager_1 = require("../ServiceManager");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
class FileSystemService {
    context;
    static Instance;
    serviceId = 'filesystem';
    treeProvider;
    rootFolders = [];
    constructor(context) {
        this.context = context;
        FileSystemService.Instance = this;
        this.loadState();
    }
    registerCommands(context, treeProvider, treeView) {
        this.treeProvider = treeProvider;
        context.subscriptions.push(vscode.commands.registerCommand('aws-workbench.filesystem.AddFolder', (node) => this.promptAddFolder(node)), vscode.commands.registerCommand('aws-workbench.filesystem.RemoveFolder', (node) => this.confirmRemoveFolder(node)), vscode.commands.registerCommand('aws-workbench.filesystem.AddResourceToFolder', (node) => this.promptAddResourceToFolder(node)), vscode.commands.registerCommand('aws-workbench.filesystem.RemoveResource', (node) => this.removeResource(node)));
    }
    async getRootNodes() {
        return this.rootFolders.map(folder => this.createFolderTreeItem(folder));
    }
    async getChildren(element) {
        if (!element) {
            return this.getRootNodes();
        }
        const nodeData = element.itemData;
        if (nodeData.type === 'folder') {
            const folder = nodeData;
            const children = [];
            for (const child of folder.children) {
                if (child.type === 'folder') {
                    children.push(this.createFolderTreeItem(child));
                }
                else {
                    const resourceItem = await this.createResourceTreeItem(child);
                    if (resourceItem) {
                        children.push(resourceItem);
                    }
                }
            }
            return children;
        }
        return [];
    }
    getTreeItem(element) {
        // This method is primarily called for the Folder items themselves,
        // as the actual service resources are proxied.
        const nodeData = element.itemData;
        if (nodeData && nodeData.type === 'folder') {
            const folder = nodeData;
            const item = new vscode.TreeItem(folder.label, vscode.TreeItemCollapsibleState.Expanded);
            item.contextValue = 'FileSystemFolder';
            item.iconPath = new vscode.ThemeIcon('folder');
            item.id = folder.id; // Helpful for VSCode to track selection
            return item;
        }
        return element;
    }
    async addResource() {
        return this.promptAddFolder();
    }
    // --- Helpers for Tree Items ---
    createFolderTreeItem(folder) {
        return new WorkbenchTreeItem_1.WorkbenchTreeItem(folder.label, vscode.TreeItemCollapsibleState.Collapsed, this.serviceId, 'FileSystemFolder', folder);
    }
    async createResourceTreeItem(resource) {
        const service = ServiceManager_1.ServiceManager.Instance.getService(resource.serviceId);
        if (!service) {
            return new WorkbenchTreeItem_1.WorkbenchTreeItem(`${resource.label} (Unknown Service)`, vscode.TreeItemCollapsibleState.None, this.serviceId, 'error', resource);
        }
        try {
            // Create a temporary item to pass to the service so it can reconstruct the full TreeItem
            const tempItem = new WorkbenchTreeItem_1.WorkbenchTreeItem(resource.label, vscode.TreeItemCollapsibleState.Collapsed, resource.serviceId, undefined, resource.data);
            // Ask the service to resolving the full details (icon, contextValue, collapsible state)
            const resolvedItem = await service.getTreeItem(tempItem);
            // Wrap the resolved context value so we can add 'FileSystemResource' features
            // This allows us to have specific context menu actions for filesystem resources (like Remove)
            const wrappedContextValue = (resolvedItem.contextValue || '') + '#FileSystemResource#';
            return new WorkbenchTreeItem_1.WorkbenchTreeItem(resolvedItem.label || resource.label, resolvedItem.collapsibleState || vscode.TreeItemCollapsibleState.None, resource.serviceId, // Keep the original service ID so interactions work
            wrappedContextValue, resource.data // Keep the original data so the service can function
            );
        }
        catch (error) {
            console.error(`Failed to restore resource ${resource.label}:`, error);
            return new WorkbenchTreeItem_1.WorkbenchTreeItem(`${resource.label} (Error)`, vscode.TreeItemCollapsibleState.None, this.serviceId, 'error', resource);
        }
    }
    // --- Actions ---
    async promptAddFolder(parentNode) {
        const name = await vscode.window.showInputBox({
            placeHolder: 'Folder Name',
            validateInput: (value) => value ? null : 'Folder name cannot be empty'
        });
        if (!name)
            return;
        const newFolder = {
            id: (0, uuid_1.v4)(),
            label: name,
            type: 'folder',
            children: []
        };
        if (parentNode && parentNode.serviceId === this.serviceId) {
            const parentFolder = parentNode.itemData;
            if (parentFolder.type !== 'folder')
                return; // Should not happen
            newFolder.parentId = parentFolder.id;
            parentFolder.children.push(newFolder);
        }
        else {
            this.rootFolders.push(newFolder);
        }
        await this.saveState();
        this.treeProvider.refresh();
        return this.createFolderTreeItem(newFolder);
    }
    async confirmRemoveFolder(node) {
        const folder = node.itemData;
        const answer = await vscode.window.showWarningMessage(`Are you sure you want to delete folder '${folder.label}'?`, { modal: true }, "Yes");
        if (answer === "Yes") {
            this.removeItemRecursive(this.rootFolders, folder.id);
            await this.saveState();
            this.treeProvider.refresh();
        }
    }
    async promptAddResourceToFolder(node) {
        const folder = node.itemData;
        if (folder.type !== 'folder')
            return;
        // 1. Pick Service (exclude meta-services)
        const services = ServiceManager_1.ServiceManager.Instance.getAllServices()
            .filter(s => s.serviceId !== 'filesystem' && s.serviceId !== 'access');
        const servicePick = await vscode.window.showQuickPick(services.map(s => ({
            label: s.serviceId.toUpperCase(),
            service: s
        })), { placeHolder: 'Select Service Service' });
        if (!servicePick)
            return;
        try {
            // 2. Pick Resource from Service's Root Nodes
            // NOTE: This assumes services provide flat lists or we only support adding root-level items.
            // A more advanced version would allow browsing the service tree to pick an item.
            const rootNodes = await servicePick.service.getRootNodes();
            const resourcePick = await vscode.window.showQuickPick(rootNodes.map(n => ({
                label: n.label,
                item: n
            })), { placeHolder: `Select ${servicePick.label} Resource to Add` });
            if (resourcePick) {
                const newResource = {
                    id: (0, uuid_1.v4)(),
                    label: resourcePick.item.label,
                    type: 'resource',
                    serviceId: servicePick.service.serviceId,
                    data: resourcePick.item.itemData
                };
                folder.children.push(newResource);
                await this.saveState();
                this.treeProvider.refresh();
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to list resources: ${error}`);
        }
    }
    async removeResource(node) {
        // Since the node passed here is the 'proxied' item with the service's ID, 
        // we can't directly identify it in our FileSystem structure easily without its wrapper logic.
        // HOWEVER: The 'getTreeItem' logic above returns an item with 'itemData' as the ORIGINAL data.
        // It does NOT lose the data.
        // Wait, 'removeResource' command is triggered on the tree item. 
        // In 'getChildren', we created a `WorkbenchTreeItem` with `resource.data`.
        // We lack the `FileSystemResource` wrapper ID in that item.
        // This makes it hard to delete the exact instance if there are duplicates.
        // BUT, we can just search for the first match of ServiceID + JSON(Data) in the folder structure.
        // This is a limitation of the current proxy design but acceptable for now.
        // Strategy: We must search the entire tree for a resource that matches this node's data.
        // Since we don't know the parent folder from the 'node' object (TreeItem doesn't enforce parent link),
        // we have to search from roots.
        if (this.removeResourceByDataRecursive(this.rootFolders, node.serviceId, node.itemData)) {
            await this.saveState();
            this.treeProvider.refresh();
        }
        else {
            vscode.window.showWarningMessage("Could not find the resource in the file system folders to delete.");
        }
    }
    // --- Recursion Helpers ---
    removeItemRecursive(list, id) {
        const index = list.findIndex(item => item.id === id);
        if (index !== -1) {
            list.splice(index, 1);
            return true;
        }
        for (const item of list) {
            if (item.type === 'folder') {
                if (this.removeItemRecursive(item.children, id)) {
                    return true;
                }
            }
        }
        return false;
    }
    removeResourceByDataRecursive(list, serviceId, data) {
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            if (item.type === 'resource') {
                const resource = item;
                // Deep comparison of data is expensive/tricky. 
                // We assume if serviceId matches and JSON string of data matches, it's the same.
                if (resource.serviceId === serviceId && JSON.stringify(resource.data) === JSON.stringify(data)) {
                    list.splice(i, 1);
                    return true;
                }
            }
            else if (item.type === 'folder') {
                if (this.removeResourceByDataRecursive(item.children, serviceId, data)) {
                    return true;
                }
            }
        }
        return false;
    }
    // --- State Management ---
    loadState() {
        const data = this.context.globalState.get('filesystem.folders', []);
        // Validate / Migrate data if necessary? 
        // For now, assume it's correct or empty.
        this.rootFolders = data;
    }
    async saveState() {
        await this.context.globalState.update('filesystem.folders', this.rootFolders);
    }
}
exports.FileSystemService = FileSystemService;
//# sourceMappingURL=FileSystemService.js.map