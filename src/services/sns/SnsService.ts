import * as vscode from 'vscode';
import { AbstractAwsService } from '../AbstractAwsService';
import { SnsTreeDataProvider } from './SnsTreeDataProvider';
import { SnsTreeItem } from './SnsTreeItem';
import { TreeItemType } from '../../tree/TreeItemType';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import * as ui from '../../common/UI';
import * as api from './API';

export class SnsService extends AbstractAwsService {
    public static Instance: SnsService;
    public serviceId = 'sns';
    public treeDataProvider: SnsTreeDataProvider;
    public context: vscode.ExtensionContext;
    
    public FilterString: string = "";
    public isShowOnlyFavorite: boolean = false;
    public isShowHiddenNodes: boolean = false;
    public AwsProfile: string = "default";	
    public AwsEndPoint: string | undefined;

    public TopicList: {Region: string, TopicArn: string}[] = [];

    constructor(context: vscode.ExtensionContext) {
        super();
        SnsService.Instance = this;
        this.context = context;
        this.loadBaseState();
        this.treeDataProvider = new SnsTreeDataProvider();
        this.LoadState();
        this.Refresh();
    }

    registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider, treeView: vscode.TreeView<WorkbenchTreeItem>): void {
        const wrap = (node: any) => {
            if (node instanceof WorkbenchTreeItem) {
                return node.itemData as SnsTreeItem;
            }
            return node as SnsTreeItem;
        };

        context.subscriptions.push(
            vscode.commands.registerCommand('aws-workbench.sns.Refresh', () => {
                this.Refresh();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.sns.Filter', async () => {
                await this.Filter();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.sns.ShowOnlyFavorite', async () => {
                await this.ShowOnlyFavorite();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.sns.ShowHiddenNodes', async () => {
                await this.ShowHiddenNodes();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.sns.AddToFav', (node: any) => {
                this.AddToFav(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.sns.DeleteFromFav', (node: any) => {
                this.DeleteFromFav(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.sns.HideNode', (node: any) => {
                this.HideNode(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.sns.UnHideNode', (node: any) => {
                this.UnHideNode(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.sns.AddTopic', async () => {
                await this.AddTopic();
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.sns.RemoveTopic', async (node: any) => {
                await this.RemoveTopic(wrap(node));
                treeProvider.refresh();
            }),
            vscode.commands.registerCommand('aws-workbench.sns.PublishMessage', async (node: any) => {
                await this.PublishMessage(wrap(node));
            })
        );
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        const nodes = this.treeDataProvider.GetSnsNodes();
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
            if (n.TopicArn) {
                item.id = n.TopicArn;
            } else if (n.Region && n.TopicName) {
                item.id = `${n.Region}:${n.TopicName}:${n.TreeItemType ?? ''}`;
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
        return await this.AddTopic();
    }

    Refresh() {
        this.treeDataProvider.Refresh();
    }

    async AddTopic(): Promise<WorkbenchTreeItem | undefined> {
        ui.logToOutput('SnsService.AddTopic Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) { return; }
        let selectedTopicName = await vscode.window.showInputBox({ placeHolder: 'Enter Topic Name / Search Text' });
        if (selectedTopicName === undefined) { return; }
        var resultTopic = await api.GetSnsTopicList(selectedRegion, selectedTopicName);
        if (!resultTopic.isSuccessful) { return; }
        let selectedTopicList = await vscode.window.showQuickPick(resultTopic.result, { canPickMany: true, placeHolder: 'Select Topic(s)' });
        if (!selectedTopicList || selectedTopicList.length === 0) { return; }
        
        let lastAddedItem: SnsTreeItem | undefined;
        for (var selectedTopic of selectedTopicList) {
            lastAddedItem = this.treeDataProvider.AddTopic(selectedRegion, selectedTopic);
        }
        this.SaveState();
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }

    async RemoveTopic(node: SnsTreeItem) {
        if (!node || node.TreeItemType !== TreeItemType.SNSTopic || !node.Region || !node.TopicArn) { return; }
        this.treeDataProvider.RemoveTopic(node.Region, node.TopicArn);
        this.SaveState();
    }

    async PublishMessage(node: SnsTreeItem) {
        if (!node || !node.Region || !node.TopicArn) return;
        ui.logToOutput('SnsService.PublishMessage Started');
        let message = await vscode.window.showInputBox({ placeHolder: 'Enter Message Body' });
        if (message === undefined) return;
        let result = await api.PublishMessage(node.Region, node.TopicArn, message);
        if (result.isSuccessful) {
            ui.showInfoMessage('Message Published Successfully');
        }
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

    async AddToFav(node: SnsTreeItem) {
        if (!node) return;
        this.addToFav(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }

    async DeleteFromFav(node: SnsTreeItem) {
        if (!node) return;
        this.deleteFromFav(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }

    async HideNode(node: SnsTreeItem) {
        if (!node) return;
        this.hideResource(this.mapToWorkbenchItem(node));
        this.treeDataProvider.Refresh();
    }

    async UnHideNode(node: SnsTreeItem) {
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
            this.TopicList = this.context.globalState.get('TopicList', []);
        } catch (error) {
            ui.logToOutput("SnsService.loadState Error !!!");
        }
    }

    SaveState() {
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('TopicList', this.TopicList);
            this.saveBaseState();
        } catch (error) {
            ui.logToOutput("SnsService.saveState Error !!!");
        }
    }

    public override addToFav(node: WorkbenchTreeItem) {
        const data = node.itemData as SnsTreeItem | undefined;
        if (data) { data.IsFav = true; data.setContextValue(); }
        super.addToFav(node);
    }

    public override deleteFromFav(node: WorkbenchTreeItem) {
        const data = node.itemData as SnsTreeItem | undefined;
        if (data) { data.IsFav = false; data.setContextValue(); }
        super.deleteFromFav(node);
    }

    public override hideResource(node: WorkbenchTreeItem) {
        const data = node.itemData as SnsTreeItem | undefined;
        if (data) { data.IsHidden = true; data.setContextValue(); }
        super.hideResource(node);
    }

    public override unhideResource(node: WorkbenchTreeItem) {
        const data = node.itemData as SnsTreeItem | undefined;
        if (data) { data.IsHidden = false; data.setContextValue(); }
        super.unhideResource(node);
    }

    public override showOnlyInProfile(node: WorkbenchTreeItem, profile: string) {
        const data = node.itemData as SnsTreeItem | undefined;
        if (data) { data.ProfileToShow = profile; data.setContextValue(); }
        super.showOnlyInProfile(node, profile);
    }

    public override showInAnyProfile(node: WorkbenchTreeItem) {
        const data = node.itemData as SnsTreeItem | undefined;
        if (data) { data.ProfileToShow = ""; data.setContextValue(); }
        super.showInAnyProfile(node);
    }
}
