import * as vscode from 'vscode';
import { IService } from '../IService';
import { GlueTreeDataProvider } from './glue/GlueTreeDataProvider';
import { GlueTreeItem, TreeItemType } from './glue/GlueTreeItem';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import * as ui from './common/UI';
import * as api from './common/API';

export class GlueService implements IService {
    public static Instance: GlueService;
    public serviceId = 'glue';
    public treeDataProvider: GlueTreeDataProvider;
    public context: vscode.ExtensionContext;
    
    public FilterString: string = "";
    public isShowOnlyFavorite: boolean = false;
    public isShowHiddenNodes: boolean = false;
    public AwsProfile: string = "default";	
    public AwsEndPoint: string | undefined;

    public ResourceList: {Region: string, Name: string, Type: string}[] = [];
    public JobInfoCache: { [key: string]: any } = {};
    public JobRunsCache: { [key: string]: any[] } = {};
    public LogStreamsCache: { [key: string]: string[] } = {};

    constructor(context: vscode.ExtensionContext) {
        GlueService.Instance = this;
        this.context = context;
        this.treeDataProvider = new GlueTreeDataProvider();
        this.LoadState();
        this.Refresh();
    }

    registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider, treeView: vscode.TreeView<WorkbenchTreeItem>): void {
        const wrap = (node: any) => {
            if (node instanceof WorkbenchTreeItem) {
                return node.itemData as GlueTreeItem;
            }
            return node as GlueTreeItem;
        };

        context.subscriptions.push(
            vscode.commands.registerCommand('GlueTreeView.Refresh', () => {
                this.Refresh();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('GlueTreeView.Filter', async () => {
                await this.Filter();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('GlueTreeView.AddGlueJob', async () => {
                await this.AddGlueJob();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('GlueTreeView.RemoveGlueJob', async (node: any) => {
                await this.RemoveGlueJob(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('GlueTreeView.ViewLog', (node: any) => {
                this.ViewLog(wrap(node));
            })
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const nodes = await this.treeDataProvider.getChildren(undefined);
        return nodes.map((n: GlueTreeItem) => this.mapToWorkbenchItem(n));
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
        return await this.AddGlueJob();
    }

    Refresh() {
        this.treeDataProvider.Refresh();
    }

    async AddGlueJob(): Promise<WorkbenchTreeItem | undefined> {
        ui.logToOutput('GlueService.AddGlueJob Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) { return; }
        let selectedJobName = await vscode.window.showInputBox({ placeHolder: 'Enter Glue Job Name / Search Text' });
        if (selectedJobName === undefined) { return; }
        var resultJob = await api.GetGlueJobList(selectedRegion, selectedJobName);
        if (!resultJob.isSuccessful) { return; }
        let selectedJobList = await vscode.window.showQuickPick(resultJob.result, { canPickMany: true, placeHolder: 'Select Glue Job(s)' });
        if (!selectedJobList || selectedJobList.length === 0) { return; }
        
        let lastAddedItem: GlueTreeItem | undefined;
        for (var selectedJob of selectedJobList) {
            lastAddedItem = this.treeDataProvider.AddResource(selectedRegion, selectedJob, TreeItemType.Job);
        }
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }

    async RemoveGlueJob(node: GlueTreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.Job || !node.Region || !node.ResourceName) { return; }
        this.treeDataProvider.RemoveResource(node.Region, node.ResourceName, TreeItemType.Job);
        this.SaveState();
    }

    async Filter() {
        let filterStringTemp = await vscode.window.showInputBox({ value: this.FilterString, placeHolder: 'Enter Your Filter Text' });
        if (filterStringTemp === undefined) { return; }
        this.FilterString = filterStringTemp;
        this.treeDataProvider.Refresh();
        this.SaveState();
    }

    LoadState() {
        try {
            this.AwsProfile = this.context.globalState.get('AwsProfile', 'default');
            this.FilterString = this.context.globalState.get('FilterString', '');
            this.ResourceList = this.context.globalState.get('ResourceList', []);
        } catch (error) {
            ui.logToOutput("GlueService.loadState Error !!!");
        }
    }

    SaveState() {
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ResourceList', this.ResourceList);
        } catch (error) {
            ui.logToOutput("GlueService.saveState Error !!!");
        }
    }

    ViewLog(node: GlueTreeItem) { /* ... */ }
}
