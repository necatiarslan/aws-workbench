import * as vscode from 'vscode';
import { FileSystemService } from "../filesystem/FileSystemService";
import { S3Service } from "../s3/S3Service";
import { CloudWatchLogService } from '../cloudwatch-logs/CloudWatchLogService';
import { LambdaService } from '../lambda/LambdaService';
import { VscodeService } from '../vscode/VscodeService';
import { StepFunctionsService } from '../step-functions/StepFunctionsService';
import { GlueService } from '../glue/GlueService';
import { DynamoDBService } from '../dynamodb/DynamoDBService';

export class ServiceHub {
    public static Current: ServiceHub;
    public Context: vscode.ExtensionContext;
    public FileSystemService: FileSystemService = new FileSystemService();
    public S3Service: S3Service = new S3Service();
    public CloudWatchLogService: CloudWatchLogService = new CloudWatchLogService();
    public LambdaService: LambdaService = new LambdaService();
    public VscodeService: VscodeService = new VscodeService();
    public StepFunctionsService: StepFunctionsService = new StepFunctionsService();
    public GlueService: GlueService = new GlueService();
    public DynamoDBService: DynamoDBService = new DynamoDBService();
    
    public constructor(context: vscode.ExtensionContext) {
        this.Context = context;
        ServiceHub.Current = this;
    }

}