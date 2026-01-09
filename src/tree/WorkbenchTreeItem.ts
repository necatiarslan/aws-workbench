import * as vscode from 'vscode';

export class WorkbenchTreeItem<T = any> extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly serviceId: string,
        public readonly contextValue?: string,
        public readonly itemData?: T
    ) {
        super(label, collapsibleState);
    }
}
