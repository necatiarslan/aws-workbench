"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeView = void 0;
const vscode = require("vscode");
const TreeProvider_1 = require("./TreeProvider");
const Session_1 = require("../common/Session");
const ServiceHub_1 = require("./ServiceHub");
class TreeView {
    static Current;
    view;
    treeDataProvider;
    context;
    constructor(context) {
        TreeView.Current = this;
        this.context = context;
        this.treeDataProvider = new TreeProvider_1.TreeProvider();
        this.view = vscode.window.createTreeView('AwsWorkbenchTree', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
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
        vscode.commands.registerCommand('AwsWorkbench.BugAndNewFeatureRequest', () => {
            this.BugAndNewFeatureRequest();
        });
        vscode.commands.registerCommand('AwsWorkbench.Donate', () => {
            this.Donate();
        });
        vscode.commands.registerCommand('AwsWorkbench.Add', (node) => {
            this.Add(node);
        });
    }
    GetBoolenSign(value) {
        return value ? "✓ " : "✗ ";
    }
    async SetFilterMessage() {
        if (1 === 1) {
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
    async Add(node) {
        // Implementation for adding a resource to the tree view
        const result = [];
        result.push("Folder");
        result.push("File");
        result.push("S3 Bucket");
        result.push("CloudWatch Log Group");
        let nodeType = await vscode.window.showQuickPick(result, { canPickMany: false, placeHolder: 'Select Item Type' });
        if (!nodeType) {
            return;
        }
        switch (nodeType) {
            case "Folder":
                ServiceHub_1.ServiceHub.Current.FileSystemService.Add(node, "Folder");
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
    }
    Refresh() {
        // Implementation for refreshing the tree view
    }
    Filter() {
        // Implementation for refreshing the tree view
    }
    ShowOnlyFavorite() {
        // Implementation for showing only favorite items
        Session_1.Session.Current.IsShowOnlyFavorite = !Session_1.Session.Current.IsShowOnlyFavorite;
        Session_1.Session.Current.SaveState();
        this.Refresh();
    }
    ShowHidden() {
        // Implementation for showing hidden items
        Session_1.Session.Current.IsShowHiddenNodes = !Session_1.Session.Current.IsShowHiddenNodes;
        Session_1.Session.Current.SaveState();
        this.Refresh();
    }
    SelectAwsProfile() {
        // Implementation for showing hidden items
        Session_1.Session.Current.SetAwsProfile();
    }
    TestAwsConnection() {
        // Implementation for showing hidden items
        Session_1.Session.Current.TestAwsConnection();
    }
    SetAwsRegion() {
        // Implementation for showing hidden items
        Session_1.Session.Current.SetAwsRegion();
    }
    UpdateAwsEndPoint() {
        // Implementation for showing hidden items
        Session_1.Session.Current.SetAwsEndpoint();
    }
    Hide(node) {
        // Implementation for hiding items
    }
    UnHide(node) {
        // Implementation for unhiding items
    }
    AddFav(node) {
        // Implementation for adding to favorites
    }
    RemoveFav(node) {
        // Implementation for removing from favorites
    }
    ShowOnlyInThisProfile(node) {
        // Implementation for showing only items in this profile
    }
    ShowInAnyProfile(node) {
        // Implementation for showing items in any profile
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