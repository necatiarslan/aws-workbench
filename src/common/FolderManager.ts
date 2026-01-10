import * as vscode from 'vscode';
import { Session, Folder } from './Session';
import { CustomResource } from '../services/AbstractAwsService';

/**
 * FolderManager provides utilities for folder selection, display, and management.
 */
export class FolderManager {
    /**
     * Display a quick-pick menu to select a folder or create a new one.
     * @param session - Current session with folder data
     * @param serviceId - Optional service ID to filter folders (currently unused - all folders are global)
     * @returns Selected folder ID, or null for ungrouped
     */
    public static async showFolderQuickPick(session: Session, serviceId?: string): Promise<string | null | undefined> {
        const items: vscode.QuickPickItem[] = [];
        
        // Add "Ungrouped" option
        items.push({
            label: '$(folder-opened) Ungrouped',
            description: 'Add resource without folder',
            alwaysShow: true,
        });

        // Add root folders and their hierarchy
        const rootFolders = session.getFolderHierarchy(null);
        this.addFolderItemsToQuickPick(items, rootFolders, session, '');

        // Add "Create New Folder" option
        items.push({
            label: '$(plus) Create New Folder',
            description: 'Create a new folder',
            alwaysShow: true,
        });

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a folder for this resource',
        });

        if (!selected) {
            return undefined; // User cancelled
        }

        if (selected.label.includes('Ungrouped')) {
            return null;
        }

        if (selected.label.includes('Create New Folder')) {
            return await this.createNewFolder(session);
        }

        // Extract folder ID from description (stored as custom property)
        const folderId = (selected as any).folderId;
        return folderId || null;
    }

    /**
     * Recursively add folder items to quick-pick list with hierarchy indentation.
     */
    private static addFolderItemsToQuickPick(
        items: vscode.QuickPickItem[],
        folders: Folder[],
        session: Session,
        indent: string
    ): void {
        for (const folder of folders) {
            const subfolders = session.getFolderHierarchy(folder.id);
            const item: any = {
                label: `${indent}$(folder) ${folder.name}`,
                description: `${subfolders.length} subfolder(s)`,
                folderId: folder.id,
            };
            items.push(item);

            // Recursively add subfolders with increased indentation
            this.addFolderItemsToQuickPick(items, subfolders, session, indent + '  ');
        }
    }

    /**
     * Create a new folder with user input.
     */
    private static async createNewFolder(session: Session): Promise<string | undefined> {
        const folderName = await vscode.window.showInputBox({
            prompt: 'Enter folder name',
            placeHolder: 'New Folder',
        });

        if (!folderName) {
            return undefined;
        }

        const folderId = await session.addFolder(folderName);
        return folderId;
    }

    /**
     * Get display label for a custom resource: "Custom Name → AwsName" or just "AwsName" if identical.
     */
    public static getDisplayName(resource: CustomResource): string {
        if (resource.displayName && resource.displayName !== resource.awsName) {
            return `${resource.displayName} → ${resource.awsName}`;
        }
        return resource.awsName;
    }

    /**
     * Show a quick-pick menu for folder filtering.
     */
    public static async showFilterFolderQuickPick(session: Session): Promise<string | null | undefined> {
        const items: vscode.QuickPickItem[] = [];

        // Add "Show All" option
        items.push({
            label: '$(folder-opened) Show All Resources',
            description: 'Clear folder filter',
            alwaysShow: true,
        });

        // Add root folders
        const rootFolders = session.getFolderHierarchy(null);
        this.addFolderItemsToQuickPick(items, rootFolders, session, '');

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Filter resources by folder',
        });

        if (!selected) {
            return undefined; // User cancelled
        }

        if (selected.label.includes('Show All')) {
            return null; // Clear filter
        }

        const folderId = (selected as any).folderId;
        return folderId || null;
    }

    /**
     * Show input box for resource name filtering.
     */
    public static async showFilterResourceNameInput(currentFilter?: string): Promise<string | undefined> {
        const filter = await vscode.window.showInputBox({
            prompt: 'Filter resources by name (use regex or plain text)',
            placeHolder: 'e.g., lambda-* or my-resource',
            value: currentFilter || '',
        });

        return filter; // Can be empty string to clear, or undefined if cancelled
    }

    /**
     * Apply folder/resource name filters to items.
     */
    public static filterItems(
        items: any[],
        folderFilter?: string,
        resourceNameFilter?: string
    ): any[] {
        let filtered = items;

        // Filter by folder
        if (folderFilter) {
            filtered = filtered.filter(item => {
                if (item.isFolder && item.parentFolderId === folderFilter) {
                    return true; // Show subfolders of filtered folder
                }
                return item.folderId === folderFilter;
            });
        }

        // Filter by resource name
        if (resourceNameFilter) {
            try {
                const regex = new RegExp(resourceNameFilter, 'i');
                filtered = filtered.filter(item => {
                    const label = typeof item.label === 'string' ? item.label : '';
                    return regex.test(label) || (item.displayName && regex.test(item.displayName));
                });
            } catch (e) {
                // If regex is invalid, treat as plain text match
                const lowerFilter = resourceNameFilter.toLowerCase();
                filtered = filtered.filter(item => {
                    const label = (typeof item.label === 'string' ? item.label : '').toLowerCase();
                    return label.includes(lowerFilter);
                });
            }
        }

        return filtered;
    }
}
