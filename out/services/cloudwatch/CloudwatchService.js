"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudWatchService = void 0;
const vscode = require("vscode");
const AbstractAwsService_1 = require("../AbstractAwsService");
const CloudWatchTreeDataProvider_1 = require("./CloudWatchTreeDataProvider");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const ui = require("../../common/UI");
const api = require("./API");
const Session_1 = require("../../common/Session");
class CloudWatchService extends AbstractAwsService_1.AbstractAwsService {
    static Instance;
    serviceId = 'cloudwatch';
    treeDataProvider;
    context;
    LastUsedRegion = "us-east-1";
    LogGroupList = [];
    constructor(context) {
        super();
        CloudWatchService.Instance = this;
        this.context = context;
        this.loadBaseState();
        this.loadCustomResources();
        this.treeDataProvider = new CloudWatchTreeDataProvider_1.CloudWatchTreeDataProvider();
        this.Refresh();
    }
    registerCommands(context, treeProvider, treeView) {
        const wrap = (node) => {
            if (node instanceof WorkbenchTreeItem_1.WorkbenchTreeItem) {
                return node.itemData;
            }
            return node;
        };
        context.subscriptions.push(vscode.commands.registerCommand('aws-workbench.cloudwatch.AddLogGroup', async () => {
            await this.AddLogGroup();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.cloudwatch.RemoveLogGroup', async (node) => {
            await this.RemoveLogGroup(wrap(node));
            treeProvider.refresh();
        }));
    }
    async getRootNodes() {
        const nodes = this.treeDataProvider.GetRegionNodes();
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
            if (n.LogStream && n.LogGroup && n.Region) {
                item.id = `${n.Region}:${n.LogGroup}:${n.LogStream}`;
            }
            else if (n.LogGroup && n.Region) {
                item.id = `${n.Region}:${n.LogGroup}`;
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
        return await this.AddLogGroup();
    }
    Refresh() {
        this.treeDataProvider.Refresh();
    }
    async AddLogGroup() {
        ui.logToOutput('CloudWatchService.AddLogGroup Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        this.LastUsedRegion = selectedRegion;
        let selectedGroupName = await vscode.window.showInputBox({ placeHolder: 'Enter Log Group Name / Search Text' });
        if (selectedGroupName === undefined) {
            return;
        }
        var resultGroup = await api.GetLogGroupList(selectedRegion, selectedGroupName);
        if (!resultGroup.isSuccessful) {
            return;
        }
        let selectedGroupList = await vscode.window.showQuickPick(resultGroup.result, { canPickMany: true, placeHolder: 'Select Log Group(s)' });
        if (!selectedGroupList || selectedGroupList.length === 0) {
            return;
        }
        let lastAddedItem;
        for (var selectedGroup of selectedGroupList) {
            lastAddedItem = this.treeDataProvider.AddLogGroup(selectedRegion, selectedGroup);
        }
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }
    async RemoveLogGroup(node) {
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.CloudWatchLogGroup || !node.Region || !node.LogGroup) {
            return;
        }
        this.treeDataProvider.RemoveLogGroup(node.Region, node.LogGroup);
    }
    async ShowOnlyFavorite() {
        Session_1.Session.Current.IsShowOnlyFavorite = !Session_1.Session.Current.IsShowOnlyFavorite;
        this.treeDataProvider.Refresh();
    }
    async ShowHiddenNodes() {
        Session_1.Session.Current.IsShowHiddenNodes = !Session_1.Session.Current.IsShowHiddenNodes;
        this.treeDataProvider.Refresh();
    }
    async AddToFav(node) {
        if (!node)
            return;
        this.addToFav(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }
    async DeleteFromFav(node) {
        if (!node)
            return;
        this.deleteFromFav(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }
    async HideNode(node) {
        if (!node)
            return;
        this.hideResource(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }
    async UnHideNode(node) {
        if (!node)
            return;
        this.unhideResource(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
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
exports.CloudWatchService = CloudWatchService;
//# sourceMappingURL=CloudWatchService.js.map