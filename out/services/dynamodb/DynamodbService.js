"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamodbService = void 0;
const vscode = require("vscode");
const AbstractAwsService_1 = require("../AbstractAwsService");
const DynamodbTreeDataProvider_1 = require("./DynamodbTreeDataProvider");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const ui = require("../../common/UI");
const api = require("./API");
class DynamodbService extends AbstractAwsService_1.AbstractAwsService {
    static Instance;
    serviceId = 'dynamodb';
    treeDataProvider;
    context;
    DynamodbList = [];
    constructor(context) {
        super();
        DynamodbService.Instance = this;
        this.context = context;
        this.loadBaseState();
        this.loadCustomResources();
        this.treeDataProvider = new DynamodbTreeDataProvider_1.DynamodbTreeDataProvider();
        this.Refresh();
    }
    registerCommands(context, treeProvider, treeView) {
        const wrap = (node) => {
            if (node instanceof WorkbenchTreeItem_1.WorkbenchTreeItem) {
                return node.itemData;
            }
            return node;
        };
        context.subscriptions.push(vscode.commands.registerCommand('aws-workbench.dynamodb.Refresh', () => {
            this.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.dynamodb.AddDynamodb', async () => {
            await this.AddDynamodb();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.dynamodb.RemoveDynamodb', async (node) => {
            await this.RemoveDynamodb(wrap(node));
            treeProvider.refresh();
        }));
    }
    async getRootNodes() {
        const nodes = this.treeDataProvider.GetDynamodbNodes();
        const items = nodes.map(n => this.mapToWorkbenchItem(n));
        // Add ungrouped custom resources (not in any folder)
        const ungroupedCustomResources = this.getCustomResourcesByFolder(null);
        for (const resource of ungroupedCustomResources) {
            const customItem = new WorkbenchTreeItem_1.WorkbenchTreeItem(this.getDisplayName(resource), vscode.TreeItemCollapsibleState.Collapsed, this.serviceId, 'customResource', resource.resourceData);
            customItem.isCustom = true;
            customItem.compositeKey = resource.compositeKey;
            customItem.displayName = resource.displayName;
            customItem.awsName = resource.awsName;
            items.push(customItem);
        }
        return this.processNodes(items);
    }
    mapToWorkbenchItem(n) {
        const item = new WorkbenchTreeItem_1.WorkbenchTreeItem(typeof n.label === 'string' ? n.label : n.label?.label || '', n.collapsibleState || vscode.TreeItemCollapsibleState.None, this.serviceId, n.contextValue, n);
        if (!item.id) {
            if (n.Dynamodb && n.Region) {
                item.id = `${n.Region}:${n.Dynamodb}:${n.TreeItemType ?? ''}`;
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
        return await this.AddDynamodb();
    }
    Refresh() {
        this.treeDataProvider.Refresh();
    }
    async AddDynamodb() {
        ui.logToOutput('DynamodbService.AddDynamodb Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        let selectedTableName = await vscode.window.showInputBox({ placeHolder: 'Enter Table Name / Search Text' });
        if (selectedTableName === undefined) {
            return;
        }
        var resultTable = await api.GetDynamodbList(selectedRegion, selectedTableName);
        if (!resultTable.isSuccessful) {
            return;
        }
        let selectedTableList = await vscode.window.showQuickPick(resultTable.result, { canPickMany: true, placeHolder: 'Select Table(s)' });
        if (!selectedTableList || selectedTableList.length === 0) {
            return;
        }
        let lastAddedItem;
        for (var selectedTable of selectedTableList) {
            lastAddedItem = this.treeDataProvider.AddDynamodb(selectedRegion, selectedTable);
        }
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }
    async RemoveDynamodb(node) {
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.DynamoDBTable || !node.Region || !node.Dynamodb) {
            return;
        }
        this.treeDataProvider.RemoveDynamodb(node.Region, node.Dynamodb);
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
exports.DynamodbService = DynamodbService;
//# sourceMappingURL=DynamodbService.js.map