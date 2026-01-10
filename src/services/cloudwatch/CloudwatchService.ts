import * as vscode from 'vscode';
import { AbstractAwsService } from '../AbstractAwsService';
import { CloudWatchTreeDataProvider } from './CloudWatchTreeDataProvider';
import { CloudWatchTreeItem } from './CloudWatchTreeItem';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import * as ui from '../../common/UI';
import * as api from './API';
import { Session } from '../../common/Session';

export class CloudWatchService extends AbstractAwsService {
    public static Instance: CloudWatchService;
    public serviceId = 'cloudwatch';
    public treeDataProvider: CloudWatchTreeDataProvider;
    public context: vscode.ExtensionContext;
    
    public LastUsedRegion: string = "us-east-1";

    public LogGroupList: {Region: string, LogGroup: string}[] = [];

    constructor(context: vscode.ExtensionContext) {
        super();
        CloudWatchService.Instance = this;
        this.context = context;
        this.loadBaseState();
        this.loadCustomResources();
        this.treeDataProvider = new CloudWatchTreeDataProvider();
        this.Refresh();
    }

    registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider, treeView: vscode.TreeView<WorkbenchTreeItem>): void {
        const wrap = (node: any) => {
            if (node instanceof WorkbenchTreeItem) {
                return node.itemData as CloudWatchTreeItem;
            }
            return node as CloudWatchTreeItem;
        };

        context.subscriptions.push(
            vscode.commands.registerCommand('aws-workbench.cloudwatch.AddLogGroup', async () => {
                await this.AddLogGroup();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.cloudwatch.RemoveLogGroup', async (node: any) => {
                await this.RemoveLogGroup(wrap(node));
                treeProvider.refresh();
            })
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const nodes = this.treeDataProvider.GetRegionNodes();
        const items = nodes.map(n => this.mapToWorkbenchItem(n));
        
        // Add ungrouped custom resources (not in any folder)
        const ungroupedCustomResources = this.getCustomResourcesByFolder(null);
        for (const resource of ungroupedCustomResources) {
            const customItem = new WorkbenchTreeItem(
                this.getDisplayName(resource),
                vscode.TreeItemCollapsibleState.Collapsed,
                this.serviceId,
                'customResource',
                resource.resourceData
            );
            customItem.isCustom = true;
            customItem.compositeKey = resource.compositeKey;
            customItem.displayName = resource.displayName;
            customItem.awsName = resource.awsName;
            items.push(customItem);
        }
        
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
            if (n.LogStream && n.LogGroup && n.Region) {
                item.id = `${n.Region}:${n.LogGroup}:${n.LogStream}`;
            } else if (n.LogGroup && n.Region) {
                item.id = `${n.Region}:${n.LogGroup}`;
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
        return await this.AddLogGroup();
    }

    Refresh() {
        this.treeDataProvider.Refresh();
    }

    async AddLogGroup(): Promise<WorkbenchTreeItem | undefined> {
        ui.logToOutput('CloudWatchService.AddLogGroup Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) { return; }
        this.LastUsedRegion = selectedRegion;
        let selectedGroupName = await vscode.window.showInputBox({ placeHolder: 'Enter Log Group Name / Search Text' });
        if (selectedGroupName === undefined) { return; }
        var resultGroup = await api.GetLogGroupList(selectedRegion, selectedGroupName);
        if (!resultGroup.isSuccessful) { return; }
        let selectedGroupList = await vscode.window.showQuickPick(resultGroup.result, { canPickMany: true, placeHolder: 'Select Log Group(s)' });
        if (!selectedGroupList || selectedGroupList.length === 0) { return; }
        
        let lastAddedItem: CloudWatchTreeItem | undefined;
        for (var selectedGroup of selectedGroupList) {
            lastAddedItem = this.treeDataProvider.AddLogGroup(selectedRegion, selectedGroup);
        }
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }

    async RemoveLogGroup(node: CloudWatchTreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.CloudWatchLogGroup || !node.Region || !node.LogGroup) { return; }
        this.treeDataProvider.RemoveLogGroup(node.Region, node.LogGroup);
    }

    async ShowOnlyFavorite() {
        Session.Current!.IsShowOnlyFavorite = !Session.Current!.IsShowOnlyFavorite;
        this.treeDataProvider.Refresh();
    }

    async ShowHiddenNodes() {
        Session.Current!.IsShowHiddenNodes = !Session.Current!.IsShowHiddenNodes;
        this.treeDataProvider.Refresh();
    }

    async AddToFav(node: CloudWatchTreeItem) {
        if (!node) return;
        this.addToFav(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }

    async DeleteFromFav(node: CloudWatchTreeItem) {
        if (!node) return;
        this.deleteFromFav(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }

    async HideNode(node: CloudWatchTreeItem) {
        if (!node) return;
        this.hideResource(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }

    async UnHideNode(node: CloudWatchTreeItem) {
        if (!node) return;
        this.unhideResource(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }


    public override addToFav(node: WorkbenchTreeItem) {
        const data = node.itemData as CloudWatchTreeItem | undefined;
        if (data) { data.IsFav = true; data.setContextValue(); }
        super.addToFav(node);
    }

    public override deleteFromFav(node: WorkbenchTreeItem) {
        const data = node.itemData as CloudWatchTreeItem | undefined;
        if (data) { data.IsFav = false; data.setContextValue(); }
        super.deleteFromFav(node);
    }

    public override hideResource(node: WorkbenchTreeItem) {
        const data = node.itemData as CloudWatchTreeItem | undefined;
        if (data) { data.IsHidden = true; data.setContextValue(); }
        super.hideResource(node);
    }

    public override unhideResource(node: WorkbenchTreeItem) {
        const data = node.itemData as CloudWatchTreeItem | undefined;
        if (data) { data.IsHidden = false; data.setContextValue(); }
        super.unhideResource(node);
    }

    public override showOnlyInProfile(node: WorkbenchTreeItem, profile: string) {
        const data = node.itemData as CloudWatchTreeItem | undefined;
        if (data) { data.ProfileToShow = profile; data.setContextValue(); }
        super.showOnlyInProfile(node, profile);
    }

    public override showInAnyProfile(node: WorkbenchTreeItem) {
        const data = node.itemData as CloudWatchTreeItem | undefined;
        if (data) { data.ProfileToShow = ""; data.setContextValue(); }
        super.showInAnyProfile(node);
    }
}
