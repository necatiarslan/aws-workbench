import * as vscode from 'vscode';
import { AbstractAwsService } from '../AbstractAwsService';
import { Session } from '../../common/Session';
import { LambdaTreeItem } from './LambdaTreeItem';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import { LambdaTreeDataProvider } from './LambdaTreeDataProvider';
import * as ui from '../../common/UI';
import * as api from './API';

export class LambdaService extends AbstractAwsService {
    public static Instance: LambdaService;
    public serviceId = 'lambda';
    public treeDataProvider: LambdaTreeDataProvider;
    public context: vscode.ExtensionContext;

    public LambdaList: {Region: string, Lambda: string}[] = [];
    public PayloadPathList: {Region: string, Lambda: string, PayloadPath: string}[] = [];
    public CodePathList: {Region: string, Lambda: string, CodePath: string}[] = [];

    constructor(context: vscode.ExtensionContext) {
        super();
        LambdaService.Instance = this;
        this.context = context;
        this.loadBaseState();
        this.treeDataProvider = new LambdaTreeDataProvider();
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
            vscode.commands.registerCommand('aws-workbench.lambda.Refresh', () => {
                this.Refresh();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.lambda.AddLambda', async () => {
                await this.AddLambda();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.lambda.RemoveLambda', async (node: any) => {
                await this.RemoveLambda(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.lambda.Goto', (node: any) => {
                this.Goto(wrap(node));
            }),
            vscode.commands.registerCommand('aws-workbench.lambda.TriggerLambda', (node: any) => {
                this.TriggerLambda(wrap(node));
            }),
            vscode.commands.registerCommand('aws-workbench.lambda.ViewLatestLog', (node: any) => {
                this.ViewLatestLog(wrap(node));
            }),
            vscode.commands.registerCommand('aws-workbench.lambda.LambdaView', (node: any) => {
                this.LambdaView(wrap(node));
            }),
            vscode.commands.registerCommand('aws-workbench.lambda.PrintLambda', async (node: any) => {
                await this.PrintLambda(wrap(node));
            }),
            vscode.commands.registerCommand('aws-workbench.lambda.UpdateLambdaCodes', async (node: any) => {
                await this.UpdateLambdaCodes(wrap(node));
            }),
            vscode.commands.registerCommand('aws-workbench.lambda.DownloadLambdaCode', async (node: any) => {
                await this.DownloadLambdaCode(wrap(node));
            })
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const lambdas = await this.treeDataProvider.GetLambdaNodes();
        const items = lambdas.map(l => this.mapToWorkbenchItem(l));
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
            if (n.Region && n.Lambda) {
                item.id = `${n.Region}:${n.Lambda}:${n.TreeItemType ?? ''}`;
            } else if (n.Region) {
                item.id = `${n.Region}:${n.TreeItemType ?? ''}`;
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
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }

    async RemoveLambda(node: LambdaTreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.LambdaFunction || !node.Region || !node.Lambda) { return; }
        this.treeDataProvider.RemoveLambda(node.Region, node.Lambda);
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

    // Proxy methods for TreeDataProvider to call back into Service for business logic if needed
    LoadEnvironmentVariables(node: LambdaTreeItem) { /* ... */ }
    LoadTags(node: LambdaTreeItem) { /* ... */ }
    LoadInfo(node: LambdaTreeItem) { /* ... */ }

    public override addToFav(node: WorkbenchTreeItem) {
        const data = node.itemData as LambdaTreeItem | undefined;
        if (data) { data.IsFav = true; data.setContextValue(); }
        super.addToFav(node);
    }

    public override deleteFromFav(node: WorkbenchTreeItem) {
        const data = node.itemData as LambdaTreeItem | undefined;
        if (data) { data.IsFav = false; data.setContextValue(); }
        super.deleteFromFav(node);
    }

    public override hideResource(node: WorkbenchTreeItem) {
        const data = node.itemData as LambdaTreeItem | undefined;
        if (data) { data.IsHidden = true; data.setContextValue(); }
        super.hideResource(node);
    }

    public override unhideResource(node: WorkbenchTreeItem) {
        const data = node.itemData as LambdaTreeItem | undefined;
        if (data) { data.IsHidden = false; data.setContextValue(); }
        super.unhideResource(node);
    }

    public override showOnlyInProfile(node: WorkbenchTreeItem, profile: string) {
        const data = node.itemData as LambdaTreeItem | undefined;
        if (data) { data.ProfileToShow = profile; data.setContextValue(); }
        super.showOnlyInProfile(node, profile);
    }

    public override showInAnyProfile(node: WorkbenchTreeItem) {
        const data = node.itemData as LambdaTreeItem | undefined;
        if (data) { data.ProfileToShow = ""; data.setContextValue(); }
        super.showInAnyProfile(node);
    }
}
