import * as vscode from "vscode";
import { NodeBase } from "./NodeBase";
import { TreeProvider } from "./TreeProvider";
import { Session } from "../common/Session";
import { ServiceHub } from "./ServiceHub";
import { TreeState } from "./TreeState";
import * as ui from "../common/UI";

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

        vscode.commands.registerCommand('AwsWorkbench.ShowOnlyInThisWorkspace', (node: NodeBase) => {
            this.ShowOnlyInThisWorkspace(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.ShowInAnyWorkspace', (node: NodeBase) => {
            this.ShowInAnyWorkspace(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.NodeAdd', (node: NodeBase) => {
            this.NodeAdd(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.NodeRemove', (node: NodeBase) => {
            this.NodeRemove(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.NodeRefresh', (node: NodeBase) => {
            this.NodeRefresh(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.NodeView', (node: NodeBase) => {
            this.NodeView(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.NodeEdit', (node: NodeBase) => {
            this.NodeEdit(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.NodeRun', (node: NodeBase) => {
            this.NodeRun(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.NodeStop', (node: NodeBase) => {
            this.NodeStop(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.NodeOpen', (node: NodeBase) => {
            this.NodeOpen(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.NodeInfo', (node: NodeBase) => {
            this.NodeInfo(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.NodeAlias', (node: NodeBase) => {
            this.NodeAlias(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.BugAndNewFeatureRequest', () => {
            this.BugAndNewFeatureRequest();
        });

        vscode.commands.registerCommand('AwsWorkbench.Donate', () => {
            this.Donate();
        });

        vscode.commands.registerCommand('AwsWorkbench.ExportConfig', () => {
            this.ExportConfig();
        });

        vscode.commands.registerCommand('AwsWorkbench.ImportConfig', () => {
            this.ImportConfig();
        }); 

        vscode.commands.registerCommand('AwsWorkbench.Add', (node: NodeBase) => {
            this.Add(node);
        });

        vscode.commands.registerCommand('AwsWorkbench.Remove', (node: NodeBase) => {
            this.Remove(node);
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

    public async Remove(node: NodeBase): Promise<void> {
        if(!node){ return; }

        node.Remove();
        TreeState.save();
    }
    public async Add(node?: NodeBase): Promise<void> {
        if(node) { node.NodeAdd(); return; }
        
        //root node
        const result:string[] = [];
        result.push("Folder");
        result.push("Note");
        result.push("File");
        result.push("S3 Bucket");
        result.push("Lambda Function");
        result.push("Step Function");
        result.push("Glue Job");
        result.push("DynamoDB Table");
        result.push("CloudWatch Log Group");
        result.push("SNS Topic");
        result.push("SQS Queue");
        result.push("IAM Role");
        result.push("IAM Policy");
        let nodeType = await vscode.window.showQuickPick(result, {canPickMany:false, placeHolder: 'Select Item Type'});

        if(!nodeType){ return; }

        switch (nodeType) {
            case "Folder":
                await ServiceHub.Current.FileSystemService.Add(undefined, "Folder");
                break;
            case "Note":
                await ServiceHub.Current.FileSystemService.Add(undefined, "Note");
                break;
            case "File":
                await ServiceHub.Current.FileSystemService.Add(undefined, "File");
                break;
            case "S3 Bucket":
                await ServiceHub.Current.S3Service.Add(undefined);
                break;
            case "Lambda Function":
                await ServiceHub.Current.LambdaService.Add(undefined);
                break;
            case "Step Functions":
                await ServiceHub.Current.StepFunctionsService.Add(undefined);
                break;
            case "Glue Job":
                await ServiceHub.Current.GlueService.Add(undefined);
                break;
            case "DynamoDB Table":
                await ServiceHub.Current.DynamoDBService.Add(undefined);
                break;
            case "CloudWatch Log Group":
                await ServiceHub.Current.CloudWatchLogService.Add(undefined);
                break;
            case "SNS Topic":
                await ServiceHub.Current.SNSService.Add(undefined);
                break;
            case "SQS Queue":
                await ServiceHub.Current.SQSService.Add(undefined);
                break;
            case "IAM Role":
                await ServiceHub.Current.IamService.AddRole(undefined);
                break;
            case "IAM Policy":
                await ServiceHub.Current.IamService.AddPolicy(undefined);
                break;
            default:
                vscode.window.showErrorMessage('Unknown item type selected');
        }
        this.SetViewMessage();
        TreeState.save();
    }

    public Refresh(node?: NodeBase): void {
        this.treeDataProvider.Refresh(node);
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
        NodeBase.RootNodes.forEach(node => {
            node.SetVisible();
        });
        this.Refresh();
    }

    public ShowHidden(): void {
        Session.Current.IsShowHiddenNodes = !Session.Current.IsShowHiddenNodes;
        Session.Current.SaveState();
        NodeBase.RootNodes.forEach(node => {
            node.SetVisible();
        });
        this.Refresh();
    }

    public async SelectAwsProfile(): Promise<void> {
        await Session.Current.SetAwsProfile();
        NodeBase.RootNodes.forEach(node => {
            node.SetVisible();
        });
        this.Refresh();
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
        node.SetVisible();
        this.Refresh(node);
        TreeState.save();
    }

    public UnHide(node: NodeBase): void {
        node.IsHidden = false;
        node.SetVisible();
        this.Refresh(node);
        TreeState.save();
    }

    public AddFav(node: NodeBase): void {
        node.IsFavorite = true;
        node.SetVisible();
        this.Refresh(node);
        TreeState.save();
    }

    public RemoveFav(node: NodeBase): void {
        node.IsFavorite = false;
        node.SetVisible();
        this.Refresh(node);
        TreeState.save();
    }

    public ShowOnlyInThisProfile(node: NodeBase): void {
        node.AwsProfile = Session.Current.AwsProfile;
        TreeState.save();
    }

    public ShowInAnyProfile(node: NodeBase): void {
        node.AwsProfile = "";
        TreeState.save();
    }

    public ShowOnlyInThisWorkspace(node: NodeBase): void {
        if(!vscode.workspace.name){ 
            ui.showInfoMessage("Please open a workspace first.");
            return; 
        }

        node.Workspace =  vscode.workspace.name;
        TreeState.save();
    }

    public ShowInAnyWorkspace(node: NodeBase): void {
        node.Workspace = "";
        TreeState.save();
    }

    public NodeAdd(node: NodeBase): void {
        node.NodeAdd();
    }

    public NodeRemove(node: NodeBase): void {
        node.NodeRemove();
    }

    public NodeRefresh(node: NodeBase): void {
        node.NodeRefresh();
    }

    public NodeView(node: NodeBase): void {
        node.NodeView();
    }

    public NodeEdit(node: NodeBase): void {
        node.NodeEdit();
    }

    public NodeRun(node: NodeBase): void {
        node.NodeRun();
    }

    public NodeStop(node: NodeBase): void {
        node.NodeStop();
    }

    public NodeOpen(node: NodeBase): void {
        node.NodeOpen();
    }

    public NodeInfo(node: NodeBase): void {
        node.NodeInfo();
    }

    public NodeAlias(node: NodeBase): void {
        node.NodeAlias();
    }

	public BugAndNewFeatureRequest(): void {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/necatiarslan/aws-workbench/issues/new'));
	}
	public Donate(): void {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/sponsors/necatiarslan'));
	}

    public async ExportConfig(): Promise<void> {
        const filePath = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('aws-workbench.json'),
            saveLabel: 'Save',
            filters: {'JSON': ['json']},
        });
        if (!filePath) { return; }
        TreeState.save(filePath.fsPath);
    }

    public async ImportConfig(): Promise<void> {
        const filePath = await vscode.window.showOpenDialog({
            canSelectMany: false,
            canSelectFiles: true,
            canSelectFolders: false,
            defaultUri: vscode.Uri.file('aws-workbench.json'),
            filters: {'JSON': ['json']},
        });
        if (!filePath) { return; }
        TreeState.load(filePath[0].fsPath);
    }

}