"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const access_ext = require("./services/access/extension");
const WorkbenchTreeProvider_1 = require("./tree/WorkbenchTreeProvider");
const ServiceManager_1 = require("./services/ServiceManager");
const S3Service_1 = require("./services/s3/S3Service");
const LambdaService_1 = require("./services/lambda/LambdaService");
const CloudwatchService_1 = require("./services/cloudwatch/CloudwatchService");
const DynamodbService_1 = require("./services/dynamodb/DynamodbService");
const GlueService_1 = require("./services/glue/GlueService");
const IamService_1 = require("./services/iam/IamService");
const SnsService_1 = require("./services/sns/SnsService");
const SqsService_1 = require("./services/sqs/SqsService");
const StepfunctionsService_1 = require("./services/step-functions/StepfunctionsService");
/**
 * Activates the AWS Workbench extension.
 * Consolidates activation of all sub-services.
 *
 * @param context - The extension context provided by VSCode
 */
function activate(context) {
    console.log('AWS Workbench is now active!');
    try {
        // 1. Activate access service (Status bar, profiles, etc.)
        access_ext.activate(context);
        // 2. Initialize the Unified "Aws Workbench" Tree Provider
        const treeProvider = new WorkbenchTreeProvider_1.WorkbenchTreeProvider(context);
        vscode.window.registerTreeDataProvider('AwsWorkbenchTree', treeProvider);
        // 3. Register our Service wrappers for the Unified Tree to fetch children from
        const serviceManager = ServiceManager_1.ServiceManager.Instance;
        serviceManager.registerService(new S3Service_1.S3Service(context));
        serviceManager.registerService(new LambdaService_1.LambdaService(context));
        serviceManager.registerService(new CloudwatchService_1.CloudwatchService(context));
        serviceManager.registerService(new DynamodbService_1.DynamodbService(context));
        serviceManager.registerService(new GlueService_1.GlueService(context));
        serviceManager.registerService(new IamService_1.IamService(context));
        serviceManager.registerService(new SnsService_1.SnsService(context));
        serviceManager.registerService(new SqsService_1.SqsService(context));
        serviceManager.registerService(new StepfunctionsService_1.StepfunctionsService(context));
        // 4. Register Commands
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
                await selected.service.addResource();
                treeProvider.refresh();
            }
        }));
        // 5. Register each service's commands
        for (const service of serviceManager.getAllServices()) {
            service.registerCommands(context, treeProvider);
        }
        console.log('All AWS services activated successfully.');
    }
    catch (error) {
        console.error('Error activating AWS Workbench services:', error);
    }
}
/**
 * Deactivates the extension.
 */
function deactivate() {
    try {
        access_ext.deactivate();
    }
    catch (error) {
        console.error('Error deactivating AWS Workbench services:', error);
    }
}
//# sourceMappingURL=extension.js.map