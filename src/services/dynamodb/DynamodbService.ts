import * as vscode from 'vscode';
import { IService } from '../IService';
import { DynamodbTreeDataProvider } from './dynamodb/DynamodbTreeDataProvider';
import { DynamodbTreeItem, TreeItemType } from './dynamodb/DynamodbTreeItem';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import * as ui from '../../common/UI';
import * as api from './common/API';

export class DynamodbService implements IService {
    public static Instance: DynamodbService;
    public serviceId = 'dynamodb';
    public treeDataProvider: DynamodbTreeDataProvider;
    public context: vscode.ExtensionContext;
    
    public FilterString: string = "";
    public isShowOnlyFavorite: boolean = false;
    public isShowHiddenNodes: boolean = false;
    public AwsProfile: string = "default";	
    public AwsEndPoint: string | undefined;

    public DynamodbList: {Region: string, Dynamodb: string}[] = [];

    constructor(context: vscode.ExtensionContext) {
        DynamodbService.Instance = this;
        this.context = context;
        this.treeDataProvider = new DynamodbTreeDataProvider();
        this.LoadState();
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
            vscode.commands.registerCommand('DynamodbTreeView.Refresh', () => {
                this.Refresh();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('DynamodbTreeView.Filter', async () => {
                await this.Filter();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('DynamodbTreeView.ShowOnlyFavorite', async () => {
                await this.ShowOnlyFavorite();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('DynamodbTreeView.ShowHiddenNodes', async () => {
                await this.ShowHiddenNodes();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('DynamodbTreeView.AddToFav', (node: any) => {
                this.AddToFav(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('DynamodbTreeView.DeleteFromFav', (node: any) => {
                this.DeleteFromFav(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('DynamodbTreeView.HideNode', (node: any) => {
                this.HideNode(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('DynamodbTreeView.UnHideNode', (node: any) => {
                this.UnHideNode(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('DynamodbTreeView.AddDynamodb', async () => {
                await this.AddDynamodb();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('DynamodbTreeView.RemoveDynamodb', async (node: any) => {
                await this.RemoveDynamodb(wrap(node));
                treeProvider.refresh();
            })
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const nodes = this.treeDataProvider.GetDynamodbNodes();
        return nodes.map(n => this.mapToWorkbenchItem(n));
    }

    public mapToWorkbenchItem(n: any): WorkbenchTreeItem {
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

        const children = await this.treeDataProvider.getChildren(internalItem);
        return (children || []).map((child: any) => this.mapToWorkbenchItem(child));
    }

    async getTreeItem(element: WorkbenchTreeItem): Promise<vscode.TreeItem> {
        return element.itemData as vscode.TreeItem;
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
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }

    async RemoveDynamodb(node: DynamodbTreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.Dynamodb || !node.Region || !node.Dynamodb) { return; }
        this.treeDataProvider.RemoveDynamodb(node.Region, node.Dynamodb);
        this.SaveState();
    }

    async Filter() {
        let filterStringTemp = await vscode.window.showInputBox({ value: this.FilterString, placeHolder: 'Enter Your Filter Text' });
        if (filterStringTemp === undefined) { return; }
        this.FilterString = filterStringTemp;
        this.treeDataProvider.Refresh();
        this.SaveState();
    }

    async ShowOnlyFavorite() {
        this.isShowOnlyFavorite = !this.isShowOnlyFavorite;
        this.treeDataProvider.Refresh();
        this.SaveState();
    }

    async ShowHiddenNodes() {
        this.isShowHiddenNodes = !this.isShowHiddenNodes;
        this.treeDataProvider.Refresh();
        this.SaveState();
    }

    async AddToFav(node: DynamodbTreeItem) {
        if (!node) return;
        node.IsFav = true;
        this.treeDataProvider.Refresh();
    }

    async DeleteFromFav(node: DynamodbTreeItem) {
        if (!node) return;
        node.IsFav = false;
        this.treeDataProvider.Refresh();
    }

    async HideNode(node: DynamodbTreeItem) {
        if (!node) return;
        node.IsHidden = true;
        this.treeDataProvider.Refresh();
    }

    async UnHideNode(node: DynamodbTreeItem) {
        if (!node) return;
        node.IsHidden = false;
        this.treeDataProvider.Refresh();
    }

    LoadState() {
        try {
            this.AwsProfile = this.context.globalState.get('AwsProfile', 'default');
            this.FilterString = this.context.globalState.get('FilterString', '');
            this.isShowOnlyFavorite = this.context.globalState.get('ShowOnlyFavorite', false);
            this.isShowHiddenNodes = this.context.globalState.get('ShowHiddenNodes', false);
            this.DynamodbList = this.context.globalState.get('DynamodbList', []);
        } catch (error) {
            ui.logToOutput("DynamodbService.loadState Error !!!");
        }
    }

    SaveState() {
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('DynamodbList', this.DynamodbList);
        } catch (error) {
            ui.logToOutput("DynamodbService.saveState Error !!!");
        }
    }
}
