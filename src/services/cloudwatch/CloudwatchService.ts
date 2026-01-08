import * as vscode from 'vscode';
import { IService } from '../IService';
import { CloudWatchTreeDataProvider } from './CloudWatchTreeDataProvider';
import { CloudWatchTreeItem } from './CloudWatchTreeItem';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import * as ui from '../../common/UI';
import * as api from './API';

export class CloudWatchService implements IService {
    public static Instance: CloudWatchService;
    public serviceId = 'cloudwatch';
    public treeDataProvider: CloudWatchTreeDataProvider;
    public context: vscode.ExtensionContext;
    
    public FilterString: string = "";
    public isShowOnlyFavorite: boolean = false;
    public isShowHiddenNodes: boolean = false;
    public AwsProfile: string = "default";	
    public AwsEndPoint: string | undefined;
    public LastUsedRegion: string = "us-east-1";

    public LogGroupList: {Region: string, LogGroup: string}[] = [];

    constructor(context: vscode.ExtensionContext) {
        CloudWatchService.Instance = this;
        this.context = context;
        this.treeDataProvider = new CloudWatchTreeDataProvider();
        this.LoadState();
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
            vscode.commands.registerCommand('aws-workbench.cloudwatch.Refresh', () => {
                this.Refresh();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.cloudwatch.Filter', async () => {
                await this.Filter();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.cloudwatch.ShowOnlyFavorite', async () => {
                await this.ShowOnlyFavorite();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.cloudwatch.ShowHiddenNodes', async () => {
                await this.ShowHiddenNodes();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.cloudwatch.AddToFav', (node: any) => {
                this.AddToFav(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.cloudwatch.DeleteFromFav', (node: any) => {
                this.DeleteFromFav(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.cloudwatch.HideNode', (node: any) => {
                this.HideNode(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.cloudwatch.UnHideNode', (node: any) => {
                this.UnHideNode(wrap(node));
                treeProvider.refresh();
            }),
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
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }

    async RemoveLogGroup(node: CloudWatchTreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.CloudWatchLogGroup || !node.Region || !node.LogGroup) { return; }
        this.treeDataProvider.RemoveLogGroup(node.Region, node.LogGroup);
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

    async AddToFav(node: CloudWatchTreeItem) {
        if (!node) return;
        node.IsFav = true;
        this.treeDataProvider.Refresh();
    }

    async DeleteFromFav(node: CloudWatchTreeItem) {
        if (!node) return;
        node.IsFav = false;
        this.treeDataProvider.Refresh();
    }

    async HideNode(node: CloudWatchTreeItem) {
        if (!node) return;
        node.IsHidden = true;
        this.treeDataProvider.Refresh();
    }

    async UnHideNode(node: CloudWatchTreeItem) {
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
            this.LogGroupList = this.context.globalState.get('LogGroupList', []);
            this.LastUsedRegion = this.context.globalState.get('LastUsedRegion', 'us-east-1');
        } catch (error) {
            ui.logToOutput("CloudWatchService.loadState Error !!!");
        }
    }

    SaveState() {
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('LogGroupList', this.LogGroupList);
            this.context.globalState.update('LastUsedRegion', this.LastUsedRegion);
        } catch (error) {
            ui.logToOutput("CloudWatchService.saveState Error !!!");
        }
    }
}
