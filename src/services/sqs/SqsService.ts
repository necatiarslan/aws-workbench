import * as vscode from 'vscode';
import { IService } from '../IService';
import { SqsTreeDataProvider } from './sqs/SqsTreeDataProvider';
import { SqsTreeItem, TreeItemType } from './sqs/SqsTreeItem';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import * as ui from './common/UI';
import * as api from './common/API';

export class SqsService implements IService {
    public static Instance: SqsService;
    public serviceId = 'sqs';
    public treeDataProvider: SqsTreeDataProvider;
    public context: vscode.ExtensionContext;
    
    public FilterString: string = "";
    public isShowOnlyFavorite: boolean = false;
    public isShowHiddenNodes: boolean = false;
    public AwsProfile: string = "default";	
    public AwsEndPoint: string | undefined;

    public QueueList: {Region: string, QueueArn: string}[] = [];
    public MessageFilePathList: {Region: string, QueueArn: string, MessageFilePath: string}[] = [];

    constructor(context: vscode.ExtensionContext) {
        SqsService.Instance = this;
        this.context = context;
        this.treeDataProvider = new SqsTreeDataProvider();
        this.LoadState();
        this.Refresh();
    }

    registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider, treeView: vscode.TreeView<WorkbenchTreeItem>): void {
        const wrap = (node: any) => {
            if (node instanceof WorkbenchTreeItem) {
                return node.itemData as SqsTreeItem;
            }
            return node as SqsTreeItem;
        };

        context.subscriptions.push(
            vscode.commands.registerCommand('SqsTreeView.Refresh', () => {
                this.Refresh();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('SqsTreeView.Filter', async () => {
                await this.Filter();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('SqsTreeView.ShowOnlyFavorite', async () => {
                await this.ShowOnlyFavorite();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('SqsTreeView.ShowHiddenNodes', async () => {
                await this.ShowHiddenNodes();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('SqsTreeView.AddToFav', (node: any) => {
                this.AddToFav(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('SqsTreeView.DeleteFromFav', (node: any) => {
                this.DeleteFromFav(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('SqsTreeView.HideNode', (node: any) => {
                this.HideNode(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('SqsTreeView.UnHideNode', (node: any) => {
                this.UnHideNode(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('SqsTreeView.AddQueue', async () => {
                await this.AddQueue();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('SqsTreeView.RemoveQueue', async (node: any) => {
                await this.RemoveQueue(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('SqsTreeView.PurgeQueue', async (node: any) => {
                await this.PurgeQueue(wrap(node));
            }),
            vscode.commands.registerCommand('SqsTreeView.SendMessage', async (node: any) => {
                await this.SendMessage(wrap(node));
            }),
            vscode.commands.registerCommand('SqsTreeView.ReceiveMessage', async (node: any) => {
                await this.ReceiveMessage(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('SqsTreeView.DeleteMessage', async (node: any) => {
                await this.DeleteMessage(wrap(node));
                treeProvider.refresh();
            })
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const nodes = this.treeDataProvider.GetSqsNodes();
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
        return await this.AddQueue();
    }

    Refresh() {
        this.treeDataProvider.Refresh();
    }

    async AddQueue(): Promise<WorkbenchTreeItem | undefined> {
        ui.logToOutput('SqsService.AddQueue Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) { return; }
        let selectedQueueName = await vscode.window.showInputBox({ placeHolder: 'Enter Queue Name / Search Text' });
        if (selectedQueueName === undefined) { return; }
        var resultQueue = await api.GetSqsQueueList(selectedRegion, selectedQueueName);
        if (!resultQueue.isSuccessful) { return; }
        let selectedQueueList = await vscode.window.showQuickPick(resultQueue.result, { canPickMany: true, placeHolder: 'Select Queue(s)' });
        if (!selectedQueueList || selectedQueueList.length === 0) { return; }
        
        let lastAddedItem: SqsTreeItem | undefined;
        for (var selectedQueue of selectedQueueList) {
            lastAddedItem = this.treeDataProvider.AddQueue(selectedRegion, selectedQueue);
        }
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }

    async RemoveQueue(node: SqsTreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.Queue || !node.Region || !node.QueueArn) { return; }
        this.treeDataProvider.RemoveQueue(node.Region, node.QueueArn);
        this.SaveState();
    }

    async PurgeQueue(node: SqsTreeItem) {
        if (!node || !node.Region || !node.QueueArn) return;
        ui.logToOutput('SqsService.PurgeQueue Started');
        let result = await api.PurgeQueue(node.Region, node.QueueArn);
        if (result.isSuccessful) {
            ui.showInfoMessage('Queue Purged Successfully');
        }
    }

    async SendMessage(node: SqsTreeItem) {
        if (!node || !node.Region || !node.QueueArn) return;
        ui.logToOutput('SqsService.SendMessage Started');
        let message = await vscode.window.showInputBox({ placeHolder: 'Enter Message Body' });
        if (message === undefined) return;
        let result = await api.SendMessage(node.Region, node.QueueArn, message);
        if (result.isSuccessful) {
            ui.showInfoMessage('Message Sent Successfully');
        }
    }

    async ReceiveMessage(node: SqsTreeItem) {
        if (!node || !node.Region || !node.QueueArn) return;
        ui.logToOutput('SqsService.ReceiveMessage Started');
        let result = await api.ReceiveMessage(node.Region, node.QueueArn);
        if (result.isSuccessful && result.result) {
            const messages = result.result.Messages || [];
            if (messages.length === 0) {
                ui.showInfoMessage('No Messages Found');
            } else {
                for (let msg of messages) {
                    this.treeDataProvider.AddNewReceivedMessageNode(node, node.Region, node.QueueArn, msg);
                }
            }
        }
    }

    async DeleteMessage(node: SqsTreeItem) {
        if (!node || !node.Region || !node.QueueArn || !node.ReceiptHandle) return;
        ui.logToOutput('SqsService.DeleteMessage Started');
        let result = await api.DeleteMessage(node.Region, node.QueueArn, node.ReceiptHandle);
        if (result.isSuccessful) {
            ui.showInfoMessage('Message Deleted Successfully');
        }
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

    async AddToFav(node: SqsTreeItem) {
        if (!node) return;
        node.IsFav = true;
        this.treeDataProvider.Refresh();
    }

    async DeleteFromFav(node: SqsTreeItem) {
        if (!node) return;
        node.IsFav = false;
        this.treeDataProvider.Refresh();
    }

    async HideNode(node: SqsTreeItem) {
        if (!node) return;
        node.IsHidden = true;
        this.treeDataProvider.Refresh();
    }

    async UnHideNode(node: SqsTreeItem) {
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
            this.QueueList = this.context.globalState.get('QueueList', []);
            this.MessageFilePathList = this.context.globalState.get('MessageFilePathList', []);
        } catch (error) {
            ui.logToOutput("SqsService.loadState Error !!!");
        }
    }

    SaveState() {
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('QueueList', this.QueueList);
            this.context.globalState.update('MessageFilePathList', this.MessageFilePathList);
        } catch (error) {
            ui.logToOutput("SqsService.saveState Error !!!");
        }
    }
}
