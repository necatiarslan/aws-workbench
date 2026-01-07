"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const ui = require("./common/UI");
const IamTreeView_1 = require("./iam/IamTreeView");
function activate(context) {
    ui.logToOutput('Aws Iam Extension activation started');
    let treeView = new IamTreeView_1.IamTreeView(context);
    vscode.commands.registerCommand('IamTreeView.Refresh', () => {
        treeView.Refresh();
    });
    vscode.commands.registerCommand('IamTreeView.Filter', () => {
        treeView.Filter();
    });
    vscode.commands.registerCommand('IamTreeView.ShowOnlyFavorite', () => {
        treeView.ShowOnlyFavorite();
    });
    vscode.commands.registerCommand('IamTreeView.ShowHiddenNodes', () => {
        treeView.ShowHiddenNodes();
    });
    vscode.commands.registerCommand('IamTreeView.AddToFav', (node) => {
        treeView.AddToFav(node);
    });
    vscode.commands.registerCommand('IamTreeView.DeleteFromFav', (node) => {
        treeView.DeleteFromFav(node);
    });
    vscode.commands.registerCommand('IamTreeView.HideNode', (node) => {
        treeView.HideNode(node);
    });
    vscode.commands.registerCommand('IamTreeView.UnHideNode', (node) => {
        treeView.UnHideNode(node);
    });
    vscode.commands.registerCommand('IamTreeView.AddIamRole', () => {
        treeView.AddIamRole();
    });
    vscode.commands.registerCommand('IamTreeView.RemoveIamRole', (node) => {
        treeView.RemoveIamRole(node);
    });
    vscode.commands.registerCommand('IamTreeView.Goto', (node) => {
        treeView.Goto(node);
    });
    vscode.commands.registerCommand('IamTreeView.SelectAwsProfile', (node) => {
        treeView.SelectAwsProfile(node);
    });
    vscode.commands.registerCommand('IamTreeView.TestAwsConnection', () => {
        treeView.TestAwsConnection();
    });
    vscode.commands.registerCommand('IamTreeView.UpdateAwsEndPoint', () => {
        treeView.UpdateAwsEndPoint();
    });
    vscode.commands.registerCommand('IamTreeView.Donate', () => {
        treeView.Donate();
    });
    vscode.commands.registerCommand('IamTreeView.BugAndNewFeature', () => {
        treeView.BugAndNewFeature();
    });
    vscode.commands.registerCommand('IamTreeView.PrintIamRole', async (node) => {
        await treeView.PrintIamRole(node);
    });
    vscode.commands.registerCommand('IamTreeView.LoadPermissions', async (node) => {
        await treeView.LoadPermissions(node);
    });
    vscode.commands.registerCommand('IamTreeView.LoadTrustRelationships', async (node) => {
        await treeView.LoadTrustRelationships(node);
    });
    vscode.commands.registerCommand('IamTreeView.LoadTags', async (node) => {
        await treeView.LoadTags(node);
    });
    vscode.commands.registerCommand('IamTreeView.LoadInfo', async (node) => {
        await treeView.LoadInfo(node);
    });
    vscode.commands.registerCommand('IamTreeView.AddTag', async (node) => {
        await treeView.AddTag(node);
    });
    vscode.commands.registerCommand('IamTreeView.UpdateTag', async (node) => {
        await treeView.UpdateTag(node);
    });
    vscode.commands.registerCommand('IamTreeView.RemoveTag', async (node) => {
        await treeView.RemoveTag(node);
    });
    vscode.commands.registerCommand('IamTreeView.ViewPolicy', async (node) => {
        await treeView.ViewPolicy(node);
    });
    vscode.commands.registerCommand('IamTreeView.DownloadPolicy', async (node) => {
        await treeView.DownloadPolicy(node);
    });
    vscode.commands.registerCommand('IamTreeView.ViewTrustRelationship', async (node) => {
        await treeView.ViewTrustRelationship(node);
    });
    vscode.commands.registerCommand('IamTreeView.DownloadTrustRelationship', async (node) => {
        await treeView.DownloadTrustRelationship(node);
    });
    ui.logToOutput('Aws Iam Extension activation completed');
}
function deactivate() {
    ui.logToOutput('Aws Iam Extension is now de-active!');
}
//# sourceMappingURL=extension.js.map