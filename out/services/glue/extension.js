"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const ui = require("./common/UI");
const GlueTreeView_1 = require("./glue/GlueTreeView");
function activate(context) {
    ui.logToOutput('Aws Glue Extension activation started');
    let treeView = new GlueTreeView_1.GlueTreeView(context);
    vscode.commands.registerCommand('GlueTreeView.Refresh', () => {
        treeView.Refresh();
    });
    vscode.commands.registerCommand('GlueTreeView.Filter', () => {
        treeView.Filter();
    });
    vscode.commands.registerCommand('GlueTreeView.ShowOnlyFavorite', () => {
        treeView.ShowOnlyFavorite();
    });
    vscode.commands.registerCommand('GlueTreeView.ShowHiddenNodes', () => {
        treeView.ShowHiddenNodes();
    });
    vscode.commands.registerCommand('GlueTreeView.AddToFav', (node) => {
        treeView.AddToFav(node);
    });
    vscode.commands.registerCommand('GlueTreeView.DeleteFromFav', (node) => {
        treeView.DeleteFromFav(node);
    });
    vscode.commands.registerCommand('GlueTreeView.HideNode', (node) => {
        treeView.HideNode(node);
    });
    vscode.commands.registerCommand('GlueTreeView.UnHideNode', (node) => {
        treeView.UnHideNode(node);
    });
    vscode.commands.registerCommand('GlueTreeView.AddGlueJob', () => {
        treeView.AddGlueJob();
    });
    vscode.commands.registerCommand('GlueTreeView.RemoveGlueJob', (node) => {
        treeView.RemoveGlueJob(node);
    });
    vscode.commands.registerCommand('GlueTreeView.Goto', (node) => {
        treeView.Goto(node);
    });
    vscode.commands.registerCommand('GlueTreeView.SelectAwsProfile', (node) => {
        treeView.SelectAwsProfile(node);
    });
    vscode.commands.registerCommand('GlueTreeView.TestAwsConnection', () => {
        treeView.TestAwsConnection();
    });
    vscode.commands.registerCommand('GlueTreeView.UpdateAwsEndPoint', () => {
        treeView.UpdateAwsEndPoint();
    });
    vscode.commands.registerCommand('GlueTreeView.Donate', () => {
        treeView.Donate();
    });
    vscode.commands.registerCommand('GlueTreeView.BugAndNewFeature', () => {
        treeView.BugAndNewFeature();
    });
    vscode.commands.registerCommand('GlueTreeView.RunJob', (node) => {
        treeView.RunJob(node);
    });
    vscode.commands.registerCommand('GlueTreeView.ViewLatestLog', (node) => {
        treeView.ViewLatestLog(node);
    });
    vscode.commands.registerCommand('GlueTreeView.PrintResource', async (node) => {
        await treeView.PrintResource(node);
    });
    vscode.commands.registerCommand('GlueTreeView.ViewLog', async (node) => {
        await treeView.ViewLog(node);
    });
    vscode.commands.registerCommand('GlueTreeView.RefreshLogs', async (node) => {
        await treeView.RefreshLogStreams(node);
    });
    vscode.commands.registerCommand('GlueTreeView.RefreshRuns', async (node) => {
        await treeView.RefreshRuns(node);
    });
    vscode.commands.registerCommand('GlueTreeView.RefreshJobInfo', async (node) => {
        await treeView.RefreshJobInfo(node);
    });
    ui.logToOutput('Aws Glue Extension activation completed');
}
function deactivate() {
    ui.logToOutput('Aws Glue is now de-active!');
}
//# sourceMappingURL=extension.js.map