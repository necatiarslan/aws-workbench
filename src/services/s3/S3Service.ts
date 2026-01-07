import * as vscode from 'vscode';
import { IService } from '../IService';
import { S3TreeView } from './s3/S3TreeView';
import { S3TreeItem, TreeItemType } from './s3/S3TreeItem';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';

export class S3Service implements IService {
    public serviceId = 's3';
    public s3TreeView: S3TreeView;

    constructor(context: vscode.ExtensionContext) {
        this.s3TreeView = new S3TreeView(context);
    }

    registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider): void {
        // Register all S3 commands here, delegating to this.s3TreeView
        // Note: For now we keep the same command IDs as in package.json
        
        context.subscriptions.push(
            vscode.commands.registerCommand('S3TreeView.Refresh', () => {
                this.s3TreeView.Refresh();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('S3TreeView.AddBucket', async () => {
                await this.s3TreeView.AddBucket();
                treeProvider.refresh();
            })
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const buckets = await this.s3TreeView.treeDataProvider.GetBucketNodes();
        return buckets.map(b => new WorkbenchTreeItem(
            typeof b.label === 'string' ? b.label : b.label?.label || '',
            vscode.TreeItemCollapsibleState.Collapsed,
            this.serviceId,
            b.contextValue,
            b
        ));
    }

    async getChildren(element?: WorkbenchTreeItem): Promise<WorkbenchTreeItem[]> {
        if (!element) {
             return this.getRootNodes();
        }

        // Map WorkbenchTreeItem to S3TreeItem if needed, or just use itemData
        let s3Item: S3TreeItem | undefined;
        if (element.itemData instanceof S3TreeItem) {
            s3Item = element.itemData;
        } else {
            // Reconstruct S3TreeItem from element.itemData
            s3Item = element.itemData; 
        }

        if (!s3Item) return [];

        const children = await this.s3TreeView.treeDataProvider.getChildren(s3Item);
        return children.map(child => new WorkbenchTreeItem(
            typeof child.label === 'string' ? child.label : child.label?.label || '',
            child.collapsibleState || vscode.TreeItemCollapsibleState.None,
            this.serviceId,
            child.contextValue,
            child
        ));
    }

    async getTreeItem(element: WorkbenchTreeItem): Promise<vscode.TreeItem> {
        const s3Item = element.itemData as S3TreeItem;
        return s3Item;
    }

    async addResource(): Promise<void> {
        await this.s3TreeView.AddBucket();
    }
}
