import * as vscode from 'vscode';

export interface IService {
    serviceId: string;
    registerCommands(context: vscode.ExtensionContext, treeProvider: any): void;
    getRootNodes(): Promise<any[]>;
    getChildren(element?: any): Promise<any[]>;
    getTreeItem(element: any): vscode.TreeItem | Promise<vscode.TreeItem>;
    addResource(): Promise<void>;
}
