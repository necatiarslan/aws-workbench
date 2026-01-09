"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const WorkbenchTreeProvider_1 = require("./tree/WorkbenchTreeProvider");
const ServiceManager_1 = require("./services/ServiceManager");
const S3Service_1 = require("./services/s3/S3Service");
const LambdaService_1 = require("./services/lambda/LambdaService");
const CloudWatchService_1 = require("./services/cloudwatch/CloudWatchService");
const DynamodbService_1 = require("./services/dynamodb/DynamodbService");
const GlueService_1 = require("./services/glue/GlueService");
const IamService_1 = require("./services/iam/IamService");
const SnsService_1 = require("./services/sns/SnsService");
const SqsService_1 = require("./services/sqs/SqsService");
const StepfunctionsService_1 = require("./services/step-functions/StepfunctionsService");
const AccessService_1 = require("./services/access/AccessService");
const FileSystemService_1 = require("./services/filesystem/FileSystemService");
/**
 * Activates the AWS Workbench extension.
 * This is the entry point for the extension.
 */
function activate(context) {
    console.log('Activating AWS Workbench...');
    try {
        // 1. Initialize the Unified "Aws Workbench" Tree Provider
        const treeProvider = new WorkbenchTreeProvider_1.WorkbenchTreeProvider(context);
        const treeView = vscode.window.createTreeView('AwsWorkbenchTree', {
            treeDataProvider: treeProvider,
            showCollapseAll: true
        });
        context.subscriptions.push(treeView);
        // 2. Register Services
        // Services are responsible for managing their own resources and tree nodes.
        const serviceManager = ServiceManager_1.ServiceManager.Instance;
        serviceManager.registerService(new FileSystemService_1.FileSystemService(context));
        serviceManager.registerService(new AccessService_1.AccessService(context));
        serviceManager.registerService(new S3Service_1.S3Service(context));
        serviceManager.registerService(new LambdaService_1.LambdaService(context));
        serviceManager.registerService(new CloudWatchService_1.CloudWatchService(context));
        serviceManager.registerService(new DynamodbService_1.DynamodbService(context));
        serviceManager.registerService(new GlueService_1.GlueService(context));
        serviceManager.registerService(new IamService_1.IamService(context));
        serviceManager.registerService(new SnsService_1.SnsService(context));
        serviceManager.registerService(new SqsService_1.SqsService(context));
        serviceManager.registerService(new StepfunctionsService_1.StepfunctionsService(context));
        // 3. Register Core Commands
        registerCoreCommands(context, serviceManager, treeProvider, treeView);
        // 4. Register Service Commands
        // Each service registers its own specific commands.
        for (const service of serviceManager.getAllServices()) {
            service.registerCommands(context, treeProvider, treeView);
        }
        console.log('AWS Workbench activated successfully.');
    }
    catch (error) {
        console.error('Fatal error activating AWS Workbench:', error);
        vscode.window.showErrorMessage('AWS Workbench failed to activate. Check debug console for details.');
    }
}
/**
 * Registers the core commands for the extension that aren't specific to a single service.
 */
function registerCoreCommands(context, serviceManager, treeProvider, treeView) {
    context.subscriptions.push(vscode.commands.registerCommand('aws-workbench.addResource', async () => {
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
                    // Small delay to ensure the tree has updated before revealing the new node
                    setTimeout(() => {
                        treeView.reveal(node, { select: true, focus: true, expand: true });
                    }, 500);
                }
            }
            catch (err) {
                console.error('Error adding resource:', err);
                vscode.window.showErrorMessage(`Failed to add resource: ${err}`);
            }
        }
    }), vscode.commands.registerCommand('aws-workbench.Refresh', () => treeProvider.refresh()), vscode.commands.registerCommand('aws-workbench.TestAwsConnection', () => {
        vscode.commands.executeCommand('aws-workbench.access.TestAwsConnectivity');
    }), vscode.commands.registerCommand('aws-workbench.SelectAwsProfile', () => {
        vscode.commands.executeCommand('aws-workbench.access.SetActiveProfile');
    }), 
    // Placeholder commands for features not yet implemented
    vscode.commands.registerCommand('aws-workbench.Filter', () => showNotImplemented('Filter')), vscode.commands.registerCommand('aws-workbench.ShowOnlyFavorite', () => showNotImplemented('ShowOnlyFavorite')), vscode.commands.registerCommand('aws-workbench.ShowHiddenNodes', () => showNotImplemented('ShowHiddenNodes')), vscode.commands.registerCommand('aws-workbench.UpdateAwsEndPoint', () => showNotImplemented('UpdateAwsEndPoint')), vscode.commands.registerCommand('aws-workbench.SetAwsRegion', () => showNotImplemented('SetAwsRegion')));
}
function showNotImplemented(feature) {
    vscode.window.showInformationMessage(`${feature} command is not implemented yet.`);
}
function deactivate() {
    // Cleanup is handled by context.subscriptions
}
//# sourceMappingURL=extension.js.map