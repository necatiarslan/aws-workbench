import * as vscode from 'vscode';
import { IService } from '../IService';
import { StepFuncTreeDataProvider } from './StepFuncTreeDataProvider';
import { StepFuncTreeItem } from './StepFuncTreeItem';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import * as ui from '../../common/UI';
import * as api from './API';

export class StepfunctionsService implements IService {
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
        StepfunctionsService.Instance = this;
        this.context = context;
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
        node.IsFav = true;
        this.treeDataProvider.Refresh();
    }

    async DeleteFromFav(node: StepFuncTreeItem) {
        if (!node) return;
        node.IsFav = false;
        this.treeDataProvider.Refresh();
    }

    async HideNode(node: StepFuncTreeItem) {
        if (!node) return;
        node.IsHidden = true;
        this.treeDataProvider.Refresh();
    }

    async UnHideNode(node: StepFuncTreeItem) {
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
        } catch (error) {
            ui.logToOutput("StepfunctionsService.saveState Error !!!");
        }
    }
}
