import * as vscode from 'vscode';
import * as ui from './common/UI';
import { SnsTreeView } from './sns/SnsTreeView';
import { SnsTreeItem } from './sns/SnsTreeItem';

export function activate(context: vscode.ExtensionContext) {
	ui.logToOutput('Aws Sns Extension activation started');

	let treeView:SnsTreeView = new SnsTreeView(context);

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

	vscode.commands.registerCommand('SnsTreeView.AddToFav', (node: SnsTreeItem) => {
		treeView.AddToFav(node);
	});

	vscode.commands.registerCommand('SnsTreeView.DeleteFromFav', (node: SnsTreeItem) => {
		treeView.DeleteFromFav(node);
	});

	vscode.commands.registerCommand('SnsTreeView.HideNode', (node: SnsTreeItem) => {
		treeView.HideNode(node);
	});

	vscode.commands.registerCommand('SnsTreeView.UnHideNode', (node: SnsTreeItem) => {
		treeView.UnHideNode(node);
	});

	vscode.commands.registerCommand('SnsTreeView.AddTopic', () => {
		treeView.AddTopic();
	});

	vscode.commands.registerCommand('SnsTreeView.RemoveTopic', (node: SnsTreeItem) => {
		treeView.RemoveTopic(node);
	});

	vscode.commands.registerCommand('SnsTreeView.Goto', (node: SnsTreeItem) => {
		treeView.Goto(node);
	});

	vscode.commands.registerCommand('SnsTreeView.SelectAwsProfile', (node: SnsTreeItem) => {
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

	vscode.commands.registerCommand('SnsTreeView.PublishMessage', (node: SnsTreeItem) => {
		treeView.PublishMessage(node);
	});

	vscode.commands.registerCommand('SnsTreeView.SnsView', (node: SnsTreeItem) => {
		treeView.SnsView(node);
	});

	vscode.commands.registerCommand('SnsTreeView.RemoveMessageFilePath', async (node: SnsTreeItem) => {
		await treeView.RemoveMessageFilePath(node);
	});

	vscode.commands.registerCommand('SnsTreeView.AddMessageFilePath', async (node: SnsTreeItem) => {
		await treeView.AddMessageFilePath(node);
	});

	vscode.commands.registerCommand('SnsTreeView.GetSubscriptions', async (node: SnsTreeItem) => {
		await treeView.GetSubscriptions(node);
	});

	ui.logToOutput('Aws Sns Extension activation completed');
}

export function deactivate() {
	ui.logToOutput('Aws Sns is now de-active!');
}
