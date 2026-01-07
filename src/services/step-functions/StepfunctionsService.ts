import * as vscode from 'vscode';
import { IService } from '../IService';
import { StepFuncTreeView } from './step/StepFuncTreeView';
import { StepFuncTreeItem } from './step/StepFuncTreeItem';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';

export class StepfunctionsService implements IService {
    public serviceId = 'stepfunctions';
    public treeView: StepFuncTreeView;

    constructor(context: vscode.ExtensionContext) {
        this.treeView = new StepFuncTreeView(context);
    }

    registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider): void {
        // Commands are registered by the internal activate()
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        return [];
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
    }
}
