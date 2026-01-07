"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const s3_ext = require("./services/s3/extension");
const lambda_ext = require("./services/lambda/extension");
const cloudwatch_ext = require("./services/cloudwatch/extension");
const access_ext = require("./services/access/extension");
const dynamodb_ext = require("./services/dynamodb/extension");
const glue_ext = require("./services/glue/extension");
const iam_ext = require("./services/iam/extension");
const sns_ext = require("./services/sns/extension");
const sqs_ext = require("./services/sqs/extension");
const step_ext = require("./services/step-functions/extension");
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
        // 1. Activate original extensions' command registration and tree views
        // These are registered in the same 'aws-workbench' sidebar container (multi-accordion)
        s3_ext.activate(context);
        lambda_ext.activate(context);
        cloudwatch_ext.activate(context);
        access_ext.activate(context);
        dynamodb_ext.activate(context);
        glue_ext.activate(context);
        iam_ext.activate(context);
        sns_ext.activate(context);
        sqs_ext.activate(context);
        step_ext.activate(context);
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
    // Call deactivate for each service if they export it
    try {
        if (s3_ext.deactivate)
            s3_ext.deactivate();
        if (lambda_ext.deactivate)
            lambda_ext.deactivate();
        if (cloudwatch_ext.deactivate)
            cloudwatch_ext.deactivate();
        if (access_ext.deactivate)
            access_ext.deactivate();
        if (dynamodb_ext.deactivate)
            dynamodb_ext.deactivate();
        if (glue_ext.deactivate)
            glue_ext.deactivate();
        if (iam_ext.deactivate)
            iam_ext.deactivate();
        if (sns_ext.deactivate)
            sns_ext.deactivate();
        if (sqs_ext.deactivate)
            sqs_ext.deactivate();
        if (step_ext.deactivate)
            step_ext.deactivate();
    }
    catch (error) {
        console.error('Error deactivating AWS Workbench services:', error);
    }
}
//# sourceMappingURL=extension.js.map