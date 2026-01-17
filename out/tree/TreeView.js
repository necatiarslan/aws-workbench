"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeView = void 0;
const vscode = require("vscode");
const TreeProvider_1 = require("./TreeProvider");
const Session_1 = require("../common/Session");
class TreeView {
    static Current;
    view;
    treeDataProvider;
    context;
    constructor(context) {
        TreeView.Current = this;
        this.context = context;
        this.treeDataProvider = new TreeProvider_1.TreeProvider(context);
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
    Add(node) {
        // Implementation for adding a resource to the tree view
    }
    Refresh() {
        // Implementation for refreshing the tree view
    }
    Filter() {
        // Implementation for refreshing the tree view
    }
    ShowOnlyFavorite() {
        // Implementation for showing only favorite items
    }
    ShowHidden() {
        // Implementation for showing hidden items
    }
    SelectAwsProfile() {
        // Implementation for showing hidden items
    }
    TestAwsConnection() {
        // Implementation for showing hidden items
    }
    SetAwsRegion() {
        // Implementation for showing hidden items
    }
    UpdateAwsEndPoint() {
        // Implementation for showing hidden items
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