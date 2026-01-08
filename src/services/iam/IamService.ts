import * as vscode from 'vscode';
import { IService } from '../IService';
import { IamTreeDataProvider } from './iam/IamTreeDataProvider';
import { IamTreeItem, TreeItemType } from './iam/IamTreeItem';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import * as ui from './common/UI';
import * as api from './common/API';

export class IamService implements IService {
    public static Instance: IamService;
    public serviceId = 'iam';
    public treeDataProvider: IamTreeDataProvider;
    public context: vscode.ExtensionContext;
    
    public FilterString: string = "";
    public isShowOnlyFavorite: boolean = false;
    public isShowHiddenNodes: boolean = false;
    public AwsProfile: string = "default";	
    public AwsEndPoint: string | undefined;

    public IamRoleList: {Region: string, IamRole: string}[] = [];

    constructor(context: vscode.ExtensionContext) {
        IamService.Instance = this;
        this.context = context;
        this.treeDataProvider = new IamTreeDataProvider();
        this.LoadState();
        this.Refresh();
    }

    registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider, treeView: vscode.TreeView<WorkbenchTreeItem>): void {
        const wrap = (node: any) => {
            if (node instanceof WorkbenchTreeItem) {
                return node.itemData as IamTreeItem;
            }
            return node as IamTreeItem;
        };

        context.subscriptions.push(
            vscode.commands.registerCommand('IamTreeView.Refresh', () => {
                this.Refresh();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('IamTreeView.Filter', async () => {
                await this.Filter();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('IamTreeView.ShowOnlyFavorite', async () => {
                await this.ShowOnlyFavorite();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('IamTreeView.ShowHiddenNodes', async () => {
                await this.ShowHiddenNodes();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('IamTreeView.AddToFav', (node: any) => {
                this.AddToFav(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('IamTreeView.DeleteFromFav', (node: any) => {
                this.DeleteFromFav(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('IamTreeView.HideNode', (node: any) => {
                this.HideNode(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('IamTreeView.UnHideNode', (node: any) => {
                this.UnHideNode(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('IamTreeView.AddIamRole', async () => {
                await this.AddIamRole();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('IamTreeView.RemoveIamRole', async (node: any) => {
                await this.RemoveIamRole(wrap(node));
                treeProvider.refresh();
            })
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const nodes = this.treeDataProvider.GetIamRoleNodes();
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
        return await this.AddIamRole();
    }

    Refresh() {
        this.treeDataProvider.Refresh();
    }

    async AddIamRole(): Promise<WorkbenchTreeItem | undefined> {
        ui.logToOutput('IamService.AddIamRole Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) { return; }
        let selectedRoleName = await vscode.window.showInputBox({ placeHolder: 'Enter IAM Role Name / Search Text' });
        if (selectedRoleName === undefined) { return; }
        var resultRole = await api.GetIamRoleList(selectedRoleName);
        if (!resultRole.isSuccessful) { return; }
        let selectedRoleList = await vscode.window.showQuickPick(resultRole.result, { canPickMany: true, placeHolder: 'Select IAM Role(s)' });
        if (!selectedRoleList || selectedRoleList.length === 0) { return; }
        
        let lastAddedItem: IamTreeItem | undefined;
        for (var selectedRole of selectedRoleList) {
            lastAddedItem = this.treeDataProvider.AddIamRole(selectedRegion, selectedRole);
        }
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }

    async RemoveIamRole(node: IamTreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.IamRole || !node.Region || !node.IamRole) { return; }
        this.treeDataProvider.RemoveIamRole(node.Region, node.IamRole);
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

    async AddToFav(node: IamTreeItem) {
        if (!node) return;
        node.IsFav = true;
        this.treeDataProvider.Refresh();
    }

    async DeleteFromFav(node: IamTreeItem) {
        if (!node) return;
        node.IsFav = false;
        this.treeDataProvider.Refresh();
    }

    async HideNode(node: IamTreeItem) {
        if (!node) return;
        node.IsHidden = true;
        this.treeDataProvider.Refresh();
    }

    async UnHideNode(node: IamTreeItem) {
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
            this.IamRoleList = this.context.globalState.get('IamRoleList', []);
        } catch (error) {
            ui.logToOutput("IamService.loadState Error !!!");
        }
    }

    SaveState() {
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('IamRoleList', this.IamRoleList);
        } catch (error) {
            ui.logToOutput("IamService.saveState Error !!!");
        }
    }

    LoadPermissions(node: IamTreeItem) { /* ... */ }
    LoadTrustRelationships(node: IamTreeItem) { /* ... */ }
    LoadTags(node: IamTreeItem) { /* ... */ }
    LoadInfo(node: IamTreeItem) { /* ... */ }
}
