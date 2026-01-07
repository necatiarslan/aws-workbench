import * as vscode from 'vscode';
import * as ui from './common/UI';
import { GlueTreeView } from './glue/GlueTreeView';
import { GlueTreeItem } from './glue/GlueTreeItem';

export function activate(context: vscode.ExtensionContext) {
	ui.logToOutput('Aws Glue Extension activation started');

	let treeView:GlueTreeView = new GlueTreeView(context);

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

	vscode.commands.registerCommand('GlueTreeView.AddToFav', (node: GlueTreeItem) => {
		treeView.AddToFav(node);
	});

	vscode.commands.registerCommand('GlueTreeView.DeleteFromFav', (node: GlueTreeItem) => {
		treeView.DeleteFromFav(node);
	});

	vscode.commands.registerCommand('GlueTreeView.HideNode', (node: GlueTreeItem) => {
		treeView.HideNode(node);
	});

	vscode.commands.registerCommand('GlueTreeView.UnHideNode', (node: GlueTreeItem) => {
		treeView.UnHideNode(node);
	});

	vscode.commands.registerCommand('GlueTreeView.AddGlueJob', () => {
		treeView.AddGlueJob();
	});

	vscode.commands.registerCommand('GlueTreeView.RemoveGlueJob', (node: GlueTreeItem) => {
		treeView.RemoveGlueJob(node);
	});

	vscode.commands.registerCommand('GlueTreeView.Goto', (node: GlueTreeItem) => {
		treeView.Goto(node);
	});

	vscode.commands.registerCommand('GlueTreeView.SelectAwsProfile', (node: GlueTreeItem) => {
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

	vscode.commands.registerCommand('GlueTreeView.RunJob', (node: GlueTreeItem) => {
		treeView.RunJob(node);
	});

	vscode.commands.registerCommand('GlueTreeView.ViewLatestLog', (node: GlueTreeItem) => {
		treeView.ViewLatestLog(node);
	});

	vscode.commands.registerCommand('GlueTreeView.PrintResource', async (node: GlueTreeItem) => {
		await treeView.PrintResource(node);
	});

	vscode.commands.registerCommand('GlueTreeView.ViewLog', async (node: GlueTreeItem) => {
		await treeView.ViewLog(node);
	});

	vscode.commands.registerCommand('GlueTreeView.RefreshLogs', async (node: GlueTreeItem) => {
		await treeView.RefreshLogStreams(node);
	});

	vscode.commands.registerCommand('GlueTreeView.RefreshRuns', async (node: GlueTreeItem) => {
		await treeView.RefreshRuns(node);
	});

	vscode.commands.registerCommand('GlueTreeView.RefreshJobInfo', async (node: GlueTreeItem) => {
		await treeView.RefreshJobInfo(node);
	});

	ui.logToOutput('Aws Glue Extension activation completed');
}

export function deactivate() {
	ui.logToOutput('Aws Glue is now de-active!');
}
