import * as vscode from 'vscode';

import { WorkbenchTreeProvider } from './tree/WorkbenchTreeProvider';
import { WorkbenchTreeItem } from './tree/WorkbenchTreeItem';
import { ServiceManager } from './services/ServiceManager';
import { Session } from './common/Session';
import { FolderManager } from './common/FolderManager';

import { S3Service } from './services/s3/S3Service';
import { LambdaService } from './services/lambda/LambdaService';
import { CloudWatchService } from './services/cloudwatch/CloudWatchService';
import { DynamodbService } from './services/dynamodb/DynamodbService';
import { GlueService } from './services/glue/GlueService';
import { IamService } from './services/iam/IamService';
import { SnsService } from './services/sns/SnsService';
import { SqsService } from './services/sqs/SqsService';
import { StepfunctionsService } from './services/step-functions/StepfunctionsService';
import { AccessService } from './services/access/AccessService';
import { FileSystemService } from './services/filesystem/FileSystemService';

/**
 * Activates the AWS Workbench extension.
 * This is the entry point for the extension.
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('Activating AWS Workbench...');

    try {
        new Session(context); // Initialize session management

        // 1. Initialize the Unified "Aws Workbench" Tree Provider
        const treeProvider = new WorkbenchTreeProvider(context);
        const treeView = vscode.window.createTreeView('AwsWorkbenchTree', { 
            treeDataProvider: treeProvider,
            showCollapseAll: true 
        });
        context.subscriptions.push(treeView);

        // 2. Register Services
        // Services are responsible for managing their own resources and tree nodes.
        const serviceManager = ServiceManager.Instance;
        serviceManager.registerService(new FileSystemService(context));
        serviceManager.registerService(new AccessService(context));
        serviceManager.registerService(new S3Service(context));
        serviceManager.registerService(new LambdaService(context));
        serviceManager.registerService(new CloudWatchService(context));
        serviceManager.registerService(new DynamodbService(context));
        serviceManager.registerService(new GlueService(context));
        serviceManager.registerService(new IamService(context));
        serviceManager.registerService(new SnsService(context));
        serviceManager.registerService(new SqsService(context));
        serviceManager.registerService(new StepfunctionsService(context));

        // 3. Load global folders from storage
        Session.Current?.loadFolders().then(() => {
            // Load custom resources for each service
            for (const service of serviceManager.getAllServices()) {
                (service as any).loadCustomResources?.();
            }
        });

        // 4. Register Core Commands
        registerCoreCommands(context, serviceManager, treeProvider, treeView);

        // 5. Register Service Commands
        // Each service registers its own specific commands.
        for (const service of serviceManager.getAllServices()) {
            service.registerCommands(context, treeProvider, treeView);
        }

        console.log('AWS Workbench activated successfully.');
    } catch (error) {
        console.error('Fatal error activating AWS Workbench:', error);
        vscode.window.showErrorMessage('AWS Workbench failed to activate. Check debug console for details.');
    }
}

/**
 * Registers the core commands for the extension that aren't specific to a single service.
 */
function registerCoreCommands(
    context: vscode.ExtensionContext, 
    serviceManager: ServiceManager, 
    treeProvider: WorkbenchTreeProvider,
    treeView: vscode.TreeView<any>
) {
    // --- Generic Node Commands ---
    // These commands delegate to the specific service instance if it inherits from AbstractAwsService

    const executeServiceCommand = (node: WorkbenchTreeItem, action: (service: any) => void) => {
        if (!node) return;
        const service = serviceManager.getService(node.serviceId);
        if (service && 'hideResource' in service) { 
            // Duck typing check for AbstractAwsService methods
            action(service);
            treeProvider.refresh();
        } else {
            vscode.window.showWarningMessage(`Service '${node.serviceId}' does not support this action.`);
        }
    };

    context.subscriptions.push(
        vscode.commands.registerCommand('aws-workbench.addResource', async () => {
            const services = serviceManager.getAllServices();
            const items = services.map(s => ({
                label: s.serviceId.toUpperCase(),
                description: `Add ${s.serviceId.toUpperCase()} resource`,
                service: s
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select AWS resource type to add'
            });

            if (selected) {
                try {
                    const node = await (selected.service as any).addResource?.();
                    treeProvider.refresh();
                    if (node) {
                        setTimeout(() => {
                            treeView.reveal(node, { select: true, focus: true, expand: true });
                        }, 500);
                    }
                } catch (err) {
                    console.error('Error adding resource:', err);
                    vscode.window.showErrorMessage(`Failed to add resource: ${err}`);
                }
            }
        }),

        vscode.commands.registerCommand('aws-workbench.addResourceToFolder', async (folderNode: WorkbenchTreeItem) => {
            if (!folderNode || !folderNode.isFolder || !folderNode.itemData) {
                vscode.window.showWarningMessage('Please select a folder');
                return;
            }

            const folderId = (folderNode.itemData as any).id;
            const services = serviceManager.getAllServices().filter(s => 'addResource' in s);
            const items = services.map(s => ({
                label: s.serviceId.toUpperCase(),
                description: `Add ${s.serviceId.toUpperCase()} resource`,
                service: s
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select AWS resource type to add to folder'
            });

            if (selected) {
                try {
                    const node = await (selected.service as any).addResource?.(folderId);
                    treeProvider.refresh();
                    if (node) {
                        setTimeout(() => {
                            treeView.reveal(node, { select: true, focus: true, expand: true });
                        }, 500);
                    }
                } catch (err) {
                    console.error('Error adding resource to folder:', err);
                    vscode.window.showErrorMessage(`Failed to add resource: ${err}`);
                }
            }
        }),

        vscode.commands.registerCommand('aws-workbench.Refresh', () => treeProvider.refresh()),
        
        // --- Generic Actions ---
        vscode.commands.registerCommand('aws-workbench.HideNode', (node: WorkbenchTreeItem) => 
            executeServiceCommand(node, (s) => s.hideResource(node))
        ),
        vscode.commands.registerCommand('aws-workbench.UnHideNode', (node: WorkbenchTreeItem) => 
            executeServiceCommand(node, (s) => s.unhideResource(node))
        ),
        vscode.commands.registerCommand('aws-workbench.AddToFav', (node: WorkbenchTreeItem) => 
            executeServiceCommand(node, (s) => s.addToFav(node))
        ),
        vscode.commands.registerCommand('aws-workbench.DeleteFromFav', (node: WorkbenchTreeItem) => 
            executeServiceCommand(node, (s) => s.deleteFromFav(node))
        ),
        vscode.commands.registerCommand('aws-workbench.ShowOnlyInThisProfile', (node: WorkbenchTreeItem) => {
             // Access service to get current profile? Or pass it in?
             // Since this is generic, we might need a prompt or access specific property.
             // For now, assume service has 'AwsProfile' property or we prompt.
             // Let's prompt or check if service has a public 'AwsProfile'
             const service = serviceManager.getService(node.serviceId) as any;
             if (service && service.AwsProfile) {
                 executeServiceCommand(node, (s) => s.showOnlyInProfile(node, service.AwsProfile));
             } else {
                 vscode.window.showInformationMessage('No active profile found in this service.');
             }
        }),
        vscode.commands.registerCommand('aws-workbench.ShowInAnyProfile', (node: WorkbenchTreeItem) => 
            executeServiceCommand(node, (s) => s.showInAnyProfile(node))
        ),

        vscode.commands.registerCommand('aws-workbench.TestAwsConnection', () => Session.Current?.TestAwsConnection()),

        vscode.commands.registerCommand('aws-workbench.SelectAwsProfile', () => {
             vscode.commands.executeCommand('aws-workbench.access.SetActiveProfile');
        }),

        // Placeholder commands
        vscode.commands.registerCommand('aws-workbench.Filter', async () => {
            const filterOptions = [
                { 
                    label: '$(folder) Filter by Folder', 
                    description: 'Show resources in a specific folder',
                    command: 'aws-workbench.FilterByFolder' 
                },
                { 
                    label: '$(search) Filter by Resource Name', 
                    description: 'Filter resources by name pattern',
                    command: 'aws-workbench.FilterByResourceName' 
                },
                { 
                    label: '$(clear-all) Clear All Filters', 
                    description: 'Remove all active filters',
                    command: 'aws-workbench.ClearFilters' 
                }
            ];

            const selected = await vscode.window.showQuickPick(filterOptions, {
                placeHolder: 'Select filter option'
            });

            if (selected) {
                vscode.commands.executeCommand(selected.command);
            }
        }),
        vscode.commands.registerCommand('aws-workbench.ShowOnlyFavorite', () => {
            if (Session.Current) {
                Session.Current.toggleShowOnlyFavorites();
                treeProvider.refresh();
                const status = Session.Current.isShowOnlyFavorites ? 'enabled' : 'disabled';
                vscode.window.showInformationMessage(`Show Only Favorites ${status}`);
            }
        }),
        vscode.commands.registerCommand('aws-workbench.ShowHiddenNodes', () => {
            if (Session.Current) {
                Session.Current.toggleShowHiddenNodes();
                treeProvider.refresh();
                const status = Session.Current.isShowHiddenNodes ? 'enabled' : 'disabled';
                vscode.window.showInformationMessage(`Show Hidden Nodes ${status}`);
            }
        }),
        vscode.commands.registerCommand('aws-workbench.UpdateAwsEndPoint', () => Session.Current?.SetAwsEndpoint()),
        vscode.commands.registerCommand('aws-workbench.SetAwsRegion', () => Session.Current?.SetAwsRegion()),

        // --- Folder Management Commands ---
        vscode.commands.registerCommand('aws-workbench.CreateFolder', async () => {
            const session = Session.Current;
            if (!session) return;

            const folderName = await vscode.window.showInputBox({
                prompt: 'Enter folder name',
                placeHolder: 'New Folder',
            });

            if (folderName) {
                await session.addFolder(folderName);
                treeProvider.refresh();
                vscode.window.showInformationMessage(`Folder "${folderName}" created`);
            }
        }),

        vscode.commands.registerCommand('aws-workbench.RenameFolder', async (node: WorkbenchTreeItem) => {
            if (!node.isFolder || !node.itemData) return;
            const folder = node.itemData;
            const session = Session.Current;
            if (!session) return;

            const newName = await vscode.window.showInputBox({
                prompt: 'Enter new folder name',
                value: folder.name,
            });

            if (newName && newName !== folder.name) {
                await session.updateFolder(folder.id, newName);
                treeProvider.refresh();
                vscode.window.showInformationMessage(`Folder renamed to "${newName}"`);
            }
        }),

        vscode.commands.registerCommand('aws-workbench.DeleteFolder', async (node: WorkbenchTreeItem) => {
            if (!node.isFolder || !node.itemData) return;
            const folder = node.itemData;
            const session = Session.Current;
            if (!session) return;

            const descendantFolders = (session as any).getDescendantFolders(folder.id);
            let resourceCount = 0;
            const serviceManager = ServiceManager.Instance;
            for (const service of serviceManager.getAllServices()) {
                resourceCount += (service as any).countResourcesInFolders([folder.id, ...descendantFolders]);
            }

            const confirmed = await vscode.window.showWarningMessage(
                `Delete folder "${folder.name}" and ${descendantFolders.length} subfolder(s) containing ${resourceCount} resource(s)?`,
                'Delete',
                'Cancel'
            );

            if (confirmed === 'Delete') {
                await session.deleteFolder(folder.id);
                treeProvider.refresh();
                vscode.window.showInformationMessage(`Folder "${folder.name}" deleted`);
            }
        }),

        vscode.commands.registerCommand('aws-workbench.MoveResourceToFolder', async (node: WorkbenchTreeItem) => {
            if (node.isFolder || !node.compositeKey) return;
            const session = Session.Current;
            if (!session) return;

            const folderId = await FolderManager.showFolderQuickPick(session);
            if (folderId === undefined) return; // User cancelled

            // Update custom resource's folder
            const service = serviceManager.getService(node.serviceId);
            const customResources = (service as any).customResources as Map<string, any>;
            const resource = customResources.get(node.compositeKey);
            if (resource) {
                resource.folderId = folderId;
                await (service as any).saveCustomResources();
                treeProvider.refresh();
                const folderName = folderId ? session.getFolderPath(folderId) : 'Ungrouped';
                vscode.window.showInformationMessage(`Resource moved to "${folderName}"`);
            }
        }),

        vscode.commands.registerCommand('aws-workbench.AddFolderToFav', (node: WorkbenchTreeItem) => {
            if (!node.isFolder || !node.itemData) return;
            const folder = node.itemData;
            Session.Current?.addFolderToFavorites(folder.id);
            treeProvider.refresh();
            vscode.window.showInformationMessage(`Folder "${folder.name}" added to favorites`);
        }),

        vscode.commands.registerCommand('aws-workbench.RemoveFolderFromFav', (node: WorkbenchTreeItem) => {
            if (!node.isFolder || !node.itemData) return;
            const folder = node.itemData;
            Session.Current?.removeFolderFromFavorites(folder.id);
            treeProvider.refresh();
            vscode.window.showInformationMessage(`Folder "${folder.name}" removed from favorites`);
        }),

        vscode.commands.registerCommand('aws-workbench.HideFolderNode', (node: WorkbenchTreeItem) => {
            if (!node.isFolder || !node.itemData) return;
            const folder = node.itemData;
            Session.Current?.hideFolderNode(folder.id);
            treeProvider.refresh();
            vscode.window.showInformationMessage(`Folder "${folder.name}" hidden`);
        }),

        vscode.commands.registerCommand('aws-workbench.UnHideFolderNode', (node: WorkbenchTreeItem) => {
            if (!node.isFolder || !node.itemData) return;
            const folder = node.itemData;
            Session.Current?.unhideFolderNode(folder.id);
            treeProvider.refresh();
            vscode.window.showInformationMessage(`Folder "${folder.name}" unhidden`);
        }),

        vscode.commands.registerCommand('aws-workbench.RemoveFromFolder', async (node: WorkbenchTreeItem) => {
            if (!node.isCustom || !node.compositeKey) return;

            const service = serviceManager.getService(node.serviceId);
            const customResources = (service as any).customResources as Map<string, any>;
            const resource = customResources.get(node.compositeKey);
            if (resource && resource.folderId) {
                resource.folderId = null;
                await (service as any).saveCustomResources();
                treeProvider.refresh();
                vscode.window.showInformationMessage('Resource removed from folder');
            }
        }),

        // --- Filtering Commands ---
        vscode.commands.registerCommand('aws-workbench.FilterByFolder', async () => {
            const session = Session.Current;
            if (!session) return;

            const folderId = await FolderManager.showFilterFolderQuickPick(session);
            if (folderId === undefined) return; // User cancelled

            treeProvider.setFolderFilter(folderId || undefined);
            const folderName = folderId ? session.getFolderPath(folderId) : 'All Folders';
            vscode.window.showInformationMessage(`Filtered by folder: "${folderName}"`);
        }),

        vscode.commands.registerCommand('aws-workbench.FilterByResourceName', async () => {
            const session = Session.Current;
            if (!session) return;

            const filter = await FolderManager.showFilterResourceNameInput(session.resourceNameFilter);
            if (filter === undefined) return; // User cancelled

            treeProvider.setResourceNameFilter(filter || undefined);
            const filterDisplay = filter ? `"${filter}"` : 'cleared';
            vscode.window.showInformationMessage(`Resource name filter ${filterDisplay}`);
        }),

        vscode.commands.registerCommand('aws-workbench.ClearFilters', () => {
            treeProvider.clearFilters();
            vscode.window.showInformationMessage('All filters cleared');
        })
    );
}

function showNotImplemented(feature: string) {
    vscode.window.showInformationMessage(`${feature} command is not implemented yet.`);
}

export function deactivate(): void {
    // Cleanup is handled by context.subscriptions
}
