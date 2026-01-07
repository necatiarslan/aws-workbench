"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const ui = require("./common/UI");
const DynamodbTreeView_1 = require("./dynamodb/DynamodbTreeView");
function activate(context) {
    ui.logToOutput('Aws Dynamodb Extension activation started');
    let treeView = new DynamodbTreeView_1.DynamodbTreeView(context);
    vscode.commands.registerCommand('DynamodbTreeView.Refresh', () => {
        treeView.Refresh();
    });
    vscode.commands.registerCommand('DynamodbTreeView.Filter', () => {
        treeView.Filter();
    });
    vscode.commands.registerCommand('DynamodbTreeView.ShowOnlyFavorite', () => {
        treeView.ShowOnlyFavorite();
    });
    vscode.commands.registerCommand('DynamodbTreeView.ShowHiddenNodes', () => {
        treeView.ShowHiddenNodes();
    });
    vscode.commands.registerCommand('DynamodbTreeView.AddToFav', (node) => {
        treeView.AddToFav(node);
    });
    vscode.commands.registerCommand('DynamodbTreeView.DeleteFromFav', (node) => {
        treeView.DeleteFromFav(node);
    });
    vscode.commands.registerCommand('DynamodbTreeView.HideNode', (node) => {
        treeView.HideNode(node);
    });
    vscode.commands.registerCommand('DynamodbTreeView.UnHideNode', (node) => {
        treeView.UnHideNode(node);
    });
    vscode.commands.registerCommand('DynamodbTreeView.AddDynamodb', () => {
        treeView.AddDynamodb();
    });
    vscode.commands.registerCommand('DynamodbTreeView.RemoveDynamodb', (node) => {
        treeView.RemoveDynamodb(node);
    });
    vscode.commands.registerCommand('DynamodbTreeView.Goto', (node) => {
        treeView.Goto(node);
    });
    vscode.commands.registerCommand('DynamodbTreeView.SelectAwsProfile', (node) => {
        treeView.SelectAwsProfile(node);
    });
    vscode.commands.registerCommand('DynamodbTreeView.TestAwsConnection', () => {
        treeView.TestAwsConnection();
    });
    vscode.commands.registerCommand('DynamodbTreeView.UpdateAwsEndPoint', () => {
        treeView.UpdateAwsEndPoint();
    });
    vscode.commands.registerCommand('DynamodbTreeView.Donate', () => {
        treeView.Donate();
    });
    vscode.commands.registerCommand('DynamodbTreeView.BugAndNewFeature', () => {
        treeView.BugAndNewFeature();
    });
    vscode.commands.registerCommand('DynamodbTreeView.DynamodbView', (node) => {
        treeView.DynamodbView(node);
    });
    vscode.commands.registerCommand('DynamodbTreeView.PrintDynamodb', async (node) => {
        await treeView.PrintDynamodb(node);
    });
    vscode.commands.registerCommand('DynamodbTreeView.CreateTable', async () => {
        await treeView.CreateTable();
    });
    vscode.commands.registerCommand('DynamodbTreeView.DeleteTable', async (node) => {
        await treeView.DeleteTable(node);
    });
    vscode.commands.registerCommand('DynamodbTreeView.EditCapacity', async (node) => {
        await treeView.EditCapacity(node);
    });
    vscode.commands.registerCommand('DynamodbTreeView.QueryTable', async (node) => {
        await treeView.QueryTable(node);
    });
    vscode.commands.registerCommand('DynamodbTreeView.ScanTable', async (node) => {
        await treeView.ScanTable(node);
    });
    vscode.commands.registerCommand('DynamodbTreeView.AddItem', async (node) => {
        await treeView.AddItem(node);
    });
    vscode.commands.registerCommand('DynamodbTreeView.EditItem', async (node) => {
        await treeView.EditItem(node);
    });
    vscode.commands.registerCommand('DynamodbTreeView.DeleteItem', async (node) => {
        await treeView.DeleteItem(node);
    });
    vscode.commands.registerCommand('dynamodb.showCapacityExplanation', async (node, capacityType) => {
        await treeView.ShowCapacityExplanation(node, capacityType);
    });
    ui.logToOutput('Aws Dynamodb Extension activation completed');
}
function deactivate() {
    ui.logToOutput('Aws Dynamodb is now de-active!');
}
//# sourceMappingURL=extension.js.map