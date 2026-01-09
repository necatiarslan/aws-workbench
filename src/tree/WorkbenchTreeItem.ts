import * as vscode from 'vscode';

export class WorkbenchTreeItem<T = any> extends vscode.TreeItem {
    public readonly serviceId: string;
    public readonly itemData?: T;

    constructor(
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        serviceId: string,
        contextValue?: string,
        itemData?: T
    ) {
        super(label, collapsibleState);
        this.serviceId = serviceId;
        this.contextValue = contextValue;
        this.itemData = itemData;
    }
}
