"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemService = void 0;
const vscode = require("vscode");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const ServiceManager_1 = require("../ServiceManager");
const uuid_1 = require("uuid");
class FileSystemService {
    static Instance;
    serviceId = 'filesystem'; // Should match package.json commands if we prefix them
    context;
    treeProvider;
    folders = [];
    constructor(context) {
        FileSystemService.Instance = this;
        this.context = context;
        this.loadState();
    }
    registerCommands(context, treeProvider, treeView) {
        this.treeProvider = treeProvider;
        context.subscriptions.push(vscode.commands.registerCommand('aws-workbench.filesystem.AddFolder', (node) => {
            this.addFolder(node);
        }), vscode.commands.registerCommand('aws-workbench.filesystem.RemoveFolder', (node) => {
            this.removeFolder(node);
        }), vscode.commands.registerCommand('aws-workbench.filesystem.AddResourceToFolder', (node) => {
            this.addResourceToFolder(node);
        }), vscode.commands.registerCommand('aws-workbench.filesystem.RemoveResource', (node) => {
            this.removeResource(node);
        }));
    }
    async getRootNodes() {
        // Return top-level folders
        return this.folders.map(f => this.mapFolderToTreeItem(f));
    }
    async getChildren(element) {
        if (!element) {
            return this.getRootNodes();
        }
        const folder = element.itemData;
        if (folder && folder.children) {
            const children = [];
            for (const child of folder.children) {
                if ('children' in child) {
                    // It's a folder
                    children.push(this.mapFolderToTreeItem(child));
                }
                else {
                    // It's a resource reference
                    const ref = child;
                    const service = ServiceManager_1.ServiceManager.Instance.getService(ref.serviceId);
                    if (service) {
                        try {
                            // We need to ask the service to convert this data back to a TreeItem
                            // But service.getTreeItem usually expects a WorkbenchTreeItem with service-specific data.
                            // We construct a WorkbenchTreeItem that mimics what the service expects.
                            // This might be tricky if services rely on references not stored in 'data'.
                            // Assuming 'data' contains enough info.
                            // HACK: We are creating a WorkbenchTreeItem with the service's ID.
                            // When this item is expanded, WorkbenchTreeProvider will call service.getChildren(item).
                            // So 'itemData' MUST be what the service expects.
                            // For visual consistency, we might want to let the service format the label/icon.
                            // But for now, use the saved label or a generic one.
                            // If the service has a method to 'restore' an item from data, that would be best.
                            // For now, let's assume 'ref.data' IS the itemData expected by the service.
                            const item = new WorkbenchTreeItem_1.WorkbenchTreeItem(ref.label, vscode.TreeItemCollapsibleState.Collapsed, // Assume it has children?
                            ref.serviceId, undefined, // Context value will be determined by service.getTreeItem? 
                            // No, contextValue is passed in constructor.
                            // We might need to ask service for the TreeItem to get valid contextValue and Icon.
                            ref.data);
                            // Let's resolve the full TreeItem from the service to get correct icon/contextValue
                            const resolvedItem = await service.getTreeItem(item);
                            // We recreate the WorkbenchTreeItem with the resolved properties
                            // BUT we need to preserve the parent relationship for our file system?
                            // Actually, 'removeResource' needs to know it's in a folder.
                            // We might need to wrap the context value.
                            const fileSystemContextValue = (resolvedItem.contextValue || '') + '#FileSystemResource#';
                            children.push(new WorkbenchTreeItem_1.WorkbenchTreeItem(resolvedItem.label || ref.label, resolvedItem.collapsibleState || vscode.TreeItemCollapsibleState.None, ref.serviceId, fileSystemContextValue, ref.data));
                        }
                        catch (e) {
                            console.error(`Failed to restore resource ${ref.label}:`, e);
                            children.push(new WorkbenchTreeItem_1.WorkbenchTreeItem(`${ref.label} (Error)`, vscode.TreeItemCollapsibleState.None, 'filesystem', 'error', undefined));
                        }
                    }
                }
            }
            return children;
        }
        return [];
    }
    getTreeItem(element) {
        if (element.serviceId === 'filesystem') {
            // It's a folder
            const folder = element.itemData;
            const item = new vscode.TreeItem(folder.name, vscode.TreeItemCollapsibleState.Expanded);
            item.contextValue = 'FileSystemFolder';
            item.iconPath = new vscode.ThemeIcon('folder');
            return item;
        }
        // If it's not filesystem, it shouldn't be here, or it's a resource.
        // But WorkbenchTreeProvider calls getTreeItem based on element.serviceId.
        // If element.serviceId is 's3', it calls S3Service.getTreeItem.
        // So this method is ONLY called for folders.
        return element;
    }
    async addResource() {
        return this.addFolder();
    }
    // --- Actions ---
    async addFolder(parentNode) {
        const name = await vscode.window.showInputBox({ placeHolder: 'Folder Name' });
        if (!name)
            return;
        const newFolder = {
            id: (0, uuid_1.v4)(),
            name: name,
            children: []
        };
        if (parentNode && parentNode.serviceId === 'filesystem') {
            const parentFolder = parentNode.itemData;
            newFolder.parentId = parentFolder.id;
            parentFolder.children.push(newFolder);
        }
        else {
            this.folders.push(newFolder);
        }
        this.saveState();
        this.treeProvider.refresh();
        return this.mapFolderToTreeItem(newFolder);
    }
    async removeFolder(node) {
        const folder = node.itemData;
        const answer = await vscode.window.showInformationMessage(`Are you sure you want to delete folder '${folder.name}'?`, "Yes", "No");
        if (answer === "Yes") {
            // Implementation of recursive delete or just simple remove
            // Simplest: Find and remove.
            this.deleteFolderRecursive(this.folders, folder.id);
            this.saveState();
            this.treeProvider.refresh();
        }
    }
    deleteFolderRecursive(list, id) {
        const index = list.findIndex(f => f.id === id);
        if (index !== -1) {
            list.splice(index, 1);
            return true;
        }
        for (const f of list) {
            if (this.deleteItemRecursive(f.children, id))
                return true;
        }
        return false;
    }
    deleteItemRecursive(list, id) {
        // This is tricky because list mixes types.
        // We know we are looking for a folder ID, so only check folders.
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            if ('children' in item) { // It's a folder
                if (item.id === id) {
                    list.splice(i, 1);
                    return true;
                }
                if (this.deleteItemRecursive(item.children, id))
                    return true;
            }
        }
        return false;
    }
    async addResourceToFolder(node) {
        const folder = node.itemData;
        // 1. Pick Service
        const services = ServiceManager_1.ServiceManager.Instance.getAllServices().filter(s => s.serviceId !== 'filesystem' && s.serviceId !== 'access');
        const serviceItems = services.map(s => ({ label: s.serviceId.toUpperCase(), service: s }));
        const selectedService = await vscode.window.showQuickPick(serviceItems, { placeHolder: 'Select Service' });
        if (!selectedService)
            return;
        // 2. Pick Resource from that service
        // We need a way to "Pick" a resource. existing 'addResource' usually creates new.
        // We probably want to "Select existing" or "Create new".
        // Most services have a "Filter" or list.
        // Let's ask the user to "Pick" an item.
        // Since we don't have a unified "Picker" interface on services, we might need one.
        // OR we just assume we want to add specific things.
        // For now, let's try to reuse `addResource` logic of the service but capture the result.
        // BUT `addResource` usually adds it to the root of that service.
        // We want a reference.
        // Revised approach: "Add Resource by ID/Name".
        // Or "Add from Active List" (pick from what's currently visible?).
        // Let's implement a simple "Pick from Root" for now.
        const rootNodes = await selectedService.service.getRootNodes();
        const pickItems = rootNodes.map(n => ({ label: n.label, item: n }));
        const selectedNode = await vscode.window.showQuickPick(pickItems, { placeHolder: 'Select Resource to Add' });
        if (selectedNode) {
            const ref = {
                type: 'resource',
                serviceId: selectedService.service.serviceId,
                label: selectedNode.item.label,
                data: selectedNode.item.itemData
            };
            folder.children.push(ref);
            this.saveState();
            this.treeProvider.refresh();
        }
    }
    async removeResource(node) {
        // We need to find the parent folder and remove this ref.
        // Since we don't have back-pointers easily, we search.
        // The node passed here is the wrapper we created in getChildren.
        // It has itemData corresponding to ref.data.
        // We might need to store a unique ID for the reference itself to delete it reliably.
        // Let's just create a helper to remove by object equality of data or similar?
        // Or add IDs to references.
        // For now, assuming we can find it.
        // Actually, we can't easily identify IT vs another instance of same resource.
        // But for UI, maybe it's fine.
        // BETTER: When creating the tree item, pass the PARENT folder in the itemData or a wrapper?
        // But we must pass what the Service expects for itemData.
        // Workaround: We can't implement RemoveResource cleanly without changing itemData or searching extensively.
        // Search approach:
        this.removeResourceRecursive(this.folders, node);
        this.saveState();
        this.treeProvider.refresh();
    }
    removeResourceRecursive(list, targetNode) {
        // Check top folders
        for (const f of list) {
            if (this.removeItemFromFolder(f, targetNode))
                return true;
        }
        return false;
    }
    removeItemFromFolder(folder, targetNode) {
        for (let i = 0; i < folder.children.length; i++) {
            const child = folder.children[i];
            if ('children' in child) {
                // Recurse
                if (this.removeItemFromFolder(child, targetNode))
                    return true;
            }
            else {
                const ref = child;
                // Match?
                if (ref.serviceId === targetNode.serviceId && JSON.stringify(ref.data) === JSON.stringify(targetNode.itemData)) {
                    folder.children.splice(i, 1);
                    return true;
                }
            }
        }
        return false;
    }
    mapFolderToTreeItem(folder) {
        return new WorkbenchTreeItem_1.WorkbenchTreeItem(folder.name, vscode.TreeItemCollapsibleState.Collapsed, 'filesystem', 'FileSystemFolder', folder);
    }
    loadState() {
        this.folders = this.context.globalState.get('filesystem.folders', []);
    }
    saveState() {
        this.context.globalState.update('filesystem.folders', this.folders);
    }
}
exports.FileSystemService = FileSystemService;
//# sourceMappingURL=FileSystemService.js.map