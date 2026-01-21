import * as vscode from 'vscode';
import { FileSystemService } from "../filesystem/FileSystemService";
import { S3Service } from "../s3/S3Service";

export class ServiceHub {
    public static Current: ServiceHub;
    public Context: vscode.ExtensionContext;
    public FileSystemService: FileSystemService = new FileSystemService();
    public S3Service: S3Service = new S3Service();

    public constructor(context: vscode.ExtensionContext) {
        this.Context = context;
        ServiceHub.Current = this;
        this.LoadNodesState();
    }

    public async SaveNodesState() {
        // this.Context.globalState.update('Nodes', NodeBase.RootNodes);
    }

    public LoadNodesState() {
        // const nodes: NodeBase[] | undefined = this.Context.globalState.get('Nodes');
        // // if (nodes) {
        // //     NodeBase.RootNodes = nodes;
        // // }
    }

}