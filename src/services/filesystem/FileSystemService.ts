import * as vscode from 'vscode';
import { IService } from '../IService';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import { TreeItemType } from '../../tree/TreeItemType';
import { ServiceManager } from '../ServiceManager';
import { v4 as uuidv4 } from 'uuid';
import * as ui from '../../common/UI';

interface FolderItem {
    id: string;
    name: string;
    parentId?: string;
    children: (FolderItem | ResourceReference)[];
}

interface ResourceReference {
    type: 'resource';
    serviceId: string;
    // We store enough data to reconstruct or find the resource. 
    // Ideally we store what the service needs to add/find it.
    // For simplicity, we might store the itemData that the service uses.
    // However, itemData can be complex.
    // Let's store the serialized version if possible, or just the necessary IDs.
    // For S3: Bucket Name. For Lambda: Function Name, Region.
    data: any; 
    label: string;
}

export class FileSystemService implements IService {
    public static Instance: FileSystemService;
    public serviceId = 'filesystem'; // Should match package.json commands if we prefix them
    public context: vscode.ExtensionContext;
    private treeProvider!: WorkbenchTreeProvider;

    private folders: FolderItem[] = [];

    constructor(context: vscode.ExtensionContext) {
        FileSystemService.Instance = this;
        this.context = context;
        this.loadState();
    }

    registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider, treeView: vscode.TreeView<WorkbenchTreeItem>): void {
        this.treeProvider = treeProvider;
        context.subscriptions.push(
            vscode.commands.registerCommand('aws-workbench.filesystem.AddFolder', (node?: WorkbenchTreeItem) => {
                this.addFolder(node);
            }),
            vscode.commands.registerCommand('aws-workbench.filesystem.RemoveFolder', (node: WorkbenchTreeItem) => {
                this.removeFolder(node);
            }),
            vscode.commands.registerCommand('aws-workbench.filesystem.AddResourceToFolder', (node: WorkbenchTreeItem) => {
                this.addResourceToFolder(node);
            }),
            vscode.commands.registerCommand('aws-workbench.filesystem.RemoveResource', (node: WorkbenchTreeItem) => {
                this.removeResource(node);
            })
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        // Return top-level folders
        return this.folders.map(f => this.mapFolderToTreeItem(f));
    }

    async getChildren(element?: WorkbenchTreeItem): Promise<WorkbenchTreeItem[]> {
        if (!element) {
            return this.getRootNodes();
        }

        const folder = element.itemData as FolderItem;
        if (folder && folder.children) {
            const children: WorkbenchTreeItem[] = [];
            for (const child of folder.children) {
                if ('children' in child) {
                    // It's a folder
                    children.push(this.mapFolderToTreeItem(child as FolderItem));
                } else {
                    // It's a resource reference
                    const ref = child as ResourceReference;
                    const service = ServiceManager.Instance.getService(ref.serviceId);
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
                            
                            const item = new WorkbenchTreeItem(
                                ref.label,
                                vscode.TreeItemCollapsibleState.Collapsed, // Assume it has children?
                                ref.serviceId,
                                undefined, // Context value will be determined by service.getTreeItem? 
                                           // No, contextValue is passed in constructor.
                                           // We might need to ask service for the TreeItem to get valid contextValue and Icon.
                                ref.data
                            );
                            
                            // Let's resolve the full TreeItem from the service to get correct icon/contextValue
                            const resolvedItem = await service.getTreeItem(item);
                            
                            // We recreate the WorkbenchTreeItem with the resolved properties
                            // BUT we need to preserve the parent relationship for our file system?
                            // Actually, 'removeResource' needs to know it's in a folder.
                            // We might need to wrap the context value.
                            
                            const fileSystemContextValue = (resolvedItem.contextValue || '') + '#FileSystemResource#';
                            
                            children.push(new WorkbenchTreeItem(
                                resolvedItem.label as string || ref.label,
                                resolvedItem.collapsibleState || vscode.TreeItemCollapsibleState.None,
                                ref.serviceId,
                                fileSystemContextValue,
                                ref.data
                            ));
                            
                        } catch (e) {
                            console.error(`Failed to restore resource ${ref.label}:`, e);
                            children.push(new WorkbenchTreeItem(
                                `${ref.label} (Error)`,
                                vscode.TreeItemCollapsibleState.None,
                                'filesystem',
                                'error',
                                undefined
                            ));
                        }
                    }
                }
            }
            return children;
        }
        return [];
    }

    getTreeItem(element: WorkbenchTreeItem): vscode.TreeItem | Promise<vscode.TreeItem> {
        if (element.serviceId === 'filesystem') {
             // It's a folder
             const folder = element.itemData as FolderItem;
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

    async addResource(): Promise<WorkbenchTreeItem | undefined> {
        return this.addFolder();
    }

    // --- Actions ---

    private async addFolder(parentNode?: WorkbenchTreeItem): Promise<WorkbenchTreeItem | undefined> {
        const name = await vscode.window.showInputBox({ placeHolder: 'Folder Name' });
        if (!name) return;

        const newFolder: FolderItem = {
            id: uuidv4(),
            name: name,
            children: []
        };

        if (parentNode && parentNode.serviceId === 'filesystem') {
            const parentFolder = parentNode.itemData as FolderItem;
            newFolder.parentId = parentFolder.id;
            parentFolder.children.push(newFolder);
        } else {
            this.folders.push(newFolder);
        }

        this.saveState();
        this.treeProvider.refresh();
        return this.mapFolderToTreeItem(newFolder);
    }

    private async removeFolder(node: WorkbenchTreeItem) {
        const folder = node.itemData as FolderItem;
        const answer = await vscode.window.showInformationMessage(`Are you sure you want to delete folder '${folder.name}'?`, "Yes", "No");
        if (answer === "Yes") {
             // Implementation of recursive delete or just simple remove
             // Simplest: Find and remove.
             this.deleteFolderRecursive(this.folders, folder.id);
             this.saveState();
             this.treeProvider.refresh();
        }
    }
    
    private deleteFolderRecursive(list: FolderItem[], id: string): boolean {
        const index = list.findIndex(f => f.id === id);
        if (index !== -1) {
            list.splice(index, 1);
            return true;
        }
        for (const f of list) {
            if (this.deleteItemRecursive(f.children, id)) return true;
        }
        return false;
    }

    private deleteItemRecursive(list: (FolderItem | ResourceReference)[], id: string): boolean {
        // This is tricky because list mixes types.
        // We know we are looking for a folder ID, so only check folders.
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            if ('children' in item) { // It's a folder
                 if (item.id === id) {
                     list.splice(i, 1);
                     return true;
                 }
                 if (this.deleteItemRecursive(item.children, id)) return true;
            }
        }
        return false;
    }

    private async addResourceToFolder(node: WorkbenchTreeItem) {
        const folder = node.itemData as FolderItem;
        
        // 1. Pick Service
        const services = ServiceManager.Instance.getAllServices().filter(s => s.serviceId !== 'filesystem' && s.serviceId !== 'access');
        const serviceItems = services.map(s => ({ label: s.serviceId.toUpperCase(), service: s }));
        const selectedService = await vscode.window.showQuickPick(serviceItems, { placeHolder: 'Select Service' });
        if (!selectedService) return;

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
            const ref: ResourceReference = {
                type: 'resource',
                serviceId: selectedService.service.serviceId,
                label: selectedNode.item.label as string,
                data: selectedNode.item.itemData
            };
            folder.children.push(ref);
            this.saveState();
            this.treeProvider.refresh();
        }
    }

    private async removeResource(node: WorkbenchTreeItem) {
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
    
    private removeResourceRecursive(list: FolderItem[], targetNode: WorkbenchTreeItem): boolean {
        // Check top folders
        for (const f of list) {
            if (this.removeItemFromFolder(f, targetNode)) return true;
        }
        return false;
    }
    
    private removeItemFromFolder(folder: FolderItem, targetNode: WorkbenchTreeItem): boolean {
         for (let i = 0; i < folder.children.length; i++) {
             const child = folder.children[i];
             if ('children' in child) {
                 // Recurse
                 if (this.removeItemFromFolder(child, targetNode)) return true;
             } else {
                 const ref = child as ResourceReference;
                 // Match?
                 if (ref.serviceId === targetNode.serviceId && JSON.stringify(ref.data) === JSON.stringify(targetNode.itemData)) {
                     folder.children.splice(i, 1);
                     return true;
                 }
             }
         }
         return false;
    }

    private mapFolderToTreeItem(folder: FolderItem): WorkbenchTreeItem {
        return new WorkbenchTreeItem(
            folder.name,
            vscode.TreeItemCollapsibleState.Collapsed,
            'filesystem',
            'FileSystemFolder',
            folder
        );
    }

    private loadState() {
        this.folders = this.context.globalState.get('filesystem.folders', []);
    }

    private saveState() {
        this.context.globalState.update('filesystem.folders', this.folders);
    }
}
