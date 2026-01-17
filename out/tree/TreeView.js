"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeView = void 0;
const vscode = require("vscode");
const TreeProvider_1 = require("./TreeProvider");
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
        vscode.commands.registerCommand('AwsWorkbench.BugAndNewFeatureRequest', () => {
            this.BugAndNewFeatureRequest();
        });
        vscode.commands.registerCommand('AwsWorkbench.Donate', () => {
            this.Donate();
        });
        vscode.commands.registerCommand('AwsWorkbench.Add', () => {
            this.Add();
        });
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
    Hide() {
        // Implementation for hiding items
    }
    UnHide() {
        // Implementation for unhiding items
    }
    AddFav() {
        // Implementation for adding to favorites
    }
    RemoveFav() {
        // Implementation for removing from favorites
    }
    ShowOnlyInThisProfile() {
        // Implementation for showing only items in this profile
    }
    ShowInAnyProfile() {
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