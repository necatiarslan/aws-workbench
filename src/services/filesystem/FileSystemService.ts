import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { IService } from '../IService';
import { ServiceManager } from '../ServiceManager';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';

// --- Interfaces ---

interface FileSystemNode {
    id: string;
    label: string;
    type: 'folder' | 'resource';
}

interface FileSystemFolder extends FileSystemNode {
    type: 'folder';
    children: (FileSystemFolder | FileSystemResource)[];
    parentId?: string;
}

interface FileSystemResource extends FileSystemNode {
    type: 'resource';
    serviceId: string;
    data: any; // The original itemData from the service
}

export class FileSystemService implements IService {
    public static Instance: FileSystemService;
    public readonly serviceId = 'filesystem';
    private treeProvider!: WorkbenchTreeProvider;
    private rootFolders: FileSystemFolder[] = [];

    constructor(private context: vscode.ExtensionContext) {
        FileSystemService.Instance = this;
        this.loadState();
    }

    public registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider, treeView: vscode.TreeView<WorkbenchTreeItem>): void {
        this.treeProvider = treeProvider;
        context.subscriptions.push(
            vscode.commands.registerCommand('aws-workbench.filesystem.AddFolder', (node?: WorkbenchTreeItem) => this.promptAddFolder(node)),
            vscode.commands.registerCommand('aws-workbench.filesystem.RemoveFolder', (node: WorkbenchTreeItem) => this.confirmRemoveFolder(node)),
            vscode.commands.registerCommand('aws-workbench.filesystem.AddResourceToFolder', (node: WorkbenchTreeItem) => this.promptAddResourceToFolder(node)),
            vscode.commands.registerCommand('aws-workbench.filesystem.RemoveResource', (node: WorkbenchTreeItem) => this.removeResource(node))
        );
    }

    public async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        return this.rootFolders.map(folder => this.createFolderTreeItem(folder));
    }

    public async getChildren(element?: WorkbenchTreeItem): Promise<WorkbenchTreeItem[]> {
        if (!element) {
            return this.getRootNodes();
        }

        const nodeData = element.itemData as FileSystemNode;

        if (nodeData.type === 'folder') {
            const folder = nodeData as FileSystemFolder;
            const children: WorkbenchTreeItem[] = [];

            for (const child of folder.children) {
                if (child.type === 'folder') {
                    children.push(this.createFolderTreeItem(child));
                } else {
                    const resourceItem = await this.createResourceTreeItem(child as FileSystemResource);
                    if (resourceItem) {
                        children.push(resourceItem);
                    }
                }
            }
            return children;
        }

        return [];
    }

    public getTreeItem(element: WorkbenchTreeItem): vscode.TreeItem | Promise<vscode.TreeItem> {
        // This method is primarily called for the Folder items themselves,
        // as the actual service resources are proxied.
        const nodeData = element.itemData as FileSystemNode;

        if (nodeData && nodeData.type === 'folder') {
            const folder = nodeData as FileSystemFolder;
            const item = new vscode.TreeItem(folder.label, vscode.TreeItemCollapsibleState.Expanded);
            item.contextValue = 'FileSystemFolder';
            item.iconPath = new vscode.ThemeIcon('folder');
            item.id = folder.id; // Helpful for VSCode to track selection
            return item;
        }
        
        return element;
    }

    public async addResource(): Promise<WorkbenchTreeItem | undefined> {
        return this.promptAddFolder();
    }

    // --- Helpers for Tree Items ---

    private createFolderTreeItem(folder: FileSystemFolder): WorkbenchTreeItem {
        return new WorkbenchTreeItem(
            folder.label,
            vscode.TreeItemCollapsibleState.Collapsed,
            this.serviceId,
            'FileSystemFolder',
            folder
        );
    }

    private async createResourceTreeItem(resource: FileSystemResource): Promise<WorkbenchTreeItem | undefined> {
        const service = ServiceManager.Instance.getService(resource.serviceId);
        if (!service) {
            return new WorkbenchTreeItem(
                `${resource.label} (Unknown Service)`,
                vscode.TreeItemCollapsibleState.None,
                this.serviceId,
                'error',
                resource
            );
        }

        try {
            // Create a temporary item to pass to the service so it can reconstruct the full TreeItem
            const tempItem = new WorkbenchTreeItem(
                resource.label,
                vscode.TreeItemCollapsibleState.Collapsed,
                resource.serviceId,
                undefined,
                resource.data
            );

            // Ask the service to resolving the full details (icon, contextValue, collapsible state)
            const resolvedItem = await service.getTreeItem(tempItem);

            // Wrap the resolved context value so we can add 'FileSystemResource' features
            // This allows us to have specific context menu actions for filesystem resources (like Remove)
            const wrappedContextValue = (resolvedItem.contextValue || '') + '#FileSystemResource#';

            return new WorkbenchTreeItem(
                resolvedItem.label as string || resource.label,
                resolvedItem.collapsibleState || vscode.TreeItemCollapsibleState.None,
                resource.serviceId, // Keep the original service ID so interactions work
                wrappedContextValue,
                resource.data // Keep the original data so the service can function
            );
        } catch (error) {
            console.error(`Failed to restore resource ${resource.label}:`, error);
            return new WorkbenchTreeItem(
                `${resource.label} (Error)`,
                vscode.TreeItemCollapsibleState.None,
                this.serviceId,
                'error',
                resource
            );
        }
    }

    // --- Actions ---

    private async promptAddFolder(parentNode?: WorkbenchTreeItem): Promise<WorkbenchTreeItem | undefined> {
        const name = await vscode.window.showInputBox({ 
            placeHolder: 'Folder Name',
            validateInput: (value) => value ? null : 'Folder name cannot be empty'
        });
        
        if (!name) return;

        const newFolder: FileSystemFolder = {
            id: uuidv4(),
            label: name,
            type: 'folder',
            children: []
        };

        if (parentNode && parentNode.serviceId === this.serviceId) {
            const parentFolder = parentNode.itemData as FileSystemFolder;
            if (parentFolder.type !== 'folder') return; // Should not happen
            
            newFolder.parentId = parentFolder.id;
            parentFolder.children.push(newFolder);
        } else {
            this.rootFolders.push(newFolder);
        }

        await this.saveState();
        this.treeProvider.refresh();
        return this.createFolderTreeItem(newFolder);
    }

    private async confirmRemoveFolder(node: WorkbenchTreeItem): Promise<void> {
        const folder = node.itemData as FileSystemFolder;
        const answer = await vscode.window.showWarningMessage(
            `Are you sure you want to delete folder '${folder.label}'?`, 
            { modal: true }, 
            "Yes"
        );
        
        if (answer === "Yes") {
            this.removeItemRecursive(this.rootFolders, folder.id);
            await this.saveState();
            this.treeProvider.refresh();
        }
    }

    private async promptAddResourceToFolder(node: WorkbenchTreeItem): Promise<void> {
        const folder = node.itemData as FileSystemFolder;
        if (folder.type !== 'folder') return;

        // 1. Pick Service (exclude meta-services)
        const services = ServiceManager.Instance.getAllServices()
            .filter(s => s.serviceId !== 'filesystem' && s.serviceId !== 'access');
            
        const servicePick = await vscode.window.showQuickPick(
            services.map(s => ({ 
                label: s.serviceId.toUpperCase(), 
                service: s 
            })), 
            { placeHolder: 'Select Service Service' }
        );

        if (!servicePick) return;

        try {
            // 2. Pick Resource from Service's Root Nodes
            // NOTE: This assumes services provide flat lists or we only support adding root-level items.
            // A more advanced version would allow browsing the service tree to pick an item.
            const rootNodes = await servicePick.service.getRootNodes();
            const resourcePick = await vscode.window.showQuickPick(
                rootNodes.map(n => ({ 
                    label: n.label as string, 
                    item: n 
                })), 
                { placeHolder: `Select ${servicePick.label} Resource to Add` }
            );

            if (resourcePick) {
                const newResource: FileSystemResource = {
                    id: uuidv4(),
                    label: resourcePick.item.label as string,
                    type: 'resource',
                    serviceId: servicePick.service.serviceId,
                    data: resourcePick.item.itemData
                };

                folder.children.push(newResource);
                await this.saveState();
                this.treeProvider.refresh();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to list resources: ${error}`);
        }
    }

    private async removeResource(node: WorkbenchTreeItem): Promise<void> {
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
        } else {
             vscode.window.showWarningMessage("Could not find the resource in the file system folders to delete.");
        }
    }

    // --- Recursion Helpers ---

    private removeItemRecursive(list: (FileSystemFolder | FileSystemResource)[], id: string): boolean {
        const index = list.findIndex(item => item.id === id);
        if (index !== -1) {
            list.splice(index, 1);
            return true;
        }

        for (const item of list) {
            if (item.type === 'folder') {
                if (this.removeItemRecursive((item as FileSystemFolder).children, id)) {
                    return true;
                }
            }
        }
        return false;
    }

    private removeResourceByDataRecursive(list: (FileSystemFolder | FileSystemResource)[], serviceId: string, data: any): boolean {
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            if (item.type === 'resource') {
                const resource = item as FileSystemResource;
                // Deep comparison of data is expensive/tricky. 
                // We assume if serviceId matches and JSON string of data matches, it's the same.
                if (resource.serviceId === serviceId && JSON.stringify(resource.data) === JSON.stringify(data)) {
                    list.splice(i, 1);
                    return true;
                }
            } else if (item.type === 'folder') {
                if (this.removeResourceByDataRecursive((item as FileSystemFolder).children, serviceId, data)) {
                    return true;
                }
            }
        }
        return false;
    }

    // --- State Management ---

    private loadState(): void {
        const data = this.context.globalState.get<FileSystemFolder[]>('filesystem.folders', []);
        // Validate / Migrate data if necessary? 
        // For now, assume it's correct or empty.
        this.rootFolders = data;
    }

    private async saveState(): Promise<void> {
        await this.context.globalState.update('filesystem.folders', this.rootFolders);
    }
}
