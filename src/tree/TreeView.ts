import * as vscode from "vscode";
import { TreeItemBase } from "./TreeItemBase";
import { TreeProvider } from "./TreeProvider";

export class TreeView {

    public static Current: TreeView;
	public view: vscode.TreeView<TreeItemBase>;
	public treeDataProvider: TreeProvider;
	public context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
		TreeView.Current = this;
		this.context = context;
		this.treeDataProvider = new TreeProvider(context);
		this.view = vscode.window.createTreeView('AwsWorkbenchTree', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
		context.subscriptions.push(this.view);
        this.RegisterCommands();
	}

    public RegisterCommands(): void {
        vscode.commands.registerCommand('AwsWorkbench.Refresh', () => {
            this.Refresh();
        });

        vscode.commands.registerCommand('AwsWorkbench.Filter', () => {
            this.Filter();
        });

        vscode.commands.registerCommand('AwsWorkbench.ShowOnlyFavorite', () => {
            this.ShowOnlyFavorite();
        });

        vscode.commands.registerCommand('AwsWorkbench.ShowHidden', () => {
            this.ShowHidden();
        });

        vscode.commands.registerCommand('AwsWorkbench.Hide', () => {
            this.Hide();
        });

        vscode.commands.registerCommand('AwsWorkbench.UnHide', () => {
            this.UnHide();
        });

        vscode.commands.registerCommand('AwsWorkbench.AddFav', () => {
            this.AddFav();
        });

        vscode.commands.registerCommand('AwsWorkbench.RemoveFav', () => {
            this.RemoveFav();
        });

        vscode.commands.registerCommand('AwsWorkbench.ShowOnlyInThisProfile', () => {
            this.ShowOnlyInThisProfile();
        });

        vscode.commands.registerCommand('AwsWorkbench.ShowInAnyProfile', () => {
            this.ShowInAnyProfile();
        });

        vscode.commands.registerCommand('AwsWorkbench.Add', () => {
            this.Add();
        });
    }

    public Add(treeItem?: TreeItemBase): void {
        // Implementation for adding a resource to the tree view
    }

    public Refresh(): void {
        // Implementation for refreshing the tree view
    }

    public Filter(): void {
        // Implementation for refreshing the tree view
    }

    public ShowOnlyFavorite(): void {
        // Implementation for showing only favorite items
    }

    public ShowHidden(): void {
        // Implementation for showing hidden items
    }

    public Hide(): void {
        // Implementation for hiding items
    }

    public UnHide(): void {
        // Implementation for unhiding items
    }

    public AddFav(): void {
        // Implementation for adding to favorites
    }

    public RemoveFav(): void {
        // Implementation for removing from favorites
    }

    public ShowOnlyInThisProfile(): void {
        // Implementation for showing only items in this profile
    }

    public ShowInAnyProfile(): void {
        // Implementation for showing items in any profile
    }

}