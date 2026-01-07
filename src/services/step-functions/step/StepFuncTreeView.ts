/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { StepFuncTreeItem, TreeItemType } from './StepFuncTreeItem';
import { StepFuncTreeDataProvider } from './StepFuncTreeDataProvider';
import * as ui from '../common/UI';
import * as api from '../common/API';
import { CloudWatchLogView } from '../cloudwatch/CloudWatchLogView';
import { StepFuncGraphView } from './StepFuncGraphView';
import { StepFuncStudioView } from './StepFuncStudioView';

export class StepFuncTreeView {

	public static Current: StepFuncTreeView;
	public view: vscode.TreeView<StepFuncTreeItem>;
	public treeDataProvider: StepFuncTreeDataProvider;
	public context: vscode.ExtensionContext;
	public FilterString: string = "";
	public isShowOnlyFavorite: boolean = false;
	public isShowHiddenNodes: boolean = false;
	public AwsProfile: string = "default";	
	public AwsEndPoint: string | undefined;
	public StepFuncList: {Region: string, StepFunc: string}[] = [];
	public CodePathList: {Region: string, StepFunc: string, CodePath: string}[] = [];
	public PayloadPathList: {Region: string, StepFunc: string, PayloadPath: string}[] = [];


	constructor(context: vscode.ExtensionContext) {
		ui.logToOutput('TreeView.constructor Started');
		StepFuncTreeView.Current = this;
		this.context = context;
		this.LoadState();
		this.treeDataProvider = new StepFuncTreeDataProvider();
		this.view = vscode.window.createTreeView('StepFuncTreeView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
		this.Refresh();
		context.subscriptions.push(this.view);
		this.SetFilterMessage();
	}

	async TestAwsConnection(){
		let response = await api.TestAwsCredentials()
		if(response.isSuccessful && response.result){
			ui.logToOutput('Aws Credentials Test Successfull');
			ui.showInfoMessage('Aws Credentials Test Successfull');
		}
		else{
			ui.logToOutput('StepFuncTreeView.TestAwsCredentials Error !!!', response.error);
			ui.showErrorMessage('Aws Credentials Test Error !!!', response.error);
		}
		
		let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
		if(selectedRegion===undefined){ return; }

		response = await api.TestAwsConnection(selectedRegion)
		if(response.isSuccessful && response.result){
			ui.logToOutput('Aws Connection Test Successfull');
			ui.showInfoMessage('Aws Connection Test Successfull');
		}
		else{
			ui.logToOutput('StepFuncTreeView.TestAwsConnection Error !!!', response.error);
			ui.showErrorMessage('Aws Connection Test Error !!!', response.error);
		}
	}

	BugAndNewFeature() {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/necatiarslan/aws-step-functions-vscode-extension/issues/new'));
	}
	Donate() {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/sponsors/necatiarslan'));
	}

	Refresh(): void {
		ui.logToOutput('StepFuncTreeView.refresh Started');

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			title: "Aws StepFunc: Loading...",
		}, (progress, token) => {
			progress.report({ increment: 0 });

			this.LoadTreeItems();

			return new Promise<void>(resolve => { resolve(); });
		});
	}

	LoadTreeItems(){
		ui.logToOutput('StepFuncTreeView.loadTreeItems Started');
		this.treeDataProvider.Refresh();
		this.SetViewTitle();
	}

	ResetView(): void {
		ui.logToOutput('StepFuncTreeView.resetView Started');
		this.FilterString = '';

		this.treeDataProvider.Refresh();
		this.SetViewTitle();

		this.SaveState();
		this.Refresh();
	}

	async AddToFav(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.AddToFav Started');
		node.IsFav = true;
		node.refreshUI();
	}

	async HideNode(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.HideNode Started');
		node.IsHidden = true;

		this.treeDataProvider.Refresh();
	}

	async UnHideNode(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.UnHideNode Started');
		node.IsHidden = false;
	}

	async DeleteFromFav(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.DeleteFromFav Started');
		node.IsFav = false;
		node.refreshUI();
	}

	async Filter() {
		ui.logToOutput('StepFuncTreeView.Filter Started');
		let filterStringTemp = await vscode.window.showInputBox({ value: this.FilterString, placeHolder: 'Enter Your Filter Text' });

		if (filterStringTemp === undefined) { return; }

		this.FilterString = filterStringTemp;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async ShowOnlyFavorite() {
		ui.logToOutput('StepFuncTreeView.ShowOnlyFavorite Started');
		this.isShowOnlyFavorite = !this.isShowOnlyFavorite;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async ShowHiddenNodes() {
		ui.logToOutput('StepFuncTreeView.ShowHiddenNodes Started');
		this.isShowHiddenNodes = !this.isShowHiddenNodes;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async SetViewTitle(){
		//this.view.title = "Aws StepFunc";
	}

	SaveState() {
		ui.logToOutput('StepFuncTreeView.saveState Started');
		try {

			this.context.globalState.update('AwsProfile', this.AwsProfile);
			this.context.globalState.update('FilterString', this.FilterString);
			this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
			this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
			this.context.globalState.update('StepFuncList', this.StepFuncList);
			this.context.globalState.update('CodePathList', this.CodePathList);
			this.context.globalState.update('PayloadPathList', this.PayloadPathList);
			this.context.globalState.update('AwsEndPoint', this.AwsEndPoint);

			ui.logToOutput("StepFuncTreeView.saveState Successfull");
		} catch (error) {
			ui.logToOutput("StepFuncTreeView.saveState Error !!!");
		}
	}

	LoadState() {
		ui.logToOutput('StepFuncTreeView.loadState Started');
		try {
			let AwsEndPointTemp: string | undefined = this.context.globalState.get('AwsEndPoint');
			if (AwsEndPointTemp) { this.AwsEndPoint = AwsEndPointTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("StepFuncTreeView.loadState AwsEndPoint Error !!!", error);
			ui.showErrorMessage("Aws StepFunc Load State AwsEndPoint Error !!!", error);
		}

		try {
			let AwsProfileTemp: string | undefined = this.context.globalState.get('AwsProfile');
			if (AwsProfileTemp) { this.AwsProfile = AwsProfileTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("StepFuncTreeView.loadState AwsProfile Error !!!", error);
			ui.showErrorMessage("Aws StepFunc Load State AwsProfile Error !!!", error);
		}

		try {
			let filterStringTemp: string | undefined = this.context.globalState.get('FilterString');
			if (filterStringTemp) { this.FilterString = filterStringTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("StepFuncTreeView.loadState FilterString Error !!!", error);
			ui.showErrorMessage("Aws StepFunc Load State FilterString Error !!!", error);
		}

		try {
			let ShowOnlyFavoriteTemp: boolean | undefined = this.context.globalState.get('ShowOnlyFavorite');
			if (ShowOnlyFavoriteTemp) { this.isShowOnlyFavorite = ShowOnlyFavoriteTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("StepFuncTreeView.loadState Error !!!", error);
			ui.showErrorMessage("Aws StepFunc Load State Error !!!", error);
		}

		try {
			let ShowHiddenNodesTemp: boolean | undefined = this.context.globalState.get('ShowHiddenNodes');
			if (ShowHiddenNodesTemp) { this.isShowHiddenNodes = ShowHiddenNodesTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("StepFuncTreeView.loadState isShowHiddenNodes Error !!!", error);
			ui.showErrorMessage("Aws StepFunc Load State isShowHiddenNodes Error !!!", error);
		}

		try {
			let StepFuncListTemp:{Region: string, StepFunc: string}[] | undefined  = this.context.globalState.get('StepFuncList');
			if(StepFuncListTemp){ this.StepFuncList = StepFuncListTemp; }

			let CodePathListTemp:{Region: string, StepFunc: string, CodePath: string}[] | undefined  = this.context.globalState.get('CodePathList');
			if(CodePathListTemp){ this.CodePathList = CodePathListTemp; }

			let PayloadPathListTemp:{Region: string, StepFunc: string, PayloadPath: string}[] | undefined  = this.context.globalState.get('PayloadPathList');
			if(PayloadPathListTemp){ this.PayloadPathList = PayloadPathListTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("StepFuncTreeView.loadState StepFuncList/CodePathList Error !!!", error);
			ui.showErrorMessage("Aws StepFunc Load State StepFuncList/CodePathList Error !!!", error);
		}

	}

	async SetFilterMessage(){
		if(this.StepFuncList.length > 0)
		{
			this.view.message = 
			await this.GetFilterProfilePrompt()
			+ this.GetBoolenSign(this.isShowOnlyFavorite) + "Fav, " 
			+ this.GetBoolenSign(this.isShowHiddenNodes) + "Hidden, "
			+ this.FilterString;
		}
	}

	async GetFilterProfilePrompt() {
		return "Profile:" + this.AwsProfile + " ";
	}

	GetBoolenSign(variable: boolean){
		return variable ? "✓" : "𐄂";
	}

	async AddStepFunc(){
		ui.logToOutput('StepFuncTreeView.AddStepFunc Started');

		let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
		if(selectedRegion===undefined){ return; }

		let selectedStepFuncName = await vscode.window.showInputBox({ placeHolder: 'Enter StepFunc Name / Search Text' });
		if(selectedStepFuncName===undefined){ return; }

		var resultStepFunc = await api.GetStepFuncList(selectedRegion, selectedStepFuncName);
		if(!resultStepFunc.isSuccessful){ return; }

		let selectedStepFuncArnList = await vscode.window.showQuickPick(resultStepFunc.result, {canPickMany:true, placeHolder: 'Select StepFunc(s)'});
		if(!selectedStepFuncArnList || selectedStepFuncArnList.length===0){ return; }

		for(var selectedStepFuncArn of selectedStepFuncArnList)
		{
			this.treeDataProvider.AddStepFunc(selectedRegion, selectedStepFuncArn);
		}
		this.SaveState();
	}

	async RemoveStepFunc(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.RemoveStepFunc Started');

		if(node.TreeItemType !== TreeItemType.StepFunc) { return;}

		this.treeDataProvider.RemoveStepFunc(node.Region, node.StepFuncArn);
		this.SaveState();
	}

	async Goto(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.Goto Started');
		
		if(node.TreeItemType !== TreeItemType.StepFunc) { return;}

		//vscode.commands.executeCommand('vscode.openWith', vscode.Uri.parse('https://console.aws.amazon.com/StepFunc/home?region=us-east-1#/functions/' + node.StepFunc), "external");
		ui.showInfoMessage("Work In Progress");
		
	}

	async StepFuncView(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.StepFuncView Started');
		if(node.TreeItemType !== TreeItemType.StepFunc) { return;}

		ui.showInfoMessage('Work In Progress');
	}

	async TriggerStepFunc(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.TriggerStepFunc Started');
		if(node.IsRunning) { return;}
		//if(node.TreeItemType !== TreeItemType.StepFunc && node.TreeItemType !== TreeItemType.TriggerSavedPayload) { return;}
		this.SetNodeRunning(node, true);
		let param: {} = {}

		if(node.TreeItemType === TreeItemType.TriggerNoPayload)
		{
			param = {}
		}
		else if(node.TreeItemType === TreeItemType.TriggerFilePayload)
		{
			if(!node.PayloadPath) {
				ui.showWarningMessage('Payload Path is not set');
				this.SetNodeRunning(node, false);
				return; 
			}

			let payload = await vscode.workspace.openTextDocument(node.PayloadPath);
			if(payload===undefined){ 
				ui.showWarningMessage('File not found: ' + node.PayloadPath);
				this.SetNodeRunning(node, false);
				return; 
			}
			if(!api.isJsonString(payload.getText())){
				ui.showWarningMessage('File content is not a valid JSON: ' + node.PayloadPath);
				this.SetNodeRunning(node, false);
				return; 
			}
			param = api.ParseJson(payload.getText())
		}
		else
		{
			let config = await vscode.window.showInputBox({ placeHolder: 'Enter Payload Json or leave empty' });
			if(config===undefined){ return; }
			if(config && !api.isJsonString(config)){
				ui.showInfoMessage('Config should be a valid JSON');
				this.SetNodeRunning(node, false);
				return; 
			}
			if(config)
			{
				param = api.ParseJson(config)
			}
		}
		
		let result = await api.TriggerStepFunc(node.StepFuncArn, param);
		if(!result.isSuccessful)
		{
			ui.logToOutput("api.TriggerStepFunc Error !!!", result.error);
			ui.showErrorMessage('Trigger StepFunc Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}
		ui.logToOutput("api.TriggerStepFunc Success !!!");

		const executionArn = result.result?.executionArn;
		if(executionArn)
		{
			this.treeDataProvider.AddExecutionNode(node, executionArn);
			ui.logToOutput("api.TriggerStepFunc executionArn \n" + executionArn);
		}
		else
		{
			ui.logToOutput("api.TriggerStepFunc: executionArn is undefined");
		}
		
		ui.showInfoMessage('StepFunc Triggered Successfully');
		this.SetNodeRunning(node, false);
	}

	private SetNodeRunning(node: StepFuncTreeItem, isRunning: boolean) {
		node.IsRunning = isRunning; node.refreshUI(); this.treeDataProvider.Refresh();
	}

	async ViewLatestLog(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.ViewLatestLog Started');
		if(node.IsRunning) { return; }

		let logGroupArn = await api.GetStepFuncLogGroupArn(node.StepFuncArn);
		if(!logGroupArn) {
			ui.showWarningMessage('Log Group not found for this Step Function');
			this.SetNodeRunning(node, false);
			return;
		}

		this.SetNodeRunning(node, true);

		const logGroupName = await api.GetStepFuncLogGroupName(node.StepFuncArn);
		if(!logGroupName) {
			ui.showWarningMessage('Log Group not found for this Step Function');
			this.SetNodeRunning(node, false);
			return;
		}

		let resultLogStream = await api.GetLatestStepFuncLogStreamName(node.StepFuncArn);
		if(!resultLogStream.isSuccessful)
		{
			ui.logToOutput("api.GetLatestStepFuncLogStreamName Error !!!", resultLogStream.error);
			ui.showErrorMessage('Get StepFunc LogStream Error !!!', resultLogStream.error);
			this.SetNodeRunning(node, false);
			return;
		}

		CloudWatchLogView.Render(this.context.extensionUri, node.Region, logGroupName, resultLogStream.result);
		this.SetNodeRunning(node, false);
	}

	async SelectAwsProfile(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.SelectAwsProfile Started');

		var result = await api.GetAwsProfileList();
		if(!result.isSuccessful){ return; }

		let selectedAwsProfile = await vscode.window.showQuickPick(result.result, {canPickMany:false, placeHolder: 'Select Aws Profile'});
		if(!selectedAwsProfile){ return; }

		this.AwsProfile = selectedAwsProfile;
		this.SaveState();
		this.SetFilterMessage();
	}

	async UpdateAwsEndPoint() {
		ui.logToOutput('StepFuncTreeView.UpdateAwsEndPoint Started');

		let awsEndPointUrl = await vscode.window.showInputBox({ placeHolder: 'Enter Aws End Point URL (Leave Empty To Return To Default)' });
		if(awsEndPointUrl===undefined){ return; }
		if(awsEndPointUrl.length===0) { this.AwsEndPoint = undefined; }
		else
		{
			this.AwsEndPoint = awsEndPointUrl;
		}
		this.SaveState();
		this.Refresh();
	}

	async PrintStepFunc(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.PrintStepFunc Started');
		if(node.TreeItemType !== TreeItemType.StepFunc) { return;}

		let result = await api.GetStepFuncDescription(node.StepFuncArn);
		if(!result.isSuccessful)
		{
			ui.logToOutput("api.GetStepFunc Error !!!", result.error);
			ui.showErrorMessage('Get StepFunc Error !!!', result.error);
			return;
		}
		let jsonString = JSON.stringify(result.result, null, 2);
		ui.ShowTextDocument(jsonString, "json");

	}

	async UpdateStepFuncCodes(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.UpdateStepFuncCodes Started');
		if(node.TreeItemType === TreeItemType.CodePath && node.Parent) { node = node.Parent;}
		if(node.TreeItemType !== TreeItemType.Code) { return;}
		if(node.IsRunning) { return; }
		this.SetNodeRunning(node, true);
		if(!node.CodePath) { 
			ui.showWarningMessage("Please Set Code Path First");
			this.SetNodeRunning(node, false);
			return; 
		}

		let result = await api.UpdateStepFuncCode(node.StepFuncArn, node.CodePath);
		if(!result.isSuccessful)
		{
			ui.logToOutput("api.UpdateStepFuncCode Error !!!", result.error);
			ui.showErrorMessage('Update StepFunc Code Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}
		ui.logToOutput("api.UpdateStepFuncCode Success !!!");
		ui.showInfoMessage('StepFunc Code Updated Successfully');
		this.SetNodeRunning(node, false);
	}

	async SetCodePath(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.SetCodePath Started');
		if(node.TreeItemType === TreeItemType.CodePath && node.Parent) { node = node.Parent;}
		if(node.TreeItemType !== TreeItemType.Code) { return;}

		const selectedPath = await vscode.window.showOpenDialog({
			canSelectMany: false,
			openLabel: 'Select',
			canSelectFiles: true,
			canSelectFolders: true
		});
		
		if(!selectedPath || selectedPath.length===0){ return; }

		node.CodePath = selectedPath[0].path;
		this.treeDataProvider.AddCodePath(node.Region, node.StepFuncArn, node.CodePath);
		this.SaveState();
		ui.logToOutput("Code Path: " + node.CodePath);
		ui.showInfoMessage('Code Path Set Successfully');
	}

	async UnsetCodePath(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.UnsetCodePath Started');
		if(node.TreeItemType === TreeItemType.CodePath && node.Parent) { node = node.Parent;}
		if(node.TreeItemType !== TreeItemType.Code) { return;}

		node.CodePath = undefined
		this.treeDataProvider.RemoveCodePath(node.Region, node.StepFuncArn);
		this.SaveState();
		ui.logToOutput("Code Path: " + node.CodePath);
		ui.showInfoMessage('Code Path Removed Successfully');
	}

	async OpenCodeFile(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.OpenCodeFile Started');
		if(node.TreeItemType === TreeItemType.CodePath && node.Parent) { node = node.Parent;}
		if(node.TreeItemType !== TreeItemType.Code) { return;}

		ui.openFile(node.CodePath!);
	}

	async DownloadDefinitionFromAWS(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.DownloadDefinitionFromAWS Started');
		if(node.TreeItemType === TreeItemType.CodePath && node.Parent) { node = node.Parent;}
		if(node.TreeItemType !== TreeItemType.Code) { return;}
		if(node.IsRunning) { return; }
		
		this.SetNodeRunning(node, true);

		try {
			// Get the step function definition from AWS
			let result = await api.GetStepFuncDescription(node.StepFuncArn);
			if(!result.isSuccessful || !result.result)
			{
				ui.logToOutput("api.GetStepFuncDescription Error !!!", result.error);
				ui.showErrorMessage('Get StepFunc Description Error !!!', result.error);
				this.SetNodeRunning(node, false);
				return;
			}

			// Extract the definition
			const definition = result.result.definition;
			if(!definition) {
				ui.showWarningMessage('No definition found in Step Function response');
				this.SetNodeRunning(node, false);
				return;
			}

			// Parse and pretty-print the JSON
			let definitionJson: string;
			try {
				const parsed = JSON.parse(definition);
				definitionJson = JSON.stringify(parsed, null, 2);
			} catch (e) {
				definitionJson = definition;
			}

			// Prompt user for save location
			const stepFuncName = node.StepFuncName || 'stepfunction';
			const defaultFileName = `${stepFuncName}.asl.json`;
			
			// Get workspace root path if available
			let defaultUri: vscode.Uri;
			if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
				// Use the first workspace folder as default path
				const workspaceRoot = vscode.workspace.workspaceFolders[0].uri;
				defaultUri = vscode.Uri.joinPath(workspaceRoot, defaultFileName);
			} else {
				// Fallback to just the filename if no workspace is open
				defaultUri = vscode.Uri.file(defaultFileName);
			}
			
			const saveUri = await vscode.window.showSaveDialog({
				defaultUri: defaultUri,
				filters: {
					'JSON Files': ['json'],
					'All Files': ['*']
				},
				saveLabel: 'Save Definition'
			});

			if(!saveUri) {
				this.SetNodeRunning(node, false);
				return;
			}

			// Write the file
			const fs = require('fs');
			fs.writeFileSync(saveUri.fsPath, definitionJson, 'utf8');

			// Set as code path
			node.CodePath = saveUri.fsPath;
			this.treeDataProvider.AddCodePath(node.Region, node.StepFuncArn, saveUri.fsPath);
			this.SaveState();

			ui.logToOutput("Definition downloaded and saved to: " + saveUri.fsPath);
			ui.showInfoMessage('Definition Downloaded and Code Path Set Successfully');
			
			// Optionally open the file
			const openFile = await vscode.window.showQuickPick(['Yes', 'No'], {
				placeHolder: 'Open the downloaded file?'
			});
			
			if(openFile === 'Yes') {
				ui.openFile(saveUri.fsPath);
			}

		} catch (error: any) {
			ui.logToOutput("StepFuncTreeView.DownloadDefinitionFromAWS Error !!!", error);
			ui.showErrorMessage('Download Definition Error !!!', error);
		} finally {
			this.SetNodeRunning(node, false);
		}
	}

	async CompareLocalWithAWS(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.CompareLocalWithAWS Started');
		if(node.TreeItemType === TreeItemType.CodePath && node.Parent) { node = node.Parent;}
		if(node.TreeItemType !== TreeItemType.Code) { return;}
		if(node.IsRunning) { return; }
		
		if(!node.CodePath) {
			ui.showWarningMessage('Please set code path first');
			return;
		}

		this.SetNodeRunning(node, true);

		try {
			// Read local file
			const fs = require('fs');
			let localContent: string;
			try {
				localContent = fs.readFileSync(node.CodePath, 'utf8');
			} catch (error: any) {
				ui.showErrorMessage('Failed to read local file', error);
				this.SetNodeRunning(node, false);
				return;
			}

			// Get the step function definition from AWS
			let result = await api.GetStepFuncDescription(node.StepFuncArn);
			if(!result.isSuccessful || !result.result)
			{
				ui.logToOutput("api.GetStepFuncDescription Error !!!", result.error);
				ui.showErrorMessage('Get StepFunc Description Error !!!', result.error);
				this.SetNodeRunning(node, false);
				return;
			}

			// Extract the AWS definition
			const awsDefinition = result.result.definition;
			if(!awsDefinition) {
				ui.showWarningMessage('No definition found in Step Function response');
				this.SetNodeRunning(node, false);
				return;
			}

			// Normalize both JSONs for comparison (parse and stringify to remove formatting differences)
			let localJson: any;
			let awsJson: any;
			
			try {
				localJson = JSON.parse(localContent);
			} catch (error: any) {
				ui.showErrorMessage('Local file is not valid JSON', error);
				this.SetNodeRunning(node, false);
				return;
			}

			try {
				awsJson = JSON.parse(awsDefinition);
			} catch (error: any) {
				ui.showErrorMessage('AWS definition is not valid JSON', error);
				this.SetNodeRunning(node, false);
				return;
			}

			// Compare normalized JSON strings
			const localNormalized = JSON.stringify(localJson, Object.keys(localJson).sort(), 2);
			const awsNormalized = JSON.stringify(awsJson, Object.keys(awsJson).sort(), 2);

			const isIdentical = localNormalized === awsNormalized;

			if(isIdentical) {
				ui.logToOutput('Local file and AWS definition are identical');
				const action = await vscode.window.showInformationMessage(
					'✓ Local file and AWS definition are identical',
					'OK'
				);
			} else {
				ui.logToOutput('Local file and AWS definition are different');
				const action = await vscode.window.showWarningMessage(
					'⚠ Local file and AWS definition are different',
					'Show Diff',
					'Cancel'
				);

				if(action === 'Show Diff') {
					// Create temp file for AWS definition
					const os = require('os');
					const path = require('path');
					const tempDir = os.tmpdir();
					const tempFileName = `${node.StepFuncName || 'stepfunction'}-aws.asl.json`;
					const tempFilePath = path.join(tempDir, tempFileName);
					
					// Write AWS definition to temp file with formatting
					const awsFormatted = JSON.stringify(awsJson, null, 2);
					fs.writeFileSync(tempFilePath, awsFormatted, 'utf8');

					// Open diff editor
					const localUri = vscode.Uri.file(node.CodePath);
					const awsUri = vscode.Uri.file(tempFilePath);
					
					await vscode.commands.executeCommand('vscode.diff', 
						awsUri, 
						localUri, 
						`AWS ↔ Local: ${node.StepFuncName || 'Step Function'}`
					);
				}
			}

		} catch (error: any) {
			ui.logToOutput("StepFuncTreeView.CompareLocalWithAWS Error !!!", error);
			ui.showErrorMessage('Compare Error !!!', error);
		} finally {
			this.SetNodeRunning(node, false);
		}
	}

	async ViewLog(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.ViewLog Started');

		let logGroupArn = await api.GetStepFuncLogGroupArn(node.StepFuncArn);
		if(!logGroupArn) {
			ui.showWarningMessage('Log Group not found for this Step Function');
			this.SetNodeRunning(node, false);
			return;
		}

		const logGroupName = await api.GetStepFuncLogGroupName(node.StepFuncArn);
		if(!logGroupName) {
			ui.showWarningMessage('Log Group not found for this Step Function');
			return;
		}

		const logStreamNameResponse = await api.GetLatestStepFuncLogStreamName(node.StepFuncArn);
		if(!logStreamNameResponse.isSuccessful) {
			ui.showWarningMessage('Log Stream not found for this Step Function');
			return;
		}

		CloudWatchLogView.Render(this.context.extensionUri, node.Region, logGroupName, logStreamNameResponse.result);
	}

	async RefreshLogStreams(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.RefreshLogs Started');
		if(node.IsRunning) { return; }
		if(node.TreeItemType !== TreeItemType.LogGroup) { return;}
		this.SetNodeRunning(node, true);

		let logGroupArn = await api.GetStepFuncLogGroupArn(node.StepFuncArn);
		if(!logGroupArn) {
			ui.showWarningMessage('Log Group not found for this Step Function');
			this.SetNodeRunning(node, false);
			return;
		}

		let resultLogs = await api.GetLatestStepFuncLogStreams(node.StepFuncArn);
		if(!resultLogs.isSuccessful)
		{
			ui.logToOutput("api.GetLatestStepFuncLogStreams Error !!!", resultLogs.error);
			ui.showErrorMessage('Get StepFunc Logs Error !!!', resultLogs.error);
			this.SetNodeRunning(node, false);
			return;
		}
		ui.logToOutput("api.GetLatestStepFuncLogStreams Success !!!");
		this.treeDataProvider.AddLogStreams(node, resultLogs.result)
		ui.showInfoMessage('StepFunc Logs Retrieved Successfully');
		this.SetNodeRunning(node, false);
	}

	async RefreshExecutions(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.RefreshExecutions Started');
		if(node.IsRunning) { return; }
		if(node.TreeItemType !== TreeItemType.ExecutionGroup) { return;}
		this.SetNodeRunning(node, true);

		let executionName = await vscode.window.showInputBox({ placeHolder: 'Enter Execution Name / Search Text' });
		if(executionName===undefined){ 
			this.SetNodeRunning(node, false);
			return; 
		}

		let resultExecutions = await api.GetStepFuncExecutions(node.StepFuncArn, executionName);
		if(!resultExecutions.isSuccessful)
		{
			ui.logToOutput("api.GetStepFuncExecutions Error !!!", resultExecutions.error);
			ui.showErrorMessage('Get StepFunc Executions Error !!!', resultExecutions.error);
			this.SetNodeRunning(node, false);
			return;
		}
		ui.logToOutput("api.GetStepFuncExecutions Success !!!");
		this.treeDataProvider.AddExecutions(node, resultExecutions.result)
		ui.showInfoMessage('StepFunc Executions Retrieved Successfully');
		this.SetNodeRunning(node, false);
	}

	async RefreshSuccessfulExecutions(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.RefreshSuccessfulExecutions Started');
		if(node.IsRunning) { return; }
		if(node.TreeItemType !== TreeItemType.SuccessfulExecutionGroup) { return;}
		this.SetNodeRunning(node, true);

		let executionName = await vscode.window.showInputBox({ placeHolder: 'Enter Execution Name / Search Text' });
		if(executionName===undefined){ 
			this.SetNodeRunning(node, false);
			return; 
		}

		let resultExecutions = await api.GetStepFuncExecutions(node.StepFuncArn, executionName, 20, 'SUCCEEDED');
		if(!resultExecutions.isSuccessful)
		{
			ui.logToOutput("api.GetStepFuncExecutions Error !!!", resultExecutions.error);
			ui.showErrorMessage('Get Successful Executions Error !!!', resultExecutions.error);
			this.SetNodeRunning(node, false);
			return;
		}
		ui.logToOutput("api.GetStepFuncExecutions Success !!!");
		this.treeDataProvider.AddExecutions(node, resultExecutions.result)
		ui.showInfoMessage('Successful Executions Retrieved Successfully');
		this.SetNodeRunning(node, false);
	}

	async RefreshFailedExecutions(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.RefreshFailedExecutions Started');
		if(node.IsRunning) { return; }
		if(node.TreeItemType !== TreeItemType.FailedExecutionGroup) { return;}
		this.SetNodeRunning(node, true);

		let executionName = await vscode.window.showInputBox({ placeHolder: 'Enter Execution Name / Search Text' });
		if(executionName===undefined){ 
			this.SetNodeRunning(node, false);
			return; 
		}

		let resultExecutions = await api.GetStepFuncExecutions(node.StepFuncArn, executionName, 20, 'FAILED');
		if(!resultExecutions.isSuccessful)
		{
			ui.logToOutput("api.GetStepFuncExecutions Error !!!", resultExecutions.error);
			ui.showErrorMessage('Get Failed Executions Error !!!', resultExecutions.error);
			this.SetNodeRunning(node, false);
			return;
		}
		ui.logToOutput("api.GetStepFuncExecutions Success !!!");
		this.treeDataProvider.AddExecutions(node, resultExecutions.result)
		ui.showInfoMessage('Failed Executions Retrieved Successfully');
		this.SetNodeRunning(node, false);
	}

	async RefreshRunningExecutions(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.RefreshRunningExecutions Started');
		if(node.IsRunning) { return; }
		if(node.TreeItemType !== TreeItemType.RunningExecutionGroup) { return;}
		this.SetNodeRunning(node, true);

		let executionName = await vscode.window.showInputBox({ placeHolder: 'Enter Execution Name / Search Text' });
		if(executionName===undefined){ 
			this.SetNodeRunning(node, false);
			return; 
		}

		let resultExecutions = await api.GetStepFuncExecutions(node.StepFuncArn, executionName, 20, 'RUNNING');
		if(!resultExecutions.isSuccessful)
		{
			ui.logToOutput("api.GetStepFuncExecutions Error !!!", resultExecutions.error);
			ui.showErrorMessage('Get Running Executions Error !!!', resultExecutions.error);
			this.SetNodeRunning(node, false);
			return;
		}
		ui.logToOutput("api.GetStepFuncExecutions Success !!!");
		this.treeDataProvider.AddExecutions(node, resultExecutions.result)
		ui.showInfoMessage('Running Executions Retrieved Successfully');
		this.SetNodeRunning(node, false);
	}

	async RemovePayloadPath(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.RemovePayloadPath Started');
		if(node.TreeItemType !== TreeItemType.TriggerFilePayload) { return;}

		this.treeDataProvider.RemovePayloadPath(node);
		this.SaveState();
		ui.showInfoMessage('Payload Path Removed Successfully');
	}

	async AddPayloadPath(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.AddPayloadPath Started');
		if(node.TreeItemType !== TreeItemType.TriggerGroup) { return;}

		const selectedPath = await vscode.window.showOpenDialog({
			canSelectMany: false,
			openLabel: 'Select',
			canSelectFiles: true
		});
		
		if(!selectedPath || selectedPath.length===0){ return; }

		this.treeDataProvider.AddPayloadPath(node, selectedPath[0].path);
		this.SaveState();
		ui.showInfoMessage('Payload Path Added Successfully');
	}

	async ViewResponsePayload(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.ViewResponsePayload Started');
		if(node.TreeItemType !== TreeItemType.ResponsePayload) { return; }
		if(!node.ExecutionArn){ return; }

		ui.logToOutput(node.ExecutionArn);
		ui.ShowTextDocument(node.ExecutionArn, "text");
	}

	async ViewExecutionDetails(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.ViewExecutionDetails Started');
		if(node.TreeItemType !== TreeItemType.Execution) { return; }
		if(!node.ExecutionArn){ return; }

		if(node.ExecutionDetails) {
			ui.logToOutput('Using cached execution details');
			let jsonString = JSON.stringify(node.ExecutionDetails, null, 2);
			ui.ShowTextDocument(jsonString, "json");
			return;
		}

		if(node.IsRunning) { return; }
		this.SetNodeRunning(node, true);

		let result = await api.GetExecutionDetails(node.Region, node.ExecutionArn);
		if(!result.isSuccessful)
		{
			ui.logToOutput("api.GetExecutionDetails Error !!!", result.error);
			ui.showErrorMessage('Get Execution Details Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}

		node.ExecutionDetails = result.result;
		let jsonString = JSON.stringify(result.result, null, 2);
		ui.ShowTextDocument(jsonString, "json");
		this.SetNodeRunning(node, false);
	}

	async ViewExecutionLog(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.ViewExecutionLog Started');
		if(node.TreeItemType !== TreeItemType.Execution) { return; }
		if(!node.ExecutionArn){ return; }

		// Extract execution name from execution ARN
		// Format: arn:aws:states:region:account-id:execution:stateMachineName:executionName
		const arnParts = node.ExecutionArn.split(':');
		const executionName = arnParts[arnParts.length - 1];

		let logGroupArn = await api.GetStepFuncLogGroupArn(node.StepFuncArn);
		if(!logGroupArn) {
			ui.showWarningMessage('Log Group not found for this Step Function');
			return;
		}

		const logGroupName = await api.GetStepFuncLogGroupName(node.StepFuncArn);
		if(!logGroupName) {
			ui.showWarningMessage('Log Group not found for this Step Function');
			return;
		}
		let logStreamName = await api.GetLatestStepFuncLogStreamName(node.StepFuncArn);
		if(!logStreamName.isSuccessful) {
			ui.showWarningMessage('Log Stream not found for this Step Function');
			return;
		}
		CloudWatchLogView.Render(this.context.extensionUri, node.Region, logGroupName, logStreamName.result);
	}

	async ViewCodeGraph(node: StepFuncTreeItem) {
		ui.logToOutput('StepFuncTreeView.ViewCodeGraph Started');
		if(node.TreeItemType === TreeItemType.CodePath && node.Parent) { node = node.Parent;}
		if(node.TreeItemType !== TreeItemType.Code) { return;}

		if(!node.CodePath) {
			ui.showWarningMessage('Please Set Code Path First');
			return;
		}

		//StepFuncGraphView.Render(this.context.extensionUri, node.StepFuncName, node.CodePath);
		StepFuncStudioView.Render(this.context.extensionUri, node.StepFuncName, node.CodePath);

	}
}
