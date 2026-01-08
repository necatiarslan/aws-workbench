import * as vscode from 'vscode';
import * as access_ext from './services/access/extension';

import { WorkbenchTreeProvider } from './tree/WorkbenchTreeProvider';
import { ServiceManager } from './services/ServiceManager';

import { S3Service } from './services/s3/S3Service';
import { LambdaService } from './services/lambda/LambdaService';
import { CloudwatchService } from './services/cloudwatch/CloudwatchService';
import { DynamodbService } from './services/dynamodb/DynamodbService';
import { GlueService } from './services/glue/GlueService';
import { IamService } from './services/iam/IamService';
import { SnsService } from './services/sns/SnsService';
import { SqsService } from './services/sqs/SqsService';
import { StepfunctionsService } from './services/step-functions/StepfunctionsService';

/**
 * Activates the AWS Workbench extension.
 * Consolidates activation of all sub-services.
 * 
 * @param context - The extension context provided by VSCode
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('AWS Workbench is now active!');

    try {
        // 1. Activate access service (Status bar, profiles, etc.)
        access_ext.activate(context);

        // 2. Initialize the Unified "Aws Workbench" Tree Provider
        const treeProvider = new WorkbenchTreeProvider(context);
        const treeView = vscode.window.createTreeView('AwsWorkbenchTree', { 
            treeDataProvider: treeProvider,
            showCollapseAll: true 
        });
        context.subscriptions.push(treeView);

        // 3. Register our Service wrappers for the Unified Tree to fetch children from
        const serviceManager = ServiceManager.Instance;
        serviceManager.registerService(new S3Service(context));
        serviceManager.registerService(new LambdaService(context));
        serviceManager.registerService(new CloudwatchService(context));
        serviceManager.registerService(new DynamodbService(context));
        serviceManager.registerService(new GlueService(context));
        serviceManager.registerService(new IamService(context));
        serviceManager.registerService(new SnsService(context));
        serviceManager.registerService(new SqsService(context));
        serviceManager.registerService(new StepfunctionsService(context));

        // 4. Register Commands
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
                    const node = await selected.service.addResource();
                    treeProvider.refresh();
                    if (node) {
                        try {
                            // Give VS Code a moment to refresh before revealing
                            setTimeout(() => {
                                treeView.reveal(node, { select: true, focus: true, expand: true });
                            }, 500);
                        } catch (e) {
                            console.error('Error revealing node:', e);
                        }
                    }
                }
            })
        );

        // 5. Register each service's commands
        for (const service of serviceManager.getAllServices()) {
            service.registerCommands(context, treeProvider, treeView);
        }

        console.log('All AWS services activated successfully.');
    } catch (error) {
        console.error('Error activating AWS Workbench services:', error);
    }
}

/**
 * Deactivates the extension.
 */
export function deactivate(): void {
    try {
        access_ext.deactivate();
    } catch (error) {
        console.error('Error deactivating AWS Workbench services:', error);
    }
}
