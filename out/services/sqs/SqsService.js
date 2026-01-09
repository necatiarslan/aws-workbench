"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqsService = void 0;
const vscode = require("vscode");
const AbstractAwsService_1 = require("../AbstractAwsService");
const SqsTreeDataProvider_1 = require("./SqsTreeDataProvider");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const ui = require("../../common/UI");
const api = require("./API");
class SqsService extends AbstractAwsService_1.AbstractAwsService {
    static Instance;
    serviceId = 'sqs';
    treeDataProvider;
    context;
    QueueList = [];
    MessageFilePathList = [];
    constructor(context) {
        super();
        SqsService.Instance = this;
        this.context = context;
        this.loadBaseState();
        this.treeDataProvider = new SqsTreeDataProvider_1.SqsTreeDataProvider();
        this.Refresh();
    }
    registerCommands(context, treeProvider, treeView) {
        const wrap = (node) => {
            if (node instanceof WorkbenchTreeItem_1.WorkbenchTreeItem) {
                return node.itemData;
            }
            return node;
        };
        context.subscriptions.push(vscode.commands.registerCommand('aws-workbench.sqs.Refresh', () => {
            this.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.sqs.AddQueue', async () => {
            await this.AddQueue();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.sqs.RemoveQueue', async (node) => {
            await this.RemoveQueue(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.sqs.PurgeQueue', async (node) => {
            await this.PurgeQueue(wrap(node));
        }), vscode.commands.registerCommand('aws-workbench.sqs.SendMessage', async (node) => {
            await this.SendMessage(wrap(node));
        }), vscode.commands.registerCommand('aws-workbench.sqs.ReceiveMessage', async (node) => {
            await this.ReceiveMessage(wrap(node));
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.sqs.DeleteMessage', async (node) => {
            await this.DeleteMessage(wrap(node));
            treeProvider.refresh();
        }));
    }
    async getRootNodes() {
        const nodes = this.treeDataProvider.GetSqsNodes();
        const items = nodes.map(n => this.mapToWorkbenchItem(n));
        return this.processNodes(items);
    }
    mapToWorkbenchItem(n) {
        const item = new WorkbenchTreeItem_1.WorkbenchTreeItem(typeof n.label === 'string' ? n.label : n.label?.label || '', n.collapsibleState || vscode.TreeItemCollapsibleState.None, this.serviceId, n.contextValue, n);
        if (!item.id) {
            if (n.QueueArn) {
                item.id = n.QueueArn;
            }
            else if (n.MessageId) {
                item.id = n.MessageId;
            }
            else if (n.Region && n.QueueName) {
                item.id = `${n.Region}:${n.QueueName}:${n.TreeItemType ?? ''}`;
            }
            else if (n.Region) {
                item.id = n.Region;
            }
        }
        if (n.iconPath) {
            item.iconPath = n.iconPath;
        }
        if (n.description) {
            item.description = n.description;
        }
        if (n.tooltip) {
            item.tooltip = n.tooltip;
        }
        if (n.command) {
            item.command = n.command;
        }
        if (n.resourceUri) {
            item.resourceUri = n.resourceUri;
        }
        return item;
    }
    async getChildren(element) {
        if (!element) {
            return this.getRootNodes();
        }
        const internalItem = element.itemData;
        if (!internalItem)
            return [];
        const children = await this.treeDataProvider.getChildren(internalItem);
        const items = (children || []).map((child) => this.mapToWorkbenchItem(child));
        return this.processNodes(items);
    }
    async getTreeItem(element) {
        return element;
    }
    async addResource() {
        return await this.AddQueue();
    }
    Refresh() {
        this.treeDataProvider.Refresh();
    }
    async AddQueue() {
        ui.logToOutput('SqsService.AddQueue Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        let selectedQueueName = await vscode.window.showInputBox({ placeHolder: 'Enter Queue Name / Search Text' });
        if (selectedQueueName === undefined) {
            return;
        }
        var resultQueue = await api.GetSqsQueueList(selectedRegion, selectedQueueName);
        if (!resultQueue.isSuccessful) {
            return;
        }
        let selectedQueueList = await vscode.window.showQuickPick(resultQueue.result, { canPickMany: true, placeHolder: 'Select Queue(s)' });
        if (!selectedQueueList || selectedQueueList.length === 0) {
            return;
        }
        let lastAddedItem;
        for (var selectedQueue of selectedQueueList) {
            lastAddedItem = this.treeDataProvider.AddQueue(selectedRegion, selectedQueue);
        }
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }
    async RemoveQueue(node) {
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.SQSQueue || !node.Region || !node.QueueArn) {
            return;
        }
        this.treeDataProvider.RemoveQueue(node.Region, node.QueueArn);
    }
    async PurgeQueue(node) {
        if (!node || !node.Region || !node.QueueArn)
            return;
        ui.logToOutput('SqsService.PurgeQueue Started');
        let result = await api.PurgeQueue(node.Region, node.QueueArn);
        if (result.isSuccessful) {
            ui.showInfoMessage('Queue Purged Successfully');
        }
    }
    async SendMessage(node) {
        if (!node || !node.Region || !node.QueueArn)
            return;
        ui.logToOutput('SqsService.SendMessage Started');
        let message = await vscode.window.showInputBox({ placeHolder: 'Enter Message Body' });
        if (message === undefined)
            return;
        let result = await api.SendMessage(node.Region, node.QueueArn, message);
        if (result.isSuccessful) {
            ui.showInfoMessage('Message Sent Successfully');
        }
    }
    async ReceiveMessage(node) {
        if (!node || !node.Region || !node.QueueArn)
            return;
        ui.logToOutput('SqsService.ReceiveMessage Started');
        let result = await api.ReceiveMessage(node.Region, node.QueueArn);
        if (result.isSuccessful && result.result) {
            const messages = result.result.Messages || [];
            if (messages.length === 0) {
                ui.showInfoMessage('No Messages Found');
            }
            else {
                for (let msg of messages) {
                    this.treeDataProvider.AddNewReceivedMessageNode(node, node.Region, node.QueueArn, msg);
                }
            }
        }
    }
    async DeleteMessage(node) {
        if (!node || !node.Region || !node.QueueArn || !node.ReceiptHandle)
            return;
        ui.logToOutput('SqsService.DeleteMessage Started');
        let result = await api.DeleteMessage(node.Region, node.QueueArn, node.ReceiptHandle);
        if (result.isSuccessful) {
            ui.showInfoMessage('Message Deleted Successfully');
        }
    }
    addToFav(node) {
        const data = node.itemData;
        if (data) {
            data.IsFav = true;
            data.setContextValue();
        }
        super.addToFav(node);
    }
    deleteFromFav(node) {
        const data = node.itemData;
        if (data) {
            data.IsFav = false;
            data.setContextValue();
        }
        super.deleteFromFav(node);
    }
    hideResource(node) {
        const data = node.itemData;
        if (data) {
            data.IsHidden = true;
            data.setContextValue();
        }
        super.hideResource(node);
    }
    unhideResource(node) {
        const data = node.itemData;
        if (data) {
            data.IsHidden = false;
            data.setContextValue();
        }
        super.unhideResource(node);
    }
    showOnlyInProfile(node, profile) {
        const data = node.itemData;
        if (data) {
            data.ProfileToShow = profile;
            data.setContextValue();
        }
        super.showOnlyInProfile(node, profile);
    }
    showInAnyProfile(node) {
        const data = node.itemData;
        if (data) {
            data.ProfileToShow = "";
            data.setContextValue();
        }
        super.showInAnyProfile(node);
    }
}
exports.SqsService = SqsService;
//# sourceMappingURL=SqsService.js.map