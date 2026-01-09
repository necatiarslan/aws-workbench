import * as vscode from 'vscode';
import { AbstractAwsService } from '../AbstractAwsService';
import { Session } from '../../common/Session';
import { DynamodbTreeDataProvider } from './DynamodbTreeDataProvider';
import { DynamodbTreeItem } from './DynamodbTreeItem';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import * as ui from '../../common/UI';
import * as api from './API';

export class DynamodbService extends AbstractAwsService {
    public static Instance: DynamodbService;
    public serviceId = 'dynamodb';
    public treeDataProvider: DynamodbTreeDataProvider;
    public context: vscode.ExtensionContext;

    public DynamodbList: {Region: string, Dynamodb: string}[] = [];

    constructor(context: vscode.ExtensionContext) {
        super();
        DynamodbService.Instance = this;
        this.context = context;
        this.loadBaseState();
        this.treeDataProvider = new DynamodbTreeDataProvider();
        this.Refresh();
    }

    registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider, treeView: vscode.TreeView<WorkbenchTreeItem>): void {
        const wrap = (node: any) => {
            if (node instanceof WorkbenchTreeItem) {
                return node.itemData as DynamodbTreeItem;
            }
            return node as DynamodbTreeItem;
        };

        context.subscriptions.push(
            vscode.commands.registerCommand('aws-workbench.dynamodb.Refresh', () => {
                this.Refresh();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.dynamodb.AddDynamodb', async () => {
                await this.AddDynamodb();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.dynamodb.RemoveDynamodb', async (node: any) => {
                await this.RemoveDynamodb(wrap(node));
                treeProvider.refresh();
            })
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const nodes = this.treeDataProvider.GetDynamodbNodes();
        const items = nodes.map(n => this.mapToWorkbenchItem(n));
        return this.processNodes(items);
    }

    public mapToWorkbenchItem(n: any): WorkbenchTreeItem {
        const item = new WorkbenchTreeItem(
            typeof n.label === 'string' ? n.label : (n.label as any)?.label || '',
            n.collapsibleState || vscode.TreeItemCollapsibleState.None,
            this.serviceId,
            n.contextValue,
            n
        );

        if (!item.id) {
            if (n.Dynamodb && n.Region) {
                item.id = `${n.Region}:${n.Dynamodb}:${n.TreeItemType ?? ''}`;
            } else if (n.Region) {
                item.id = n.Region;
            }
        }

        if (n.iconPath) { item.iconPath = n.iconPath; }
        if (n.description) { item.description = n.description; }
        if (n.tooltip) { item.tooltip = n.tooltip; }
        if (n.command) { item.command = n.command; }
        if (n.resourceUri) { item.resourceUri = n.resourceUri; }

        return item;
    }

    async getChildren(element?: WorkbenchTreeItem): Promise<WorkbenchTreeItem[]> {
        if (!element) {
            return this.getRootNodes();
        }

        const internalItem = element.itemData;
        if (!internalItem) return [];

        const children = await this.treeDataProvider.getChildren(internalItem);
        const items = (children || []).map((child: any) => this.mapToWorkbenchItem(child));
        return this.processNodes(items);
    }

    async getTreeItem(element: WorkbenchTreeItem): Promise<vscode.TreeItem> {
        return element;
    }

    async addResource(): Promise<WorkbenchTreeItem | undefined> {
        return await this.AddDynamodb();
    }

    Refresh() {
        this.treeDataProvider.Refresh();
    }

    async AddDynamodb(): Promise<WorkbenchTreeItem | undefined> {
        ui.logToOutput('DynamodbService.AddDynamodb Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) { return; }
        let selectedTableName = await vscode.window.showInputBox({ placeHolder: 'Enter Table Name / Search Text' });
        if (selectedTableName === undefined) { return; }
        var resultTable = await api.GetDynamodbList(selectedRegion, selectedTableName);
        if (!resultTable.isSuccessful) { return; }
        let selectedTableList = await vscode.window.showQuickPick(resultTable.result, { canPickMany: true, placeHolder: 'Select Table(s)' });
        if (!selectedTableList || selectedTableList.length === 0) { return; }
        
        let lastAddedItem: DynamodbTreeItem | undefined;
        for (var selectedTable of selectedTableList) {
            lastAddedItem = this.treeDataProvider.AddDynamodb(selectedRegion, selectedTable);
        }
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }

    async RemoveDynamodb(node: DynamodbTreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.DynamoDBTable || !node.Region || !node.Dynamodb) { return; }
        this.treeDataProvider.RemoveDynamodb(node.Region, node.Dynamodb);
    }

    public override addToFav(node: WorkbenchTreeItem) {
        const data = node.itemData as DynamodbTreeItem | undefined;
        if (data) { data.IsFav = true; data.setContextValue(); }
        super.addToFav(node);
    }

    public override deleteFromFav(node: WorkbenchTreeItem) {
        const data = node.itemData as DynamodbTreeItem | undefined;
        if (data) { data.IsFav = false; data.setContextValue(); }
        super.deleteFromFav(node);
    }

    public override hideResource(node: WorkbenchTreeItem) {
        const data = node.itemData as DynamodbTreeItem | undefined;
        if (data) { data.IsHidden = true; data.setContextValue(); }
        super.hideResource(node);
    }

    public override unhideResource(node: WorkbenchTreeItem) {
        const data = node.itemData as DynamodbTreeItem | undefined;
        if (data) { data.IsHidden = false; data.setContextValue(); }
        super.unhideResource(node);
    }

    public override showOnlyInProfile(node: WorkbenchTreeItem, profile: string) {
        const data = node.itemData as DynamodbTreeItem | undefined;
        if (data) { data.ProfileToShow = profile; data.setContextValue(); }
        super.showOnlyInProfile(node, profile);
    }

    public override showInAnyProfile(node: WorkbenchTreeItem) {
        const data = node.itemData as DynamodbTreeItem | undefined;
        if (data) { data.ProfileToShow = ""; data.setContextValue(); }
        super.showInAnyProfile(node);
    }
}
