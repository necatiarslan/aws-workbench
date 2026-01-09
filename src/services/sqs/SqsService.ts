import * as vscode from 'vscode';
import { AbstractAwsService } from '../AbstractAwsService';
import { Session } from '../../common/Session';
import { SqsTreeDataProvider } from './SqsTreeDataProvider';
import { SqsTreeItem } from './SqsTreeItem';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import * as ui from '../../common/UI';
import * as api from './API';

export class SqsService extends AbstractAwsService {
    public static Instance: SqsService;
    public serviceId = 'sqs';
    public treeDataProvider: SqsTreeDataProvider;
    public context: vscode.ExtensionContext;

    public QueueList: {Region: string, QueueArn: string}[] = [];
    public MessageFilePathList: {Region: string, QueueArn: string, MessageFilePath: string}[] = [];

    constructor(context: vscode.ExtensionContext) {
        super();
        SqsService.Instance = this;
        this.context = context;
        this.loadBaseState();
        this.treeDataProvider = new SqsTreeDataProvider();
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
            vscode.commands.registerCommand('aws-workbench.sqs.Refresh', () => {
                this.Refresh();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.sqs.AddQueue', async () => {
                await this.AddQueue();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.sqs.RemoveQueue', async (node: any) => {
                await this.RemoveQueue(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.sqs.PurgeQueue', async (node: any) => {
                await this.PurgeQueue(wrap(node));
            }),
            vscode.commands.registerCommand('aws-workbench.sqs.SendMessage', async (node: any) => {
                await this.SendMessage(wrap(node));
            }),
            vscode.commands.registerCommand('aws-workbench.sqs.ReceiveMessage', async (node: any) => {
                await this.ReceiveMessage(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.sqs.DeleteMessage', async (node: any) => {
                await this.DeleteMessage(wrap(node));
                treeProvider.refresh();
            })
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const nodes = this.treeDataProvider.GetSqsNodes();
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
            if (n.QueueArn) {
                item.id = n.QueueArn;
            } else if (n.MessageId) {
                item.id = n.MessageId;
            } else if (n.Region && n.QueueName) {
                item.id = `${n.Region}:${n.QueueName}:${n.TreeItemType ?? ''}`;
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
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }

    async RemoveQueue(node: SqsTreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.SQSQueue || !node.Region || !node.QueueArn) { return; }
        this.treeDataProvider.RemoveQueue(node.Region, node.QueueArn);
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

    public override addToFav(node: WorkbenchTreeItem) {
        const data = node.itemData as SqsTreeItem | undefined;
        if (data) { data.IsFav = true; data.setContextValue(); }
        super.addToFav(node);
    }

    public override deleteFromFav(node: WorkbenchTreeItem) {
        const data = node.itemData as SqsTreeItem | undefined;
        if (data) { data.IsFav = false; data.setContextValue(); }
        super.deleteFromFav(node);
    }

    public override hideResource(node: WorkbenchTreeItem) {
        const data = node.itemData as SqsTreeItem | undefined;
        if (data) { data.IsHidden = true; data.setContextValue(); }
        super.hideResource(node);
    }

    public override unhideResource(node: WorkbenchTreeItem) {
        const data = node.itemData as SqsTreeItem | undefined;
        if (data) { data.IsHidden = false; data.setContextValue(); }
        super.unhideResource(node);
    }

    public override showOnlyInProfile(node: WorkbenchTreeItem, profile: string) {
        const data = node.itemData as SqsTreeItem | undefined;
        if (data) { data.ProfileToShow = profile; data.setContextValue(); }
        super.showOnlyInProfile(node, profile);
    }

    public override showInAnyProfile(node: WorkbenchTreeItem) {
        const data = node.itemData as SqsTreeItem | undefined;
        if (data) { data.ProfileToShow = ""; data.setContextValue(); }
        super.showInAnyProfile(node);
    }
}
