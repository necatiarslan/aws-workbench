import * as vscode from 'vscode';
import { ServiceManager } from '../services/ServiceManager';
import { WorkbenchTreeItem } from './WorkbenchTreeItem';

export class WorkbenchTreeProvider implements vscode.TreeDataProvider<WorkbenchTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<WorkbenchTreeItem | undefined | null | void> = new vscode.EventEmitter<WorkbenchTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<WorkbenchTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: WorkbenchTreeItem): vscode.TreeItem | Promise<vscode.TreeItem> {
        const service = ServiceManager.Instance.getService(element.serviceId);
        if (service && element.itemData) {
            try {
                return service.getTreeItem(element);
            } catch (error) {
                console.error(`Error getting tree item for ${element.label} (Service: ${element.serviceId}):`, error);
                const errorItem = new vscode.TreeItem(element.label || 'Error', vscode.TreeItemCollapsibleState.None);
                errorItem.description = 'Error loading item';
                errorItem.tooltip = error instanceof Error ? error.message : String(error);
                return errorItem;
            }
        }
        return element;
    }

    public async getChildren(element?: WorkbenchTreeItem): Promise<WorkbenchTreeItem[]> {
        if (!element) {
            const services = ServiceManager.Instance.getAllServices();
            const allRootNodes: WorkbenchTreeItem[] = [];
            for (const service of services) {
                try {
                    const roots = await service.getRootNodes();
                    allRootNodes.push(...roots);
                } catch (error) {
                    console.error(`Error loading root nodes for service ${service.serviceId}:`, error);
                    // Optionally push an error node so the user knows this service failed
                    allRootNodes.push(new WorkbenchTreeItem(
                        `${service.serviceId.toUpperCase()} (Error)`,
                        vscode.TreeItemCollapsibleState.None,
                        service.serviceId,
                        'error',
                        { error }
                    ));
                }
            }
            return allRootNodes;
        }

        const service = ServiceManager.Instance.getService(element.serviceId);
        if (service) {
            try {
                const children = await service.getChildren(element);
                return children;
            } catch (error) {
                console.error(`Error loading children for ${element.label} (Service: ${element.serviceId}):`, error);
                return [new WorkbenchTreeItem(
                    'Error loading children',
                    vscode.TreeItemCollapsibleState.None,
                    element.serviceId,
                    'error',
                    { error }
                )];
            }
        }

        return [];
    }
}
