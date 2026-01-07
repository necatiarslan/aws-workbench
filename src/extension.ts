import * as vscode from 'vscode';
import * as s3_ext from './services/s3/extension';
import * as lambda_ext from './services/lambda/extension';
import * as cloudwatch_ext from './services/cloudwatch/extension';
import * as access_ext from './services/access/extension';
import * as dynamodb_ext from './services/dynamodb/extension';
import * as glue_ext from './services/glue/extension';
import * as iam_ext from './services/iam/extension';
import * as sns_ext from './services/sns/extension';
import * as sqs_ext from './services/sqs/extension';
import * as step_ext from './services/step-functions/extension';

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
        const treeProvider = new WorkbenchTreeProvider(context);
        vscode.window.registerTreeDataProvider('AwsWorkbenchTree', treeProvider);

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

        console.log('All AWS services activated successfully.');
    } catch (error) {
        console.error('Error activating AWS Workbench services:', error);
    }
}

/**
 * Deactivates the extension.
 */
export function deactivate(): void {
    // Call deactivate for each service if they export it
    try {
        if ((s3_ext as any).deactivate) (s3_ext as any).deactivate();
        if ((lambda_ext as any).deactivate) (lambda_ext as any).deactivate();
        if ((cloudwatch_ext as any).deactivate) (cloudwatch_ext as any).deactivate();
        if ((access_ext as any).deactivate) (access_ext as any).deactivate();
        if ((dynamodb_ext as any).deactivate) (dynamodb_ext as any).deactivate();
        if ((glue_ext as any).deactivate) (glue_ext as any).deactivate();
        if ((iam_ext as any).deactivate) (iam_ext as any).deactivate();
        if ((sns_ext as any).deactivate) (sns_ext as any).deactivate();
        if ((sqs_ext as any).deactivate) (sqs_ext as any).deactivate();
        if ((step_ext as any).deactivate) (step_ext as any).deactivate();
    } catch (error) {
        console.error('Error deactivating AWS Workbench services:', error);
    }
}
