import * as vscode from 'vscode';
import * as ui from './common/UI';
import { DynamodbTreeView } from './dynamodb/DynamodbTreeView';
import { DynamodbTreeItem } from './dynamodb/DynamodbTreeItem';

export function activate(context: vscode.ExtensionContext) {
	ui.logToOutput('Aws Dynamodb Extension activation started');

	let treeView:DynamodbTreeView = new DynamodbTreeView(context);

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

	vscode.commands.registerCommand('DynamodbTreeView.AddToFav', (node: DynamodbTreeItem) => {
		treeView.AddToFav(node);
	});

	vscode.commands.registerCommand('DynamodbTreeView.DeleteFromFav', (node: DynamodbTreeItem) => {
		treeView.DeleteFromFav(node);
	});

	vscode.commands.registerCommand('DynamodbTreeView.HideNode', (node: DynamodbTreeItem) => {
		treeView.HideNode(node);
	});

	vscode.commands.registerCommand('DynamodbTreeView.UnHideNode', (node: DynamodbTreeItem) => {
		treeView.UnHideNode(node);
	});

	vscode.commands.registerCommand('DynamodbTreeView.AddDynamodb', () => {
		treeView.AddDynamodb();
	});

	vscode.commands.registerCommand('DynamodbTreeView.RemoveDynamodb', (node: DynamodbTreeItem) => {
		treeView.RemoveDynamodb(node);
	});

	vscode.commands.registerCommand('DynamodbTreeView.Goto', (node: DynamodbTreeItem) => {
		treeView.Goto(node);
	});

	vscode.commands.registerCommand('DynamodbTreeView.SelectAwsProfile', (node: DynamodbTreeItem) => {
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

	vscode.commands.registerCommand('DynamodbTreeView.DynamodbView', (node: DynamodbTreeItem) => {
		treeView.DynamodbView(node);
	});

	vscode.commands.registerCommand('DynamodbTreeView.PrintDynamodb', async (node: DynamodbTreeItem) => {
		await treeView.PrintDynamodb(node);
	});

	vscode.commands.registerCommand('DynamodbTreeView.CreateTable', async () => {
		await treeView.CreateTable();
	});

	vscode.commands.registerCommand('DynamodbTreeView.DeleteTable', async (node: DynamodbTreeItem) => {
		await treeView.DeleteTable(node);
	});

	vscode.commands.registerCommand('DynamodbTreeView.EditCapacity', async (node: DynamodbTreeItem) => {
		await treeView.EditCapacity(node);
	});

	vscode.commands.registerCommand('DynamodbTreeView.QueryTable', async (node: DynamodbTreeItem) => {
		await treeView.QueryTable(node);
	});

	vscode.commands.registerCommand('DynamodbTreeView.ScanTable', async (node: DynamodbTreeItem) => {
		await treeView.ScanTable(node);
	});

	vscode.commands.registerCommand('DynamodbTreeView.AddItem', async (node: DynamodbTreeItem) => {
		await treeView.AddItem(node);
	});

	vscode.commands.registerCommand('DynamodbTreeView.EditItem', async (node: DynamodbTreeItem) => {
		await treeView.EditItem(node);
	});

	vscode.commands.registerCommand('DynamodbTreeView.DeleteItem', async (node: DynamodbTreeItem) => {
		await treeView.DeleteItem(node);
	});

	vscode.commands.registerCommand('dynamodb.showCapacityExplanation', async (node: DynamodbTreeItem, capacityType: string) => {
		await treeView.ShowCapacityExplanation(node, capacityType);
	});

	ui.logToOutput('Aws Dynamodb Extension activation completed');
}

export function deactivate() {
	ui.logToOutput('Aws Dynamodb is now de-active!');
}
