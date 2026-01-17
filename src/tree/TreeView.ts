import * as vscode from "vscode";
import { NodeBase } from "./NodeBase";
import { TreeProvider } from "./TreeProvider";
import { Session } from "../common/Session";

export class TreeView {

    public static Current: TreeView;
	public view: vscode.TreeView<NodeBase>;
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

        vscode.commands.registerCommand('AwsWorkbench.SelectAwsProfile', () => {
            this.SelectAwsProfile();
        });

        vscode.commands.registerCommand('AwsWorkbench.TestAwsConnection', () => {
            this.TestAwsConnection();
        });

        vscode.commands.registerCommand('AwsWorkbench.SetAwsRegion', () => {
            this.SetAwsRegion();
        });

        vscode.commands.registerCommand('AwsWorkbench.UpdateAwsEndPoint', () => {
            this.UpdateAwsEndPoint();
        });

        vscode.commands.registerCommand('AwsWorkbench.Hide', (node?: NodeBase) => {
            this.Hide(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.UnHide', (node?: NodeBase) => {
            this.UnHide(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.AddFav', (node?: NodeBase) => {
            this.AddFav(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.RemoveFav', (node?: NodeBase) => {
            this.RemoveFav(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.ShowOnlyInThisProfile', (node?: NodeBase) => {
            this.ShowOnlyInThisProfile(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.ShowInAnyProfile', (node?: NodeBase) => {
            this.ShowInAnyProfile(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.BugAndNewFeatureRequest', () => {
            this.BugAndNewFeatureRequest();
        });

        vscode.commands.registerCommand('AwsWorkbench.Donate', () => {
            this.Donate();
        });

        vscode.commands.registerCommand('AwsWorkbench.Add', (node?: NodeBase) => {
            this.Add(node);
        });
    }

	GetBoolenSign(value: boolean): string {
		return value ? "✓ " : "✗ ";
	}

	async SetFilterMessage() {
		if (1 === 1) {
			this.view.message = 
				await this.GetFilterProfilePrompt()
				+ this.GetBoolenSign(Session.Current.IsShowOnlyFavorite) + "Fav, " 
				+ this.GetBoolenSign(Session.Current.IsShowHiddenNodes) + "Hidden, "
				+ (Session.Current.FilterString ? `Filter: ${Session.Current.FilterString}` : "");
		}
	}

	async GetFilterProfilePrompt() {
		return "Profile:" + Session.Current.AwsProfile + " ";
	}

    public Add(node?: NodeBase): void {
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
        Session.Current.IsShowOnlyFavorite = !Session.Current.IsShowOnlyFavorite;
        Session.Current.SaveState();
        this.Refresh();
    }

    public ShowHidden(): void {
        // Implementation for showing hidden items
        Session.Current.IsShowHiddenNodes = !Session.Current.IsShowHiddenNodes;
        Session.Current.SaveState();
        this.Refresh();
    }

    public SelectAwsProfile(): void {
        // Implementation for showing hidden items
        Session.Current.SetAwsProfile();
    }

    public TestAwsConnection(): void {
        // Implementation for showing hidden items
        Session.Current.TestAwsConnection();
    }

    public SetAwsRegion(): void {
        // Implementation for showing hidden items
        Session.Current.SetAwsRegion();
    }

    public UpdateAwsEndPoint(): void {
        // Implementation for showing hidden items
        Session.Current.SetAwsEndpoint();
    }

    public Hide(node?: NodeBase): void {
        // Implementation for hiding items
    }

    public UnHide(node?: NodeBase): void {
        // Implementation for unhiding items
    }

    public AddFav(node?: NodeBase): void {
        // Implementation for adding to favorites
    }

    public RemoveFav(node?: NodeBase): void {
        // Implementation for removing from favorites
    }

    public ShowOnlyInThisProfile(node?: NodeBase): void {
        // Implementation for showing only items in this profile
    }

    public ShowInAnyProfile(node?: NodeBase): void {
        // Implementation for showing items in any profile
    }

	public BugAndNewFeatureRequest(): void {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/necatiarslan/aws-workbench/issues/new'));
	}
	public Donate(): void {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/sponsors/necatiarslan'));
	}

}