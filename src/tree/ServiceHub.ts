import * as vscode from 'vscode';
import { FileSystemService } from "../services/filesystem/FileSystemService";
import { NodeBase } from './NodeBase';

export class ServiceHub {
    public static Current: ServiceHub;
    public Context: vscode.ExtensionContext;
    public FileSystemService: FileSystemService = new FileSystemService();

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