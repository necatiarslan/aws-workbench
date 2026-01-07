"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const ui = require("./common/UI");
const SnsTreeView_1 = require("./sns/SnsTreeView");
function activate(context) {
    ui.logToOutput('Aws Sns Extension activation started');
    let treeView = new SnsTreeView_1.SnsTreeView(context);
    vscode.commands.registerCommand('SnsTreeView.Refresh', () => {
        treeView.Refresh();
    });
    vscode.commands.registerCommand('SnsTreeView.Filter', () => {
        treeView.Filter();
    });
    vscode.commands.registerCommand('SnsTreeView.ShowOnlyFavorite', () => {
        treeView.ShowOnlyFavorite();
    });
    vscode.commands.registerCommand('SnsTreeView.ShowHiddenNodes', () => {
        treeView.ShowHiddenNodes();
    });
    vscode.commands.registerCommand('SnsTreeView.AddToFav', (node) => {
        treeView.AddToFav(node);
    });
    vscode.commands.registerCommand('SnsTreeView.DeleteFromFav', (node) => {
        treeView.DeleteFromFav(node);
    });
    vscode.commands.registerCommand('SnsTreeView.HideNode', (node) => {
        treeView.HideNode(node);
    });
    vscode.commands.registerCommand('SnsTreeView.UnHideNode', (node) => {
        treeView.UnHideNode(node);
    });
    vscode.commands.registerCommand('SnsTreeView.AddTopic', () => {
        treeView.AddTopic();
    });
    vscode.commands.registerCommand('SnsTreeView.RemoveTopic', (node) => {
        treeView.RemoveTopic(node);
    });
    vscode.commands.registerCommand('SnsTreeView.Goto', (node) => {
        treeView.Goto(node);
    });
    vscode.commands.registerCommand('SnsTreeView.SelectAwsProfile', (node) => {
        treeView.SelectAwsProfile(node);
    });
    vscode.commands.registerCommand('SnsTreeView.TestAwsConnection', () => {
        treeView.TestAwsConnection();
    });
    vscode.commands.registerCommand('SnsTreeView.UpdateAwsEndPoint', () => {
        treeView.UpdateAwsEndPoint();
    });
    vscode.commands.registerCommand('SnsTreeView.Donate', () => {
        treeView.Donate();
    });
    vscode.commands.registerCommand('SnsTreeView.BugAndNewFeature', () => {
        treeView.BugAndNewFeature();
    });
    vscode.commands.registerCommand('SnsTreeView.PublishMessage', (node) => {
        treeView.PublishMessage(node);
    });
    vscode.commands.registerCommand('SnsTreeView.SnsView', (node) => {
        treeView.SnsView(node);
    });
    vscode.commands.registerCommand('SnsTreeView.RemoveMessageFilePath', async (node) => {
        await treeView.RemoveMessageFilePath(node);
    });
    vscode.commands.registerCommand('SnsTreeView.AddMessageFilePath', async (node) => {
        await treeView.AddMessageFilePath(node);
    });
    vscode.commands.registerCommand('SnsTreeView.GetSubscriptions', async (node) => {
        await treeView.GetSubscriptions(node);
    });
    ui.logToOutput('Aws Sns Extension activation completed');
}
function deactivate() {
    ui.logToOutput('Aws Sns is now de-active!');
}
//# sourceMappingURL=extension.js.map