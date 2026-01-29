import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { TreeProvider } from '../tree/TreeProvider';
import { IamInfoNode } from './IamInfoNode';

export class IamInfoGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "info";
        
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    // Info items to display - set by parent node before refresh
    public InfoItems: { key: string; value: string }[] = [];

    public async handleNodeRefresh(): Promise<void> {
        // Clear existing children
        this.Children = [];

        // Add info items as children
        for (const item of this.InfoItems) {
            const infoNode = new IamInfoNode(`${item.key}: ${item.value}`, this);
            infoNode.Key = item.key;
            infoNode.Value = item.value;
        }

        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }

        TreeProvider.Current.Refresh(this);
    }

    public SetInfoItems(items: { key: string; value: string }[]): void {
        this.InfoItems = items;
    }

}
