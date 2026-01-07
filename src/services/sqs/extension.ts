import * as vscode from 'vscode';
import * as ui from './common/UI';
import { SqsTreeView } from './sqs/SqsTreeView';
import { SqsTreeItem } from './sqs/SqsTreeItem';

export function activate(context: vscode.ExtensionContext) {
	ui.logToOutput('Aws Sqs Extension activation started');

	let treeView:SqsTreeView = new SqsTreeView(context);

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

	vscode.commands.registerCommand('SqsTreeView.AddToFav', (node: SqsTreeItem) => {
		treeView.AddToFav(node);
	});

	vscode.commands.registerCommand('SqsTreeView.DeleteFromFav', (node: SqsTreeItem) => {
		treeView.DeleteFromFav(node);
	});

	vscode.commands.registerCommand('SqsTreeView.HideNode', (node: SqsTreeItem) => {
		treeView.HideNode(node);
	});

	vscode.commands.registerCommand('SqsTreeView.UnHideNode', (node: SqsTreeItem) => {
		treeView.UnHideNode(node);
	});

	vscode.commands.registerCommand('SqsTreeView.AddQueue', () => {
		treeView.AddQueue();
	});

	vscode.commands.registerCommand('SqsTreeView.RemoveQueue', (node: SqsTreeItem) => {
		treeView.RemoveQueue(node);
	});

	vscode.commands.registerCommand('SqsTreeView.Goto', (node: SqsTreeItem) => {
		treeView.Goto(node);
	});

	vscode.commands.registerCommand('SqsTreeView.SelectAwsProfile', (node: SqsTreeItem) => {
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

	vscode.commands.registerCommand('SqsTreeView.SendMessage', (node: SqsTreeItem) => {
		treeView.SendMessage(node);
	});

	vscode.commands.registerCommand('SqsTreeView.ReceiveMessage', (node: SqsTreeItem) => {
		treeView.ReceiveMessage(node);
	});

	vscode.commands.registerCommand('SqsTreeView.DeleteAllMessages', (node: SqsTreeItem) => {
		treeView.DeleteAllMessages(node);
	});

	vscode.commands.registerCommand('SqsTreeView.GetMessageCount', (node: SqsTreeItem) => {
		treeView.GetMessageCount(node);
	});

	vscode.commands.registerCommand('SqsTreeView.PreviewMessage', (node: SqsTreeItem) => {
		treeView.PreviewMessage(node);
	});

	vscode.commands.registerCommand('SqsTreeView.DeleteMessage', (node: SqsTreeItem) => {
		treeView.DeleteMessage(node);
	});

	vscode.commands.registerCommand('SqsTreeView.SqsView', (node: SqsTreeItem) => {
		treeView.SqsView(node);
	});

	vscode.commands.registerCommand('SqsTreeView.PreviewPolicy', (node: SqsTreeItem) => {
		treeView.PreviewPolicy(node);
	});

	vscode.commands.registerCommand('SqsTreeView.RemoveMessageFilePath', async (node: SqsTreeItem) => {
		await treeView.RemoveMessageFilePath(node);
	});

	vscode.commands.registerCommand('SqsTreeView.AddMessageFilePath', async (node: SqsTreeItem) => {
		await treeView.AddMessageFilePath(node);
	});

	ui.logToOutput('Aws Sqs Extension activation completed');
}

export function deactivate() {
	ui.logToOutput('Aws Sqs is now de-active!');
}
