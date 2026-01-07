"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const ui = require("./common/UI");
const SqsTreeView_1 = require("./sqs/SqsTreeView");
function activate(context) {
    ui.logToOutput('Aws Sqs Extension activation started');
    let treeView = new SqsTreeView_1.SqsTreeView(context);
    vscode.commands.registerCommand('SqsTreeView.Refresh', () => {
        treeView.Refresh();
    });
    vscode.commands.registerCommand('SqsTreeView.Filter', () => {
        treeView.Filter();
    });
    vscode.commands.registerCommand('SqsTreeView.ShowOnlyFavorite', () => {
        treeView.ShowOnlyFavorite();
    });
    vscode.commands.registerCommand('SqsTreeView.ShowHiddenNodes', () => {
        treeView.ShowHiddenNodes();
    });
    vscode.commands.registerCommand('SqsTreeView.AddToFav', (node) => {
        treeView.AddToFav(node);
    });
    vscode.commands.registerCommand('SqsTreeView.DeleteFromFav', (node) => {
        treeView.DeleteFromFav(node);
    });
    vscode.commands.registerCommand('SqsTreeView.HideNode', (node) => {
        treeView.HideNode(node);
    });
    vscode.commands.registerCommand('SqsTreeView.UnHideNode', (node) => {
        treeView.UnHideNode(node);
    });
    vscode.commands.registerCommand('SqsTreeView.AddQueue', () => {
        treeView.AddQueue();
    });
    vscode.commands.registerCommand('SqsTreeView.RemoveQueue', (node) => {
        treeView.RemoveQueue(node);
    });
    vscode.commands.registerCommand('SqsTreeView.Goto', (node) => {
        treeView.Goto(node);
    });
    vscode.commands.registerCommand('SqsTreeView.SelectAwsProfile', (node) => {
        treeView.SelectAwsProfile(node);
    });
    vscode.commands.registerCommand('SqsTreeView.TestAwsConnection', () => {
        treeView.TestAwsConnection();
    });
    vscode.commands.registerCommand('SqsTreeView.UpdateAwsEndPoint', () => {
        treeView.UpdateAwsEndPoint();
    });
    vscode.commands.registerCommand('SqsTreeView.Donate', () => {
        treeView.Donate();
    });
    vscode.commands.registerCommand('SqsTreeView.BugAndNewFeature', () => {
        treeView.BugAndNewFeature();
    });
    vscode.commands.registerCommand('SqsTreeView.SendMessage', (node) => {
        treeView.SendMessage(node);
    });
    vscode.commands.registerCommand('SqsTreeView.ReceiveMessage', (node) => {
        treeView.ReceiveMessage(node);
    });
    vscode.commands.registerCommand('SqsTreeView.DeleteAllMessages', (node) => {
        treeView.DeleteAllMessages(node);
    });
    vscode.commands.registerCommand('SqsTreeView.GetMessageCount', (node) => {
        treeView.GetMessageCount(node);
    });
    vscode.commands.registerCommand('SqsTreeView.PreviewMessage', (node) => {
        treeView.PreviewMessage(node);
    });
    vscode.commands.registerCommand('SqsTreeView.DeleteMessage', (node) => {
        treeView.DeleteMessage(node);
    });
    vscode.commands.registerCommand('SqsTreeView.SqsView', (node) => {
        treeView.SqsView(node);
    });
    vscode.commands.registerCommand('SqsTreeView.PreviewPolicy', (node) => {
        treeView.PreviewPolicy(node);
    });
    vscode.commands.registerCommand('SqsTreeView.RemoveMessageFilePath', async (node) => {
        await treeView.RemoveMessageFilePath(node);
    });
    vscode.commands.registerCommand('SqsTreeView.AddMessageFilePath', async (node) => {
        await treeView.AddMessageFilePath(node);
    });
    ui.logToOutput('Aws Sqs Extension activation completed');
}
function deactivate() {
    ui.logToOutput('Aws Sqs is now de-active!');
}
//# sourceMappingURL=extension.js.map