import * as vscode from 'vscode';
import { WorkbenchTreeItem } from './WorkbenchTreeItem';
import { Session } from '../common/Session';

export class WorkbenchTreeProvider implements vscode.TreeDataProvider<WorkbenchTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<WorkbenchTreeItem | undefined | null | void> = new vscode.EventEmitter<WorkbenchTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<WorkbenchTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private folderFilter?: string;
    private resourceNameFilter?: string;

    constructor(private context: vscode.ExtensionContext) {
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public setFolderFilter(folderId?: string): void {
        this.folderFilter = folderId;
        if (Session.Current) {
            Session.Current.folderFilter = folderId;
            Session.Current.SaveState();
        }
        this.refresh();
    }

    public setResourceNameFilter(pattern?: string): void {
        this.resourceNameFilter = pattern;
        if (Session.Current) {
            Session.Current.resourceNameFilter = pattern;
            Session.Current.SaveState();
        }
        this.refresh();
    }

    public clearFilters(): void {
        this.folderFilter = undefined;
        this.resourceNameFilter = undefined;
        if (Session.Current) {
            Session.Current.folderFilter = undefined;
            Session.Current.resourceNameFilter = undefined;
            Session.Current.SaveState();
        }
        this.refresh();
    }

    public getTreeItem(element: WorkbenchTreeItem): vscode.TreeItem | Promise<vscode.TreeItem> {

        return element;
    }

    public async getChildren(element?: WorkbenchTreeItem): Promise<WorkbenchTreeItem[]> {
        // If no element is provided, return root-level folders and resources
        const result: WorkbenchTreeItem[] = [];
        return result;
    }


}
