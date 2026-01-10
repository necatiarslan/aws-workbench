import * as vscode from 'vscode';

export class WorkbenchTreeItem<T = any> extends vscode.TreeItem {
    public readonly serviceId: string;
    public readonly itemData?: T;
    public parentFolderId?: string;
    public isCustom: boolean = false;
    public isFolder: boolean = false;
    public compositeKey?: string;
    public displayName?: string;
    public awsName?: string;

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
