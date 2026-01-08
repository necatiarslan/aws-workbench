import * as vscode from 'vscode';
import { IService } from '../IService';
import { LambdaTreeItem, TreeItemType } from './lambda/LambdaTreeItem';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import { LambdaTreeDataProvider } from './lambda/LambdaTreeDataProvider';
import * as ui from './common/UI';
import * as api from './common/API';

export class LambdaService implements IService {
    public static Instance: LambdaService;
    public serviceId = 'lambda';
    public treeDataProvider: LambdaTreeDataProvider;
    public context: vscode.ExtensionContext;
    
    public FilterString: string = "";
    public isShowOnlyFavorite: boolean = false;
    public isShowHiddenNodes: boolean = false;
    public AwsProfile: string = "default";	
    public AwsEndPoint: string | undefined;

    public LambdaList: {Region: string, Lambda: string}[] = [];
    public PayloadPathList: {Region: string, Lambda: string, PayloadPath: string}[] = [];
    public CodePathList: {Region: string, Lambda: string, CodePath: string}[] = [];

    constructor(context: vscode.ExtensionContext) {
        LambdaService.Instance = this;
        this.context = context;
        this.treeDataProvider = new LambdaTreeDataProvider();
        this.LoadState();
        this.Refresh();
    }

    registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider, treeView: vscode.TreeView<WorkbenchTreeItem>): void {
        const wrap = (node: any) => {
            if (node instanceof WorkbenchTreeItem) {
                return node.itemData as LambdaTreeItem;
            }
            return node as LambdaTreeItem;
        };

        context.subscriptions.push(
            vscode.commands.registerCommand('LambdaTreeView.Refresh', () => {
                this.Refresh();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('LambdaTreeView.AddLambda', async () => {
                await this.AddLambda();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('LambdaTreeView.Filter', async () => {
                await this.Filter();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('LambdaTreeView.ShowOnlyFavorite', async () => {
                await this.ShowOnlyFavorite();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('LambdaTreeView.ShowHiddenNodes', async () => {
                await this.ShowHiddenNodes();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('LambdaTreeView.AddToFav', (node: any) => {
                this.AddToFav(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('LambdaTreeView.DeleteFromFav', (node: any) => {
                this.DeleteFromFav(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('LambdaTreeView.HideNode', (node: any) => {
                this.HideNode(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('LambdaTreeView.UnHideNode', (node: any) => {
                this.UnHideNode(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('LambdaTreeView.RemoveLambda', async (node: any) => {
                await this.RemoveLambda(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('LambdaTreeView.Goto', (node: any) => {
                this.Goto(wrap(node));
            }),
            vscode.commands.registerCommand('LambdaTreeView.TriggerLambda', (node: any) => {
                this.TriggerLambda(wrap(node));
            }),
            vscode.commands.registerCommand('LambdaTreeView.ViewLatestLog', (node: any) => {
                this.ViewLatestLog(wrap(node));
            }),
            vscode.commands.registerCommand('LambdaTreeView.LambdaView', (node: any) => {
                this.LambdaView(wrap(node));
            }),
            vscode.commands.registerCommand('LambdaTreeView.PrintLambda', async (node: any) => {
                await this.PrintLambda(wrap(node));
            }),
            vscode.commands.registerCommand('LambdaTreeView.UpdateLambdaCodes', async (node: any) => {
                await this.UpdateLambdaCodes(wrap(node));
            }),
            vscode.commands.registerCommand('LambdaTreeView.DownloadLambdaCode', async (node: any) => {
                await this.DownloadLambdaCode(wrap(node));
            })
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const lambdas = await this.treeDataProvider.GetLambdaNodes();
        return lambdas.map(l => this.mapToWorkbenchItem(l));
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
        return await this.AddLambda();
    }

    Refresh() {
        this.treeDataProvider.Refresh();
    }

    async AddLambda(): Promise<WorkbenchTreeItem | undefined> {
        ui.logToOutput('LambdaService.AddLambda Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) { return; }
        let selectedLambdaName = await vscode.window.showInputBox({ placeHolder: 'Enter Lambda Name / Search Text' });
        if (selectedLambdaName === undefined) { return; }
        var resultLambda = await api.GetLambdaList(selectedRegion, selectedLambdaName);
        if (!resultLambda.isSuccessful) { return; }
        let selectedLambdaList = await vscode.window.showQuickPick(resultLambda.result, { canPickMany: true, placeHolder: 'Select Lambda(s)' });
        if (!selectedLambdaList || selectedLambdaList.length === 0) { return; }
        
        let lastAddedItem: LambdaTreeItem | undefined;
        for (var selectedLambda of selectedLambdaList) {
            lastAddedItem = this.treeDataProvider.AddLambda(selectedRegion, selectedLambda);
        }
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }

    async RemoveLambda(node: LambdaTreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.Lambda || !node.Region || !node.Lambda) { return; }
        this.treeDataProvider.RemoveLambda(node.Region, node.Lambda);
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

    async AddToFav(node: LambdaTreeItem) {
        if (!node) return;
        node.IsFav = true;
        this.treeDataProvider.Refresh();
    }

    async DeleteFromFav(node: LambdaTreeItem) {
        if (!node) return;
        node.IsFav = false;
        this.treeDataProvider.Refresh();
    }

    async HideNode(node: LambdaTreeItem) {
        if (!node) return;
        node.IsHidden = true;
        this.treeDataProvider.Refresh();
    }

    async UnHideNode(node: LambdaTreeItem) {
        if (!node) return;
        node.IsHidden = false;
        this.treeDataProvider.Refresh();
    }

    Goto(node: LambdaTreeItem) {
        // Implement Goto
    }

    TriggerLambda(node: LambdaTreeItem) {
        // Implement TriggerLambda
    }

    ViewLatestLog(node: LambdaTreeItem) {
        // Implement ViewLatestLog
    }

    LambdaView(node: LambdaTreeItem) {
        // Implement LambdaView
    }

    async PrintLambda(node: LambdaTreeItem) {
        // Implement PrintLambda
    }

    async UpdateLambdaCodes(node: LambdaTreeItem) {
        // Implement UpdateLambdaCodes
    }

    async DownloadLambdaCode(node: LambdaTreeItem) {
        // Implement DownloadLambdaCode
    }

    LoadState() {
        try {
            this.AwsProfile = this.context.globalState.get('AwsProfile', 'default');
            this.FilterString = this.context.globalState.get('FilterString', '');
            this.isShowOnlyFavorite = this.context.globalState.get('ShowOnlyFavorite', false);
            this.isShowHiddenNodes = this.context.globalState.get('ShowHiddenNodes', false);
            this.LambdaList = this.context.globalState.get('LambdaList', []);
            this.PayloadPathList = this.context.globalState.get('PayloadPathList', []);
            this.CodePathList = this.context.globalState.get('CodePathList', []);
        } catch (error) {
            ui.logToOutput("LambdaService.loadState Error !!!");
        }
    }

    SaveState() {
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('LambdaList', this.LambdaList);
            this.context.globalState.update('PayloadPathList', this.PayloadPathList);
            this.context.globalState.update('CodePathList', this.CodePathList);
        } catch (error) {
            ui.logToOutput("LambdaService.saveState Error !!!");
        }
    }

    // Proxy methods for TreeDataProvider to call back into Service for business logic if needed
    LoadEnvironmentVariables(node: LambdaTreeItem) { /* ... */ }
    LoadTags(node: LambdaTreeItem) { /* ... */ }
    LoadInfo(node: LambdaTreeItem) { /* ... */ }
}
