"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceHub = void 0;
const FileSystemService_1 = require("../filesystem/FileSystemService");
const S3Service_1 = require("../s3/S3Service");
const CloudWatchLogService_1 = require("../cloudwatch-logs/CloudWatchLogService");
const LambdaService_1 = require("../lambda/LambdaService");
const VscodeService_1 = require("../vscode/VscodeService");
const StepFunctionsService_1 = require("../step-functions/StepFunctionsService");
class ServiceHub {
    static Current;
    Context;
    FileSystemService = new FileSystemService_1.FileSystemService();
    S3Service = new S3Service_1.S3Service();
    CloudWatchLogService = new CloudWatchLogService_1.CloudWatchLogService();
    LambdaService = new LambdaService_1.LambdaService();
    VscodeService = new VscodeService_1.VscodeService();
    StepFunctionsService = new StepFunctionsService_1.StepFunctionsService();
    constructor(context) {
        this.Context = context;
        ServiceHub.Current = this;
    }
}
exports.ServiceHub = ServiceHub;
//# sourceMappingURL=ServiceHub.js.map