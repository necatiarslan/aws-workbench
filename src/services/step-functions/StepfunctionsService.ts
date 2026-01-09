import * as vscode from 'vscode';
import { AbstractAwsService } from '../AbstractAwsService';
import { StepFuncTreeDataProvider } from './StepFuncTreeDataProvider';
import { StepFuncTreeItem } from './StepFuncTreeItem';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import * as ui from '../../common/UI';
import * as api from './API';

export class StepfunctionsService extends AbstractAwsService {
    public static Instance: StepfunctionsService;
    public serviceId = 'stepfunctions';
    public treeDataProvider: StepFuncTreeDataProvider;
    public context: vscode.ExtensionContext;
    
    public FilterString: string = "";
    public isShowOnlyFavorite: boolean = false;
    public isShowHiddenNodes: boolean = false;
    public AwsProfile: string = "default";	
    public AwsEndPoint: string | undefined;

    public StepFuncList: {Region: string, StepFunc: string}[] = [];
    public PayloadPathList: {Region: string, StepFunc: string, PayloadPath: string}[] = [];
    public CodePathList: {Region: string, StepFunc: string, CodePath: string}[] = [];

    constructor(context: vscode.ExtensionContext) {
        super();
        StepfunctionsService.Instance = this;
        this.context = context;
        this.loadBaseState();
        this.treeDataProvider = new StepFuncTreeDataProvider();
        this.LoadState();
        this.Refresh();
    }

    registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider, treeView: vscode.TreeView<WorkbenchTreeItem>): void {
        const wrap = (node: any) => {
            if (node instanceof WorkbenchTreeItem) {
                return node.itemData as StepFuncTreeItem;
            }
            return node as StepFuncTreeItem;
        };

        context.subscriptions.push(
            vscode.commands.registerCommand('aws-workbench.step-functions.Refresh', () => {
                this.Refresh();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.step-functions.Filter', async () => {
                await this.Filter();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.step-functions.ShowOnlyFavorite', async () => {
                await this.ShowOnlyFavorite();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.step-functions.ShowHiddenNodes', async () => {
                await this.ShowHiddenNodes();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.step-functions.AddToFav', (node: any) => {
                this.AddToFav(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.step-functions.DeleteFromFav', (node: any) => {
                this.DeleteFromFav(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.step-functions.HideNode', (node: any) => {
                this.HideNode(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.step-functions.UnHideNode', (node: any) => {
                this.UnHideNode(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.step-functions.AddStepFunc', async () => {
                await this.AddStepFunc();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.step-functions.RemoveStepFunc', async (node: any) => {
                await this.RemoveStepFunc(wrap(node));
                treeProvider.refresh();
            })
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const nodes = this.treeDataProvider.GetStepFuncNodes();
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
            if (n.StepFuncArn) {
                item.id = n.StepFuncArn;
            } else if (n.ExecutionArn) {
                item.id = n.ExecutionArn;
            } else if (n.Region && n.StepFuncName) {
                item.id = `${n.Region}:${n.StepFuncName}:${n.TreeItemType ?? ''}`;
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
        return await this.AddStepFunc();
    }

    Refresh() {
        this.treeDataProvider.Refresh();
    }

    async AddStepFunc(): Promise<WorkbenchTreeItem | undefined> {
        ui.logToOutput('StepfunctionsService.AddStepFunc Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) { return; }
        let selectedStepFuncName = await vscode.window.showInputBox({ placeHolder: 'Enter Step Function Name / Search Text' });
        if (selectedStepFuncName === undefined) { return; }
        var resultStepFunc = await api.GetStepFuncList(selectedRegion, selectedStepFuncName);
        if (!resultStepFunc.isSuccessful) { return; }
        let selectedStepFuncList = await vscode.window.showQuickPick(resultStepFunc.result, { canPickMany: true, placeHolder: 'Select Step Function(s)' });
        if (!selectedStepFuncList || selectedStepFuncList.length === 0) { return; }
        
        let lastAddedItem: StepFuncTreeItem | undefined;
        for (var selectedStepFunc of selectedStepFuncList) {
            lastAddedItem = this.treeDataProvider.AddStepFunc(selectedRegion, selectedStepFunc);
        }
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }

    async RemoveStepFunc(node: StepFuncTreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.StepFunctionsStateMachine || !node.Region || !node.StepFuncArn) { return; }
        this.treeDataProvider.RemoveStepFunc(node.Region, node.StepFuncArn);
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

    async AddToFav(node: StepFuncTreeItem) {
        if (!node) return;
        this.addToFav(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }

    async DeleteFromFav(node: StepFuncTreeItem) {
        if (!node) return;
        this.deleteFromFav(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }

    async HideNode(node: StepFuncTreeItem) {
        if (!node) return;
        this.hideResource(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }

    async UnHideNode(node: StepFuncTreeItem) {
        if (!node) return;
        this.unhideResource(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }

    LoadState() {
        try {
            this.AwsProfile = this.context.globalState.get('AwsProfile', 'default');
            this.FilterString = this.context.globalState.get('FilterString', '');
            this.isShowOnlyFavorite = this.context.globalState.get('ShowOnlyFavorite', false);
            this.isShowHiddenNodes = this.context.globalState.get('ShowHiddenNodes', false);
            this.StepFuncList = this.context.globalState.get('StepFuncList', []);
            this.PayloadPathList = this.context.globalState.get('PayloadPathList', []);
            this.CodePathList = this.context.globalState.get('CodePathList', []);
        } catch (error) {
            ui.logToOutput("StepfunctionsService.loadState Error !!!");
        }
    }

    SaveState() {
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('StepFuncList', this.StepFuncList);
            this.context.globalState.update('PayloadPathList', this.PayloadPathList);
            this.context.globalState.update('CodePathList', this.CodePathList);
            this.saveBaseState();
        } catch (error) {
            ui.logToOutput("StepfunctionsService.saveState Error !!!");
        }
    }

    public override addToFav(node: WorkbenchTreeItem) {
        const data = node.itemData as StepFuncTreeItem | undefined;
        if (data) { data.IsFav = true; data.setContextValue(); }
        super.addToFav(node);
    }

    public override deleteFromFav(node: WorkbenchTreeItem) {
        const data = node.itemData as StepFuncTreeItem | undefined;
        if (data) { data.IsFav = false; data.setContextValue(); }
        super.deleteFromFav(node);
    }

    public override hideResource(node: WorkbenchTreeItem) {
        const data = node.itemData as StepFuncTreeItem | undefined;
        if (data) { data.IsHidden = true; data.setContextValue(); }
        super.hideResource(node);
    }

    public override unhideResource(node: WorkbenchTreeItem) {
        const data = node.itemData as StepFuncTreeItem | undefined;
        if (data) { data.IsHidden = false; data.setContextValue(); }
        super.unhideResource(node);
    }

    public override showOnlyInProfile(node: WorkbenchTreeItem, profile: string) {
        const data = node.itemData as StepFuncTreeItem | undefined;
        if (data) { data.ProfileToShow = profile; data.setContextValue(); }
        super.showOnlyInProfile(node, profile);
    }

    public override showInAnyProfile(node: WorkbenchTreeItem) {
        const data = node.itemData as StepFuncTreeItem | undefined;
        if (data) { data.ProfileToShow = ""; data.setContextValue(); }
        super.showInAnyProfile(node);
    }
}
