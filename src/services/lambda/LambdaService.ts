import * as vscode from 'vscode';
import { IService } from '../IService';
import { LambdaTreeView } from './lambda/LambdaTreeView';
import { LambdaTreeItem, TreeItemType } from './lambda/LambdaTreeItem';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';

export class LambdaService implements IService {
    public serviceId = 'lambda';
    public lambdaTreeView: LambdaTreeView;

    constructor(context: vscode.ExtensionContext) {
        this.lambdaTreeView = new LambdaTreeView(context);
    }

    registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider): void {
        context.subscriptions.push(
            vscode.commands.registerCommand('LambdaTreeView.Refresh', () => {
                this.lambdaTreeView.Refresh();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('LambdaTreeView.AddLambda', async () => {
                await this.lambdaTreeView.AddLambda();
                treeProvider.refresh();
            })
            // Add other commands as needed...
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const lambdas = await this.lambdaTreeView.treeDataProvider.GetLambdaNodes();
        return lambdas.map(l => new WorkbenchTreeItem(
            typeof l.label === 'string' ? l.label : l.label?.label || '',
            vscode.TreeItemCollapsibleState.Collapsed,
            this.serviceId,
            l.contextValue,
            l
        ));
    }

    async getChildren(element?: WorkbenchTreeItem): Promise<WorkbenchTreeItem[]> {
        if (!element) {
            return this.getRootNodes();
        }

        const lambdaItem = element.itemData as LambdaTreeItem;
        if (!lambdaItem) return [];

        const children = await this.lambdaTreeView.treeDataProvider.getChildren(lambdaItem);
        return children.map(child => new WorkbenchTreeItem(
            typeof child.label === 'string' ? child.label : child.label?.label || '',
            child.collapsibleState || vscode.TreeItemCollapsibleState.None,
            this.serviceId,
            child.contextValue,
            child
        ));
    }

    async getTreeItem(element: WorkbenchTreeItem): Promise<vscode.TreeItem> {
        return element.itemData as LambdaTreeItem;
    }

    async addResource(): Promise<void> {
        await this.lambdaTreeView.AddLambda();
    }
}
