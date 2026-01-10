import * as vscode from 'vscode';
import { AbstractAwsService } from '../AbstractAwsService';
import { Session } from '../../common/Session';
import { IamTreeDataProvider } from './IamTreeDataProvider';
import { IamTreeItem } from './IamTreeItem';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import * as ui from '../../common/UI';
import * as api from './API';

export class IamService extends AbstractAwsService {
    public static Instance: IamService;
    public serviceId = 'iam';
    public treeDataProvider: IamTreeDataProvider;
    public context: vscode.ExtensionContext;

    public IamRoleList: {Region: string, IamRole: string}[] = [];

    constructor(context: vscode.ExtensionContext) {
        super();
        IamService.Instance = this;
        this.context = context;
        this.loadBaseState();
        this.loadCustomResources();
        this.treeDataProvider = new IamTreeDataProvider();
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
            vscode.commands.registerCommand('aws-workbench.iam.Refresh', () => {
                this.Refresh();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.iam.AddIamRole', async () => {
                await this.AddIamRole();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.iam.RemoveIamRole', async (node: any) => {
                await this.RemoveIamRole(wrap(node));
                treeProvider.refresh();
            })
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const nodes = this.treeDataProvider.GetIamRoleNodes();
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
            if (n.Region && n.IamRole) {
                item.id = `${n.Region}:${n.IamRole}:${n.TreeItemType ?? ''}`;
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
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }

    async RemoveIamRole(node: IamTreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.IAMRole || !node.Region || !node.IamRole) { return; }
        this.treeDataProvider.RemoveIamRole(node.Region, node.IamRole);
    }

    LoadPermissions(node: IamTreeItem) { /* ... */ }
    LoadTrustRelationships(node: IamTreeItem) { /* ... */ }
    LoadTags(node: IamTreeItem) { /* ... */ }
    LoadInfo(node: IamTreeItem) { /* ... */ }

    public override addToFav(node: WorkbenchTreeItem) {
        const data = node.itemData as IamTreeItem | undefined;
        if (data) { data.IsFav = true; data.setContextValue(); }
        super.addToFav(node);
    }

    public override deleteFromFav(node: WorkbenchTreeItem) {
        const data = node.itemData as IamTreeItem | undefined;
        if (data) { data.IsFav = false; data.setContextValue(); }
        super.deleteFromFav(node);
    }

    public override hideResource(node: WorkbenchTreeItem) {
        const data = node.itemData as IamTreeItem | undefined;
        if (data) { data.IsHidden = true; data.setContextValue(); }
        super.hideResource(node);
    }

    public override unhideResource(node: WorkbenchTreeItem) {
        const data = node.itemData as IamTreeItem | undefined;
        if (data) { data.IsHidden = false; data.setContextValue(); }
        super.unhideResource(node);
    }

    public override showOnlyInProfile(node: WorkbenchTreeItem, profile: string) {
        const data = node.itemData as IamTreeItem | undefined;
        if (data) { data.ProfileToShow = profile; data.setContextValue(); }
        super.showOnlyInProfile(node, profile);
    }

    public override showInAnyProfile(node: WorkbenchTreeItem) {
        const data = node.itemData as IamTreeItem | undefined;
        if (data) { data.ProfileToShow = ""; data.setContextValue(); }
        super.showInAnyProfile(node);
    }
}
