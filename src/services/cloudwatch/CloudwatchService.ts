import * as vscode from 'vscode';
import { IService } from '../IService';
import { CloudWatchTreeView } from './cloudwatch/CloudWatchTreeView';
import { CloudWatchTreeItem } from './cloudwatch/CloudWatchTreeItem';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';

export class CloudwatchService implements IService {
    public serviceId = 'cloudwatch';
    public treeView: CloudWatchTreeView;

    constructor(context: vscode.ExtensionContext) {
        this.treeView = new CloudWatchTreeView(context);
    }

    registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider): void {
        // Commands are registered by the internal activate() or we can add them here
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const nodes = this.treeView.treeDataProvider.GetRegionNodes();
        return nodes.map(n => this.mapToWorkbenchItem(n));
    }

    private mapToWorkbenchItem(n: any): WorkbenchTreeItem {
        return new WorkbenchTreeItem(
            typeof n.label === 'string' ? n.label : (n.label as any)?.label || '',
            n.collapsibleState || vscode.TreeItemCollapsibleState.None,
            this.serviceId,
            n.contextValue,
            n
        );
    }

    async getChildren(element?: WorkbenchTreeItem): Promise<WorkbenchTreeItem[]> {
        if (!element) {
            return this.getRootNodes();
        }

        const internalItem = element.itemData;
        if (!internalItem) return [];

        const children = await this.treeView.treeDataProvider.getChildren(internalItem);
        return (children || []).map((child: any) => this.mapToWorkbenchItem(child));
    }

    async getTreeItem(element: WorkbenchTreeItem): Promise<vscode.TreeItem> {
        return element.itemData as vscode.TreeItem;
    }

    async addResource(): Promise<void> {
        await this.treeView.AddLogGroup();
    }
}
