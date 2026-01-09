import * as vscode from 'vscode';

import { WorkbenchTreeProvider } from './tree/WorkbenchTreeProvider';
import { WorkbenchTreeItem } from './tree/WorkbenchTreeItem';
import { ServiceManager } from './services/ServiceManager';

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

        // 3. Register Core Commands
        registerCoreCommands(context, serviceManager, treeProvider, treeView);

        // 4. Register Service Commands
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
                    const node = await selected.service.addResource();
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

        vscode.commands.registerCommand('aws-workbench.TestAwsConnection', () => {
             vscode.commands.executeCommand('aws-workbench.access.TestAwsConnectivity');
        }),

        vscode.commands.registerCommand('aws-workbench.SelectAwsProfile', () => {
             vscode.commands.executeCommand('aws-workbench.access.SetActiveProfile');
        }),

        // Placeholder commands
        vscode.commands.registerCommand('aws-workbench.Filter', () => showNotImplemented('Filter')),
        vscode.commands.registerCommand('aws-workbench.ShowOnlyFavorite', () => showNotImplemented('ShowOnlyFavorite')),
        vscode.commands.registerCommand('aws-workbench.ShowHiddenNodes', () => showNotImplemented('ShowHiddenNodes')),
        vscode.commands.registerCommand('aws-workbench.UpdateAwsEndPoint', () => showNotImplemented('UpdateAwsEndPoint')),
        vscode.commands.registerCommand('aws-workbench.SetAwsRegion', () => showNotImplemented('SetAwsRegion'))
    );
}

function showNotImplemented(feature: string) {
    vscode.window.showInformationMessage(`${feature} command is not implemented yet.`);
}

export function deactivate(): void {
    // Cleanup is handled by context.subscriptions
}
