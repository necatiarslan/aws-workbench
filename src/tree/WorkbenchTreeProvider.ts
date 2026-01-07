import * as vscode from 'vscode';
import { ServiceManager } from '../services/ServiceManager';
import { WorkbenchTreeItem } from './WorkbenchTreeItem';

export class WorkbenchTreeProvider implements vscode.TreeDataProvider<WorkbenchTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<WorkbenchTreeItem | undefined | null | void> = new vscode.EventEmitter<WorkbenchTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<WorkbenchTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private rootNodes: WorkbenchTreeItem[] = [];

    constructor(private context: vscode.ExtensionContext) {
        this.loadRootNodes();
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: WorkbenchTreeItem): vscode.TreeItem | Promise<vscode.TreeItem> {
        const service = ServiceManager.Instance.getService(element.serviceId);
        if (service && element.itemData) {
            return service.getTreeItem(element);
        }
        return element;
    }

    public async getChildren(element?: WorkbenchTreeItem): Promise<WorkbenchTreeItem[]> {
        if (!element) {
            const services = ServiceManager.Instance.getAllServices();
            const allRootNodes: WorkbenchTreeItem[] = [];
            for (const service of services) {
                const roots = await service.getRootNodes();
                allRootNodes.push(...roots);
            }
            return allRootNodes;
        }

        const service = ServiceManager.Instance.getService(element.serviceId);
        if (service) {
            const children = await service.getChildren(element);
            return children;
        }

        return [];
    }

    private loadRootNodes() {
        const savedNodes = this.context.globalState.get<any[]>('workbench.rootNodes', []);
        this.rootNodes = savedNodes.map(n => new WorkbenchTreeItem(
            n.label,
            vscode.TreeItemCollapsibleState.Collapsed,
            n.serviceId,
            n.contextValue,
            n.itemData
        ));
    }

    public persistRootNodes() {
        const nodesToSave = this.rootNodes.map(n => ({
            label: n.label,
            serviceId: n.serviceId,
            contextValue: n.contextValue,
            itemData: n.itemData
        }));
        this.context.globalState.update('workbench.rootNodes', nodesToSave);
    }

    public addRootNode(node: WorkbenchTreeItem) {
        this.rootNodes.push(node);
        this.persistRootNodes();
        this.refresh();
    }

    public removeRootNode(node: WorkbenchTreeItem) {
        this.rootNodes = this.rootNodes.filter(n => n !== node);
        this.persistRootNodes();
        this.refresh();
    }
}
