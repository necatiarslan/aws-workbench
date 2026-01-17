import * as vscode from 'vscode';

export abstract class TreeItemBase extends vscode.TreeItem {
   
    constructor(label: string, parent?: TreeItemBase) 
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
    public Parent: TreeItemBase | null = null;
    public Children: TreeItemBase[] = [];
    public Icon: string = "";
    public IsRunning: boolean = false;



}
