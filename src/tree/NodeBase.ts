import * as vscode from 'vscode';
import { TreeProvider } from './TreeProvider';

export abstract class NodeBase extends vscode.TreeItem {
   
    public static RootNodes: NodeBase[] = [];

    constructor(label: string, parent?: NodeBase) 
    {
        super(label);
        // Set parent and add this item to the parent's children
        this.Parent = parent || undefined;
        if (this.Parent) {
            this.Parent.Children.push(this);
            this.Parent.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        } else {
            NodeBase.RootNodes.push(this);
        }
        TreeProvider.Current.Refresh(this);
    }

    public IsFavorite: boolean = false;
    public IsHidden: boolean = false;
    public Parent: NodeBase | undefined = undefined;
    public Children: NodeBase[] = [];
    private _icon: string = "";

    public get Icon(): string {
        return this._icon;
    }

    public set Icon(value: string) {
        this._icon = value;
        this.iconPath = new vscode.ThemeIcon(this._icon);
    }


    public IsRunning: boolean = false;

    public Remove(): void {
        if (this.Parent) {
            const index = this.Parent.Children.indexOf(this);
            if (index > -1) {
                this.Parent.Children.splice(index, 1);
                if (this.Parent.Children.length === 0) {
                    this.Parent.collapsibleState = vscode.TreeItemCollapsibleState.None;
                }
            }
        } else {
            const index = NodeBase.RootNodes.indexOf(this);
            if (index > -1) {
                NodeBase.RootNodes.splice(index, 1);
            }
        }
        TreeProvider.Current.Refresh(this.Parent);
    }

}
