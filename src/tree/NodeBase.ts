import * as vscode from 'vscode';

export abstract class NodeBase extends vscode.TreeItem {
   
    constructor(label: string, parent?: NodeBase) 
    {
        super(label);
        // Set parent and add this item to the parent's children
        this.Parent = parent || null;
        if (this.Parent) {
            this.Parent.Children.push(this);
        }
    }

    public IsFavorite: boolean = false;
    public IsHidden: boolean = false;
    public Parent: NodeBase | null = null;
    public Children: NodeBase[] = [];
    public Icon: string = "";
    public IsRunning: boolean = false;



}
