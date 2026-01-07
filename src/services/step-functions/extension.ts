import * as vscode from 'vscode';
import * as ui from './common/UI';
import { StepFuncTreeView } from './step/StepFuncTreeView';
import { StepFuncTreeItem } from './step/StepFuncTreeItem';
import { StepFuncStudioEditorProvider } from './step/StepFuncStudioView';

export function activate(context: vscode.ExtensionContext) {
	ui.logToOutput('Aws StepFunc Extension activation started');

	// Register Workflow Studio custom editor provider
	context.subscriptions.push(
		StepFuncStudioEditorProvider.register(context)
	);

	let treeView:StepFuncTreeView = new StepFuncTreeView(context);

	vscode.commands.registerCommand('StepFuncTreeView.Refresh', () => {
		treeView.Refresh();
	});

	vscode.commands.registerCommand('StepFuncTreeView.Filter', () => {
		treeView.Filter();
	});

	vscode.commands.registerCommand('StepFuncTreeView.ShowOnlyFavorite', () => {
		treeView.ShowOnlyFavorite();
	});

	vscode.commands.registerCommand('StepFuncTreeView.ShowHiddenNodes', () => {
		treeView.ShowHiddenNodes();
	});

	vscode.commands.registerCommand('StepFuncTreeView.AddToFav', (node: StepFuncTreeItem) => {
		treeView.AddToFav(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.DeleteFromFav', (node: StepFuncTreeItem) => {
		treeView.DeleteFromFav(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.HideNode', (node: StepFuncTreeItem) => {
		treeView.HideNode(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.UnHideNode', (node: StepFuncTreeItem) => {
		treeView.UnHideNode(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.AddStepFunc', () => {
		treeView.AddStepFunc();
	});

	vscode.commands.registerCommand('StepFuncTreeView.RemoveStepFunc', (node: StepFuncTreeItem) => {
		treeView.RemoveStepFunc(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.Goto', (node: StepFuncTreeItem) => {
		treeView.Goto(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.SelectAwsProfile', (node: StepFuncTreeItem) => {
		treeView.SelectAwsProfile(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.TestAwsConnection', () => {
		treeView.TestAwsConnection();
	});

	vscode.commands.registerCommand('StepFuncTreeView.UpdateAwsEndPoint', () => {
		treeView.UpdateAwsEndPoint();
	});

	vscode.commands.registerCommand('StepFuncTreeView.Donate', () => {
		treeView.Donate();
	});

	vscode.commands.registerCommand('StepFuncTreeView.BugAndNewFeature', () => {
		treeView.BugAndNewFeature();
	});

	vscode.commands.registerCommand('StepFuncTreeView.TriggerStepFunc', (node: StepFuncTreeItem) => {
		treeView.TriggerStepFunc(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.ViewLatestLog', (node: StepFuncTreeItem) => {
		treeView.ViewLatestLog(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.StepFuncView', (node: StepFuncTreeItem) => {
		treeView.StepFuncView(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.PrintStepFunc', async (node: StepFuncTreeItem) => {
		await treeView.PrintStepFunc(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.UpdateStepFuncCodes', async (node: StepFuncTreeItem) => {
		await treeView.UpdateStepFuncCodes(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.SetCodePath', async (node: StepFuncTreeItem) => {
		await treeView.SetCodePath(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.UnsetCodePath', async (node: StepFuncTreeItem) => {
		await treeView.UnsetCodePath(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.OpenCodeFile', async (node: StepFuncTreeItem) => {
		await treeView.OpenCodeFile(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.DownloadDefinitionFromAWS', async (node: StepFuncTreeItem) => {
		await treeView.DownloadDefinitionFromAWS(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.CompareLocalWithAWS', async (node: StepFuncTreeItem) => {
		await treeView.CompareLocalWithAWS(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.ViewCodeGraph', async (node: StepFuncTreeItem) => {
		await treeView.ViewCodeGraph(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.ViewLog', async (node: StepFuncTreeItem) => {
		await treeView.ViewLog(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.ViewResponsePayload', async (node: StepFuncTreeItem) => {
		await treeView.ViewResponsePayload(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.RefreshLogs', async (node: StepFuncTreeItem) => {
		await treeView.RefreshLogStreams(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.RefreshExecutions', async (node: StepFuncTreeItem) => {
		await treeView.RefreshExecutions(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.RefreshSuccessfulExecutions', async (node: StepFuncTreeItem) => {
		await treeView.RefreshSuccessfulExecutions(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.RefreshFailedExecutions', async (node: StepFuncTreeItem) => {
		await treeView.RefreshFailedExecutions(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.RefreshRunningExecutions', async (node: StepFuncTreeItem) => {
		await treeView.RefreshRunningExecutions(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.RemovePayloadPath', async (node: StepFuncTreeItem) => {
		await treeView.RemovePayloadPath(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.AddPayloadPath', async (node: StepFuncTreeItem) => {
		await treeView.AddPayloadPath(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.ViewExecutionDetails', async (node: StepFuncTreeItem) => {
		await treeView.ViewExecutionDetails(node);
	});

	vscode.commands.registerCommand('StepFuncTreeView.ViewExecutionLog', async (node: StepFuncTreeItem) => {
		await treeView.ViewExecutionLog(node);
	});

	ui.logToOutput('Aws StepFunc Extension activation completed');
}

export function deactivate() {
	ui.logToOutput('Aws StepFunc is now de-active!');
}
