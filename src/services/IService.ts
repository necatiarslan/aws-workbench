import * as vscode from 'vscode';
import { WorkbenchTreeItem } from '../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../tree/WorkbenchTreeProvider';

export interface IService {
    serviceId: string;
    registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider, treeView: vscode.TreeView<WorkbenchTreeItem>): void;
    getRootNodes(): Promise<WorkbenchTreeItem[]>;
    getChildren(element?: WorkbenchTreeItem): Promise<WorkbenchTreeItem[]>;
    getTreeItem(element: WorkbenchTreeItem): vscode.TreeItem | Promise<vscode.TreeItem>;
    addResource(): Promise<WorkbenchTreeItem | undefined>;
}
