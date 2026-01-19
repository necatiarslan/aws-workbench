"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeView = void 0;
const vscode = require("vscode");
const NodeBase_1 = require("./NodeBase");
const TreeProvider_1 = require("./TreeProvider");
const Session_1 = require("../common/Session");
const ServiceHub_1 = require("./ServiceHub");
const TreeState_1 = require("./TreeState");
class TreeView {
    static Current;
    view;
    treeDataProvider;
    context;
    constructor(context) {
        TreeView.Current = this;
        this.context = context;
        this.treeDataProvider = new TreeProvider_1.TreeProvider();
        this.view = vscode.window.createTreeView('AwsWorkbenchView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
        context.subscriptions.push(this.view);
        this.RegisterCommands();
    }
    RegisterCommands() {
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
        vscode.commands.registerCommand('AwsWorkbench.Hide', (node) => {
            this.Hide(node);
        });
        vscode.commands.registerCommand('AwsWorkbench.UnHide', (node) => {
            this.UnHide(node);
        });
        vscode.commands.registerCommand('AwsWorkbench.AddFav', (node) => {
            this.AddFav(node);
        });
        vscode.commands.registerCommand('AwsWorkbench.RemoveFav', (node) => {
            this.RemoveFav(node);
        });
        vscode.commands.registerCommand('AwsWorkbench.ShowOnlyInThisProfile', (node) => {
            this.ShowOnlyInThisProfile(node);
        });
        vscode.commands.registerCommand('AwsWorkbench.ShowInAnyProfile', (node) => {
            this.ShowInAnyProfile(node);
        });
        vscode.commands.registerCommand('AwsWorkbench.NodeAdd', (node) => {
            this.NodeAdd(node);
        });
        vscode.commands.registerCommand('AwsWorkbench.NodeRemove', (node) => {
            this.NodeRemove(node);
        });
        vscode.commands.registerCommand('AwsWorkbench.NodeRefresh', (node) => {
            this.NodeRefresh(node);
        });
        vscode.commands.registerCommand('AwsWorkbench.NodeView', (node) => {
            this.NodeView(node);
        });
        vscode.commands.registerCommand('AwsWorkbench.NodeEdit', (node) => {
            this.NodeEdit(node);
        });
        vscode.commands.registerCommand('AwsWorkbench.NodeRun', (node) => {
            this.NodeRun(node);
        });
        vscode.commands.registerCommand('AwsWorkbench.NodeStop', (node) => {
            this.NodeStop(node);
        });
        vscode.commands.registerCommand('AwsWorkbench.NodeOpen', (node) => {
            this.NodeOpen(node);
        });
        vscode.commands.registerCommand('AwsWorkbench.NodeInfo', (node) => {
            this.NodeInfo(node);
        });
        vscode.commands.registerCommand('AwsWorkbench.BugAndNewFeatureRequest', () => {
            this.BugAndNewFeatureRequest();
        });
        vscode.commands.registerCommand('AwsWorkbench.Donate', () => {
            this.Donate();
        });
        vscode.commands.registerCommand('AwsWorkbench.Add', (node) => {
            this.Add(node);
        });
        vscode.commands.registerCommand('AwsWorkbench.Remove', (node) => {
            this.Remove(node);
        });
    }
    GetBoolenSign(value) {
        return value ? "✓ " : "✗ ";
    }
    async SetViewMessage() {
        const visibleNodeCount = NodeBase_1.NodeBase.RootNodes.filter(node => node.IsVisible).length;
        if (visibleNodeCount > 0) {
            this.view.message =
                await this.GetFilterProfilePrompt()
                    + this.GetBoolenSign(Session_1.Session.Current.IsShowOnlyFavorite) + "Fav, "
                    + this.GetBoolenSign(Session_1.Session.Current.IsShowHiddenNodes) + "Hidden, "
                    + (Session_1.Session.Current.FilterString ? `Filter: ${Session_1.Session.Current.FilterString}` : "");
        }
    }
    async GetFilterProfilePrompt() {
        return "Profile:" + Session_1.Session.Current.AwsProfile + " ";
    }
    async Remove(node) {
        if (!node) {
            return;
        }
        node.Remove();
        TreeState_1.TreeState.save();
    }
    async Add(node) {
        // Implementation for adding a resource to the tree view
        const result = [];
        result.push("Folder");
        result.push("Note");
        result.push("File");
        result.push("S3 Bucket");
        result.push("CloudWatch Log Group");
        let nodeType = await vscode.window.showQuickPick(result, { canPickMany: false, placeHolder: 'Select Item Type' });
        if (!nodeType) {
            return;
        }
        switch (nodeType) {
            case "Folder":
                await ServiceHub_1.ServiceHub.Current.FileSystemService.Add(node, "Folder");
                break;
            case "Note":
                await ServiceHub_1.ServiceHub.Current.FileSystemService.Add(node, "Note");
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
        TreeState_1.TreeState.save();
    }
    Refresh(node) {
        this.treeDataProvider.Refresh(node);
        this.SetViewMessage();
    }
    async Filter() {
        const filterString = await vscode.window.showInputBox({ placeHolder: 'Enter filter string', value: Session_1.Session.Current.FilterString });
        if (filterString === undefined) {
            return;
        }
        Session_1.Session.Current.FilterString = filterString;
        Session_1.Session.Current.SaveState();
        NodeBase_1.NodeBase.RootNodes.forEach(node => {
            node.SetVisible();
        });
        this.Refresh();
    }
    ShowOnlyFavorite() {
        Session_1.Session.Current.IsShowOnlyFavorite = !Session_1.Session.Current.IsShowOnlyFavorite;
        Session_1.Session.Current.SaveState();
        NodeBase_1.NodeBase.RootNodes.forEach(node => {
            node.SetVisible();
        });
        this.Refresh();
    }
    ShowHidden() {
        Session_1.Session.Current.IsShowHiddenNodes = !Session_1.Session.Current.IsShowHiddenNodes;
        Session_1.Session.Current.SaveState();
        NodeBase_1.NodeBase.RootNodes.forEach(node => {
            node.SetVisible();
        });
        this.Refresh();
    }
    async SelectAwsProfile() {
        await Session_1.Session.Current.SetAwsProfile();
        NodeBase_1.NodeBase.RootNodes.forEach(node => {
            node.SetVisible();
        });
        this.Refresh();
    }
    TestAwsConnection() {
        Session_1.Session.Current.TestAwsConnection();
    }
    SetAwsRegion() {
        Session_1.Session.Current.SetAwsRegion();
    }
    UpdateAwsEndPoint() {
        Session_1.Session.Current.SetAwsEndpoint();
    }
    Hide(node) {
        node.IsHidden = true;
        node.SetVisible();
        this.Refresh(node);
        TreeState_1.TreeState.save();
    }
    UnHide(node) {
        node.IsHidden = false;
        node.SetVisible();
        this.Refresh(node);
        TreeState_1.TreeState.save();
    }
    AddFav(node) {
        node.IsFavorite = true;
        node.SetVisible();
        this.Refresh(node);
        TreeState_1.TreeState.save();
    }
    RemoveFav(node) {
        node.IsFavorite = false;
        node.SetVisible();
        this.Refresh(node);
        TreeState_1.TreeState.save();
    }
    ShowOnlyInThisProfile(node) {
        node.AwsProfile = Session_1.Session.Current.AwsProfile;
        TreeState_1.TreeState.save();
    }
    ShowInAnyProfile(node) {
        node.AwsProfile = "";
        TreeState_1.TreeState.save();
    }
    NodeAdd(node) {
        node.NodeAdd();
    }
    NodeRemove(node) {
        node.NodeRemove();
    }
    NodeRefresh(node) {
        node.NodeRefresh();
    }
    NodeView(node) {
        node.NodeView();
    }
    NodeEdit(node) {
        node.NodeEdit();
    }
    NodeRun(node) {
        node.NodeRun();
    }
    NodeStop(node) {
        node.NodeStop();
    }
    NodeOpen(node) {
        node.NodeOpen();
    }
    NodeInfo(node) {
        node.NodeInfo();
    }
    BugAndNewFeatureRequest() {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/necatiarslan/aws-workbench/issues/new'));
    }
    Donate() {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/sponsors/necatiarslan'));
    }
}
exports.TreeView = TreeView;
//# sourceMappingURL=TreeView.js.map