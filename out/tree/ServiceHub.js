"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceHub = void 0;
const FileSystemService_1 = require("../filesystem/FileSystemService");
const S3Service_1 = require("../s3/S3Service");
const CloudWatchLogService_1 = require("../cloudwatch-logs/CloudWatchLogService");
const LambdaService_1 = require("../lambda/LambdaService");
class ServiceHub {
    static Current;
    Context;
    FileSystemService = new FileSystemService_1.FileSystemService();
    S3Service = new S3Service_1.S3Service();
    CloudWatchLogService = new CloudWatchLogService_1.CloudWatchLogService();
    LambdaService = new LambdaService_1.LambdaService();
    constructor(context) {
        this.Context = context;
        ServiceHub.Current = this;
        this.LoadNodesState();
    }
    async SaveNodesState() {
        // this.Context.globalState.update('Nodes', NodeBase.RootNodes);
    }
    LoadNodesState() {
        // const nodes: NodeBase[] | undefined = this.Context.globalState.get('Nodes');
        // // if (nodes) {
        // //     NodeBase.RootNodes = nodes;
        // // }
    }
}
exports.ServiceHub = ServiceHub;
//# sourceMappingURL=ServiceHub.js.map