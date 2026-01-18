import * as vscode from "vscode";
import { NodeBase } from "./NodeBase";
import { TreeProvider } from "./TreeProvider";
import { Session } from "../common/Session";
import { ServiceHub } from "./ServiceHub";

export class TreeView {

    public static Current: TreeView;
	public view: vscode.TreeView<NodeBase>;
	public treeDataProvider: TreeProvider;
	public context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
		TreeView.Current = this;
		this.context = context;
		this.treeDataProvider = new TreeProvider();
		this.view = vscode.window.createTreeView('AwsWorkbenchView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
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

        vscode.commands.registerCommand('AwsWorkbench.Hide', (node: NodeBase) => {
            this.Hide(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.UnHide', (node: NodeBase) => {
            this.UnHide(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.AddFav', (node: NodeBase) => {
            this.AddFav(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.RemoveFav', (node: NodeBase) => {
            this.RemoveFav(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.ShowOnlyInThisProfile', (node: NodeBase) => {
            this.ShowOnlyInThisProfile(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.ShowInAnyProfile', (node: NodeBase) => {
            this.ShowInAnyProfile(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.BugAndNewFeatureRequest', () => {
            this.BugAndNewFeatureRequest();
        });

        vscode.commands.registerCommand('AwsWorkbench.Donate', () => {
            this.Donate();
        });

        vscode.commands.registerCommand('AwsWorkbench.Add', (node: NodeBase) => {
            this.Add(node);
        });
    }

	GetBoolenSign(value: boolean): string {
		return value ? "✓ " : "✗ ";
	}

	public async SetViewMessage() {
        const visibleNodeCount = NodeBase.RootNodes.filter(node => node.IsVisible).length;
		if (visibleNodeCount > 0) {
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

    public async Add(node?: NodeBase): Promise<void> {
        // Implementation for adding a resource to the tree view
        const result:string[] = [];
        result.push("Folder");
        result.push("File");
        result.push("S3 Bucket");
        result.push("CloudWatch Log Group");
        let nodeType = await vscode.window.showQuickPick(result, {canPickMany:false, placeHolder: 'Select Item Type'});

        if(!nodeType){ return; }

        switch (nodeType) {
            case "Folder":
                ServiceHub.Current.FileSystemService.Add(node, "Folder");
                break;
            case "File":
                // Logic to add a file
                vscode.window.showInformationMessage('Add File selected');
                break;
            case "S3 Bucket":
                // Logic to add an S3 Bucket
                vscode.window.showInformationMessage('Add S3 Bucket selected');
                break;
            case "CloudWatch Log Group":
                // Logic to add a CloudWatch Log Group
                vscode.window.showInformationMessage('Add CloudWatch Log Group selected');
                break;
            default:
                vscode.window.showErrorMessage('Unknown item type selected');
        }
        this.SetViewMessage();
    }

    public Refresh(): void {
        this.treeDataProvider.Refresh();
        this.SetViewMessage();
    }

    public async Filter(): Promise<void> {
        const filterString = await vscode.window.showInputBox({ placeHolder: 'Enter filter string', value: Session.Current.FilterString });
        if(filterString === undefined){ return; }
        
        Session.Current.FilterString = filterString;
        Session.Current.SaveState();
        NodeBase.RootNodes.forEach(node => {
            node.SetVisible();
        });
        this.Refresh();
    }

    public ShowOnlyFavorite(): void {
        Session.Current.IsShowOnlyFavorite = !Session.Current.IsShowOnlyFavorite;
        Session.Current.SaveState();
        this.Refresh();
    }

    public ShowHidden(): void {
        Session.Current.IsShowHiddenNodes = !Session.Current.IsShowHiddenNodes;
        Session.Current.SaveState();
        this.Refresh();
    }

    public SelectAwsProfile(): void {
        Session.Current.SetAwsProfile();
    }

    public TestAwsConnection(): void {
        Session.Current.TestAwsConnection();
    }

    public SetAwsRegion(): void {
        Session.Current.SetAwsRegion();
    }

    public UpdateAwsEndPoint(): void {
        Session.Current.SetAwsEndpoint();
    }

    public Hide(node: NodeBase): void {
        node.IsHidden = true;
    }

    public UnHide(node: NodeBase): void {
        node.IsHidden = false;
    }

    public AddFav(node: NodeBase): void {
        node.IsFavorite = true;
    }

    public RemoveFav(node: NodeBase): void {
        node.IsFavorite = false;
    }

    public ShowOnlyInThisProfile(node: NodeBase): void {
        node.AwsProfile = Session.Current.AwsProfile;
    }

    public ShowInAnyProfile(node: NodeBase): void {
        node.AwsProfile = "";
    }

	public BugAndNewFeatureRequest(): void {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/necatiarslan/aws-workbench/issues/new'));
	}
	public Donate(): void {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/sponsors/necatiarslan'));
	}

}