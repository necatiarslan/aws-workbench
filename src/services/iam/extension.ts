import * as vscode from 'vscode';
import * as ui from './common/UI';
import { IamTreeView } from './iam/IamTreeView';
import { IamTreeItem } from './iam/IamTreeItem';

export function activate(context: vscode.ExtensionContext) {
	ui.logToOutput('Aws Iam Extension activation started');

	let treeView:IamTreeView = new IamTreeView(context);

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

	vscode.commands.registerCommand('IamTreeView.AddToFav', (node: IamTreeItem) => {
		treeView.AddToFav(node);
	});

	vscode.commands.registerCommand('IamTreeView.DeleteFromFav', (node: IamTreeItem) => {
		treeView.DeleteFromFav(node);
	});

	vscode.commands.registerCommand('IamTreeView.HideNode', (node: IamTreeItem) => {
		treeView.HideNode(node);
	});

	vscode.commands.registerCommand('IamTreeView.UnHideNode', (node: IamTreeItem) => {
		treeView.UnHideNode(node);
	});

	vscode.commands.registerCommand('IamTreeView.AddIamRole', () => {
		treeView.AddIamRole();
	});

	vscode.commands.registerCommand('IamTreeView.RemoveIamRole', (node: IamTreeItem) => {
		treeView.RemoveIamRole(node);
	});

	vscode.commands.registerCommand('IamTreeView.Goto', (node: IamTreeItem) => {
		treeView.Goto(node);
	});

	vscode.commands.registerCommand('IamTreeView.SelectAwsProfile', (node: IamTreeItem) => {
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

	vscode.commands.registerCommand('IamTreeView.PrintIamRole', async (node: IamTreeItem) => {
		await treeView.PrintIamRole(node);
	});

	vscode.commands.registerCommand('IamTreeView.LoadPermissions', async (node: IamTreeItem) => {
		await treeView.LoadPermissions(node);
	});

	vscode.commands.registerCommand('IamTreeView.LoadTrustRelationships', async (node: IamTreeItem) => {
		await treeView.LoadTrustRelationships(node);
	});

	vscode.commands.registerCommand('IamTreeView.LoadTags', async (node: IamTreeItem) => {
		await treeView.LoadTags(node);
	});

	vscode.commands.registerCommand('IamTreeView.LoadInfo', async (node: IamTreeItem) => {
		await treeView.LoadInfo(node);
	});

	vscode.commands.registerCommand('IamTreeView.AddTag', async (node: IamTreeItem) => {
		await treeView.AddTag(node);
	});

	vscode.commands.registerCommand('IamTreeView.UpdateTag', async (node: IamTreeItem) => {
		await treeView.UpdateTag(node);
	});

	vscode.commands.registerCommand('IamTreeView.RemoveTag', async (node: IamTreeItem) => {
		await treeView.RemoveTag(node);
	});

	vscode.commands.registerCommand('IamTreeView.ViewPolicy', async (node: IamTreeItem) => {
		await treeView.ViewPolicy(node);
	});

	vscode.commands.registerCommand('IamTreeView.DownloadPolicy', async (node: IamTreeItem) => {
		await treeView.DownloadPolicy(node);
	});

	vscode.commands.registerCommand('IamTreeView.ViewTrustRelationship', async (node: IamTreeItem) => {
		await treeView.ViewTrustRelationship(node);
	});

	vscode.commands.registerCommand('IamTreeView.DownloadTrustRelationship', async (node: IamTreeItem) => {
		await treeView.DownloadTrustRelationship(node);
	});

	ui.logToOutput('Aws Iam Extension activation completed');
}

export function deactivate() {
	ui.logToOutput('Aws Iam Extension is now de-active!');
}
