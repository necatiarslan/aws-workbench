import * as vscode from 'vscode';
import { AbstractAwsService } from '../AbstractAwsService';
import { Session } from '../../common/Session';
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

    public StepFuncList: {Region: string, StepFunc: string}[] = [];
    public PayloadPathList: {Region: string, StepFunc: string, PayloadPath: string}[] = [];
    public CodePathList: {Region: string, StepFunc: string, CodePath: string}[] = [];

    constructor(context: vscode.ExtensionContext) {
        super();
        StepfunctionsService.Instance = this;
        this.context = context;
        this.loadBaseState();        this.loadCustomResources();        this.treeDataProvider = new StepFuncTreeDataProvider();
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
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }

    async RemoveStepFunc(node: StepFuncTreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.StepFunctionsStateMachine || !node.Region || !node.StepFuncArn) { return; }
        this.treeDataProvider.RemoveStepFunc(node.Region, node.StepFuncArn);
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
