/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { DynamodbTreeItem, TreeItemType } from './DynamodbTreeItem';
import { DynamodbTreeDataProvider } from './DynamodbTreeDataProvider';
import * as ui from '../common/UI';
import * as api from '../common/API';
import { CloudWatchLogView } from '../cloudwatch/CloudWatchLogView';

export class DynamodbTreeView {

	public static Current: DynamodbTreeView;
	public view: vscode.TreeView<DynamodbTreeItem>;
	public treeDataProvider: DynamodbTreeDataProvider;
	public context: vscode.ExtensionContext;
	public FilterString: string = "";
	public isShowOnlyFavorite: boolean = false;
	public isShowHiddenNodes: boolean = false;
	public AwsProfile: string = "default";	
	public AwsEndPoint: string | undefined;
	public DynamodbList: {Region: string, Dynamodb: string}[] = [];
	public CodePathList: {Region: string, Dynamodb: string, CodePath: string}[] = [];
	public PayloadPathList: {Region: string, Dynamodb: string, PayloadPath: string}[] = [];


	constructor(context: vscode.ExtensionContext) {
		ui.logToOutput('TreeView.constructor Started');
		DynamodbTreeView.Current = this;
		this.context = context;
		this.LoadState();
		this.treeDataProvider = new DynamodbTreeDataProvider();
		this.view = vscode.window.createTreeView('DynamodbTreeView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
		
		// Listen for tree expansions to load table details
		this.view.onDidExpandElement(async (event) => {
			if (event.element.TreeItemType === TreeItemType.Dynamodb) {
				await this.treeDataProvider.PopulateTableDetails(event.element);
			}
		});
		
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
			ui.logToOutput('DynamodbTreeView.TestAwsCredentials Error !!!', response.error);
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
			ui.logToOutput('DynamodbTreeView.TestAwsConnection Error !!!', response.error);
			ui.showErrorMessage('Aws Connection Test Error !!!', response.error);
		}
	}

	BugAndNewFeature() {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/necatiarslan/aws-dynamodb-vscode-extension/issues/new'));
	}
	Donate() {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/sponsors/necatiarslan'));
	}

	Refresh(): void {
		ui.logToOutput('DynamodbTreeView.refresh Started');

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			title: "Aws Dynamodb: Loading...",
		}, (progress, token) => {
			progress.report({ increment: 0 });

			this.LoadTreeItems();

			return new Promise<void>(resolve => { resolve(); });
		});
	}

	LoadTreeItems(){
		ui.logToOutput('DynamodbTreeView.loadTreeItems Started');
		this.treeDataProvider.Refresh();
		this.SetViewTitle();
	}

	ResetView(): void {
		ui.logToOutput('DynamodbTreeView.resetView Started');
		this.FilterString = '';

		this.treeDataProvider.Refresh();
		this.SetViewTitle();

		this.SaveState();
		this.Refresh();
	}

	async AddToFav(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.AddToFav Started');
		node.IsFav = true;
		node.refreshUI();
	}

	async HideNode(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.HideNode Started');
		node.IsHidden = true;

		this.treeDataProvider.Refresh();
	}

	async UnHideNode(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.UnHideNode Started');
		node.IsHidden = false;
	}

	async DeleteFromFav(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.DeleteFromFav Started');
		node.IsFav = false;
		node.refreshUI();
	}

	async Filter() {
		ui.logToOutput('DynamodbTreeView.Filter Started');
		let filterStringTemp = await vscode.window.showInputBox({ value: this.FilterString, placeHolder: 'Enter Your Filter Text' });

		if (filterStringTemp === undefined) { return; }

		this.FilterString = filterStringTemp;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async ShowOnlyFavorite() {
		ui.logToOutput('DynamodbTreeView.ShowOnlyFavorite Started');
		this.isShowOnlyFavorite = !this.isShowOnlyFavorite;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async ShowHiddenNodes() {
		ui.logToOutput('DynamodbTreeView.ShowHiddenNodes Started');
		this.isShowHiddenNodes = !this.isShowHiddenNodes;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async SetViewTitle(){
		this.view.title = "Aws Dynamodb";
	}

	SaveState() {
		ui.logToOutput('DynamodbTreeView.saveState Started');
		try {

			this.context.globalState.update('AwsProfile', this.AwsProfile);
			this.context.globalState.update('FilterString', this.FilterString);
			this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
			this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
			this.context.globalState.update('DynamodbList', this.DynamodbList);
			this.context.globalState.update('CodePathList', this.CodePathList);
			this.context.globalState.update('PayloadPathList', this.PayloadPathList);
			this.context.globalState.update('AwsEndPoint', this.AwsEndPoint);

			ui.logToOutput("DynamodbTreeView.saveState Successfull");
		} catch (error) {
			ui.logToOutput("DynamodbTreeView.saveState Error !!!");
		}
	}

	LoadState() {
		ui.logToOutput('DynamodbTreeView.loadState Started');
		try {
			let AwsEndPointTemp: string | undefined = this.context.globalState.get('AwsEndPoint');
			if (AwsEndPointTemp) { this.AwsEndPoint = AwsEndPointTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("DynamodbTreeView.loadState AwsEndPoint Error !!!", error);
			ui.showErrorMessage("Aws Dynamodb Load State AwsEndPoint Error !!!", error);
		}

		try {
			let AwsProfileTemp: string | undefined = this.context.globalState.get('AwsProfile');
			if (AwsProfileTemp) { this.AwsProfile = AwsProfileTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("DynamodbTreeView.loadState AwsProfile Error !!!", error);
			ui.showErrorMessage("Aws Dynamodb Load State AwsProfile Error !!!", error);
		}

		try {
			let filterStringTemp: string | undefined = this.context.globalState.get('FilterString');
			if (filterStringTemp) { this.FilterString = filterStringTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("DynamodbTreeView.loadState FilterString Error !!!", error);
			ui.showErrorMessage("Aws Dynamodb Load State FilterString Error !!!", error);
		}

		try {
			let ShowOnlyFavoriteTemp: boolean | undefined = this.context.globalState.get('ShowOnlyFavorite');
			if (ShowOnlyFavoriteTemp) { this.isShowOnlyFavorite = ShowOnlyFavoriteTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("DynamodbTreeView.loadState Error !!!", error);
			ui.showErrorMessage("Aws Dynamodb Load State Error !!!", error);
		}

		try {
			let ShowHiddenNodesTemp: boolean | undefined = this.context.globalState.get('ShowHiddenNodes');
			if (ShowHiddenNodesTemp) { this.isShowHiddenNodes = ShowHiddenNodesTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("DynamodbTreeView.loadState isShowHiddenNodes Error !!!", error);
			ui.showErrorMessage("Aws Dynamodb Load State isShowHiddenNodes Error !!!", error);
		}

		try {
			let DynamodbListTemp:{Region: string, Dynamodb: string}[] | undefined  = this.context.globalState.get('DynamodbList');
			if(DynamodbListTemp){ this.DynamodbList = DynamodbListTemp; }

			let CodePathListTemp:{Region: string, Dynamodb: string, CodePath: string}[] | undefined  = this.context.globalState.get('CodePathList');
			if(CodePathListTemp){ this.CodePathList = CodePathListTemp; }

			let PayloadPathListTemp:{Region: string, Dynamodb: string, PayloadPath: string}[] | undefined  = this.context.globalState.get('PayloadPathList');
			if(PayloadPathListTemp){ this.PayloadPathList = PayloadPathListTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("DynamodbTreeView.loadState DynamodbList/CodePathList Error !!!", error);
			ui.showErrorMessage("Aws Dynamodb Load State DynamodbList/CodePathList Error !!!", error);
		}

	}

	async SetFilterMessage(){
		if(this.DynamodbList.length > 0)
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

	async AddDynamodb(){
		ui.logToOutput('DynamodbTreeView.AddDynamodb Started');

		let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
		if(selectedRegion===undefined){ return; }

		let selectedDynamodbName = await vscode.window.showInputBox({ placeHolder: 'Enter Dynamodb Name / Search Text' });
		if(selectedDynamodbName===undefined){ return; }

		var resultDynamodb = await api.GetDynamodbList(selectedRegion, selectedDynamodbName);
		if(!resultDynamodb.isSuccessful){ return; }

		let selectedDynamodbList = await vscode.window.showQuickPick(resultDynamodb.result, {canPickMany:true, placeHolder: 'Select Dynamodb(s)'});
		if(!selectedDynamodbList || selectedDynamodbList.length===0){ return; }

		for(var selectedDynamodb of selectedDynamodbList)
		{
			this.treeDataProvider.AddDynamodb(selectedRegion, selectedDynamodb);
		}
		this.SaveState();
	}

	async RemoveDynamodb(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.RemoveDynamodb Started');
		
		if(node.TreeItemType !== TreeItemType.Dynamodb) { return;}

		this.treeDataProvider.RemoveDynamodb(node.Region, node.Dynamodb);		
		this.SaveState();
	}

	async Goto(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.Goto Started');
		
		if(node.TreeItemType !== TreeItemType.Dynamodb) { return;}

		//vscode.commands.executeCommand('vscode.openWith', vscode.Uri.parse('https://console.aws.amazon.com/dynamodb/home?region=us-east-1#/functions/' + node.Dynamodb), "external");
		ui.showInfoMessage("Work In Progress");
		
	}

	async DynamodbView(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.DynamodbView Started');
		if(node.TreeItemType !== TreeItemType.Dynamodb) { return;}

		ui.showInfoMessage('Work In Progress');
	}

	async SelectAwsProfile(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.SelectAwsProfile Started');

		var result = await api.GetAwsProfileList();
		if(!result.isSuccessful){ return; }

		let selectedAwsProfile = await vscode.window.showQuickPick(result.result, {canPickMany:false, placeHolder: 'Select Aws Profile'});
		if(!selectedAwsProfile){ return; }

		this.AwsProfile = selectedAwsProfile;
		this.SaveState();
		this.SetFilterMessage();
	}

	async UpdateAwsEndPoint() {
		ui.logToOutput('DynamodbTreeView.UpdateAwsEndPoint Started');

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

	async PrintDynamodb(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.PrintDynamodb Started');
		if(node.TreeItemType !== TreeItemType.Dynamodb) { return;}

		let result = await api.GetDynamodb(node.Region, node.Dynamodb);
		if(!result.isSuccessful)
		{
			ui.logToOutput("api.GetDynamodb Error !!!", result.error);
			ui.showErrorMessage('Get Dynamodb Error !!!', result.error);
			return;
		}
		let jsonString = JSON.stringify(result.result, null, 2);
		ui.ShowTextDocument(jsonString, "json");

	}

	async CreateTable() {
		ui.logToOutput('DynamodbTreeView.CreateTable Started');

		// Get region
		let region = await vscode.window.showInputBox({ 
			placeHolder: 'Enter AWS Region (e.g., us-east-1)', 
			value: 'us-east-1' 
		});
		if (!region) { return; }

		// Get table name
		let tableName = await vscode.window.showInputBox({ 
			placeHolder: 'Enter Table Name',
			validateInput: (value) => {
				if (!value || value.length === 0) {
					return 'Table name is required';
				}
				if (!/^[a-zA-Z0-9_.-]+$/.test(value)) {
					return 'Table name can only contain alphanumeric characters, dots, hyphens, and underscores';
				}
				return null;
			}
		});
		if (!tableName) { return; }

		// Get partition key name
		let partitionKeyName = await vscode.window.showInputBox({ 
			placeHolder: 'Enter Partition Key Name (e.g., id)',
			prompt: 'The primary key attribute name'
		});
		if (!partitionKeyName) { return; }

		// Get partition key type
		let partitionKeyType = await vscode.window.showQuickPick(['S (String)', 'N (Number)', 'B (Binary)'], {
			placeHolder: 'Select Partition Key Data Type'
		});
		if (!partitionKeyType) { return; }
		partitionKeyType = partitionKeyType.charAt(0); // Extract S, N, or B

		// Ask if sort key is needed
		let needsSortKey = await vscode.window.showQuickPick(['No', 'Yes'], {
			placeHolder: 'Does this table need a Sort Key?'
		});
		
		let sortKeyName, sortKeyType;
		if (needsSortKey === 'Yes') {
			sortKeyName = await vscode.window.showInputBox({ 
				placeHolder: 'Enter Sort Key Name'
			});
			if (!sortKeyName) { return; }

			let sortKeyTypeTemp = await vscode.window.showQuickPick(['S (String)', 'N (Number)', 'B (Binary)'], {
				placeHolder: 'Select Sort Key Data Type'
			});
			if (!sortKeyTypeTemp) { return; }
			sortKeyType = sortKeyTypeTemp.charAt(0);
		}

		// Confirm creation
		let confirm = await vscode.window.showQuickPick(['Yes', 'No'], {
			placeHolder: `Create table "${tableName}" in ${region}?`
		});
		if (confirm !== 'Yes') { return; }

		// Create the table
		let result = await api.CreateDynamodbTable(
			region, 
			tableName, 
			partitionKeyName, 
			partitionKeyType,
			sortKeyName,
			sortKeyType
		);

		if (result.isSuccessful) {
			// Add to tree view
			this.treeDataProvider.AddDynamodb(region, tableName);
			this.SaveState();
			this.Refresh();
		}
	}

	async DeleteTable(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.DeleteTable Started');
		if (node.TreeItemType !== TreeItemType.Dynamodb) { return; }

		// Confirm deletion
		let confirm = await vscode.window.showWarningMessage(
			`Are you sure you want to DELETE table "${node.Dynamodb}" in ${node.Region}? This action CANNOT be undone!`,
			{ modal: true },
			'Delete Table'
		);

		if (confirm !== 'Delete Table') { return; }

		// Double confirmation
		let doubleConfirm = await vscode.window.showInputBox({
			placeHolder: `Type "${node.Dynamodb}" to confirm deletion`,
			prompt: 'This will permanently delete the table and all its data',
			validateInput: (value) => {
				if (value !== node.Dynamodb) {
					return `Please type "${node.Dynamodb}" exactly to confirm`;
				}
				return null;
			}
		});

		if (doubleConfirm !== node.Dynamodb) { return; }

		// Delete the table
		let result = await api.DeleteDynamodbTable(node.Region, node.Dynamodb);
		
		if (result.isSuccessful) {
			this.treeDataProvider.RemoveDynamodb(node.Region, node.Dynamodb);
			this.SaveState();
			this.Refresh();
		}
	}

	async EditCapacity(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.EditCapacity Started');
		if (node.TreeItemType !== TreeItemType.Dynamodb) { return; }

		// Get current capacity settings
		let tableDetails = await api.GetDynamodb(node.Region, node.Dynamodb);
		if (!tableDetails.isSuccessful) { return; }

		let details = api.ExtractTableDetails(tableDetails.result);

		// Ask billing mode
		let billingMode = await vscode.window.showQuickPick(
			['PAY_PER_REQUEST (On-Demand)', 'PROVISIONED'],
			{
				placeHolder: 'Select Billing Mode',
				canPickMany: false
			}
		);
		if (!billingMode) { return; }

		let mode = billingMode.startsWith('PAY_PER_REQUEST') ? 'PAY_PER_REQUEST' : 'PROVISIONED';
		let readCapacity, writeCapacity;

		if (mode === 'PROVISIONED') {
			let readInput = await vscode.window.showInputBox({
				placeHolder: 'Enter Read Capacity Units',
				value: details.readCapacity?.toString() || '5',
				validateInput: (value) => {
					if (!value || isNaN(Number(value)) || Number(value) < 1) {
						return 'Please enter a valid number >= 1';
					}
					return null;
				}
			});
			if (!readInput) { return; }
			readCapacity = Number(readInput);

			let writeInput = await vscode.window.showInputBox({
				placeHolder: 'Enter Write Capacity Units',
				value: details.writeCapacity?.toString() || '5',
				validateInput: (value) => {
					if (!value || isNaN(Number(value)) || Number(value) < 1) {
						return 'Please enter a valid number >= 1';
					}
					return null;
				}
			});
			if (!writeInput) { return; }
			writeCapacity = Number(writeInput);
		}

		let result = await api.UpdateTableCapacity(
			node.Region,
			node.Dynamodb,
			readCapacity,
			writeCapacity,
			mode
		);

		if (result.isSuccessful) {
			this.Refresh();
		}
	}

	async QueryTable(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.QueryTable Started');
		if (node.TreeItemType !== TreeItemType.Dynamodb) { return; }

		// Get table details to know the keys
		let tableDetails = await api.GetDynamodb(node.Region, node.Dynamodb);
		if (!tableDetails.isSuccessful) { return; }

		let details = api.ExtractTableDetails(tableDetails.result);

		if (!details.partitionKey) {
			ui.showErrorMessage('Cannot query: Table schema not found', new Error('Table schema not found'));
			return;
		}

		// Open the QueryTablePanel webview
		const { QueryTablePanel } = await import('./QueryTablePanel');
		await QueryTablePanel.createOrShow(
			this.context.extensionUri,
			node.Region,
			node.Dynamodb,
			details
		);
	}

	async ScanTable(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.ScanTable Started');
		if (node.TreeItemType !== TreeItemType.Dynamodb) { return; }

		// Get table details
		let tableDetails = await api.GetDynamodb(node.Region, node.Dynamodb);
		if (!tableDetails.isSuccessful) { return; }

		let details = api.ExtractTableDetails(tableDetails.result);

		// Open the ScanTablePanel webview
		const { ScanTablePanel } = await import('./ScanTablePanel');
		await ScanTablePanel.createOrShow(
			this.context.extensionUri,
			node.Region,
			node.Dynamodb,
			details
		);
	}

	async AddItem(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.AddItem Started');
		if (node.TreeItemType !== TreeItemType.Dynamodb) { return; }

		// Get table details to know the key schema
		let tableDetails = await api.GetDynamodb(node.Region, node.Dynamodb);
		if (!tableDetails.isSuccessful) { return; }

		let details = api.ExtractTableDetails(tableDetails.result);

		if (!details.partitionKey) {
			ui.showErrorMessage('Cannot add item: Table schema not found', new Error('Table schema not found'));
			return;
		}

		// Open the AddItemPanel webview
		const { AddItemPanel } = await import('./AddItemPanel');
		await AddItemPanel.createOrShow(
			this.context.extensionUri,
			node.Region,
			node.Dynamodb,
			details
		);
	}

	async EditItem(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.EditItem Started');
		if (node.TreeItemType !== TreeItemType.Dynamodb) { return; }

		ui.showInfoMessage('Edit Item: Please provide the item key and attributes to update');

		// Get table details
		let tableDetails = await api.GetDynamodb(node.Region, node.Dynamodb);
		if (!tableDetails.isSuccessful) { return; }

		let details = api.ExtractTableDetails(tableDetails.result);

		if (!details.partitionKey) {
			ui.showErrorMessage('Cannot edit item: Table schema not found', new Error('Table schema not found'));
			return;
		}

		// Get the key to identify the item
		let partitionKeyValue = await vscode.window.showInputBox({
			placeHolder: `Enter ${details.partitionKey.name} value to identify the item`,
			prompt: `Partition Key: ${details.partitionKey.name} (${details.partitionKey.type})`
		});
		if (!partitionKeyValue) { return; }

		let key: any = {
			[details.partitionKey.name]: { [details.partitionKey.type]: partitionKeyValue }
		};

		if (details.sortKey) {
			let sortKeyValue = await vscode.window.showInputBox({
				placeHolder: `Enter ${details.sortKey.name} value`,
				prompt: `Sort Key: ${details.sortKey.name} (${details.sortKey.type})`
			});
			if (!sortKeyValue) { return; }
			key[details.sortKey.name] = { [details.sortKey.type]: sortKeyValue };
		}

		// Get update expression
		let updateExpression = await vscode.window.showInputBox({
			placeHolder: 'Enter update expression',
			prompt: 'Example: SET #name = :nameVal, #age = :ageVal',
			value: 'SET '
		});
		if (!updateExpression) { return; }

		// Get expression attribute values
		let expressionValues = await vscode.window.showInputBox({
			placeHolder: 'Enter expression attribute values as JSON',
			prompt: 'Example: {":nameVal": {"S": "John"}, ":ageVal": {"N": "31"}}'
		});
		if (!expressionValues) { return; }

		let expressionAttributeValues;
		try {
			expressionAttributeValues = JSON.parse(expressionValues);
		} catch (error) {
			ui.showErrorMessage('Invalid JSON format for expression values', error as Error);
			return;
		}

		// Update the item
		let result = await api.UpdateItem(
			node.Region,
			node.Dynamodb,
			key,
			updateExpression,
			expressionAttributeValues
		);

		if (result.isSuccessful) {
			let jsonString = JSON.stringify(result.result.Attributes, null, 2);
			ui.ShowTextDocument(jsonString, "json");
		}
	}

	async DeleteItem(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.DeleteItem Started');
		if (node.TreeItemType !== TreeItemType.Dynamodb) { return; }

		// Get table details
		let tableDetails = await api.GetDynamodb(node.Region, node.Dynamodb);
		if (!tableDetails.isSuccessful) { return; }

		let details = api.ExtractTableDetails(tableDetails.result);

		if (!details.partitionKey) {
			ui.showErrorMessage('Cannot delete item: Table schema not found', new Error('Table schema not found'));
			return;
		}

		// Get the key to identify the item
		let partitionKeyValue = await vscode.window.showInputBox({
			placeHolder: `Enter ${details.partitionKey.name} value to identify the item to delete`,
			prompt: `Partition Key: ${details.partitionKey.name} (${details.partitionKey.type})`
		});
		if (!partitionKeyValue) { return; }

		let key: any = {
			[details.partitionKey.name]: { [details.partitionKey.type]: partitionKeyValue }
		};

		if (details.sortKey) {
			let sortKeyValue = await vscode.window.showInputBox({
				placeHolder: `Enter ${details.sortKey.name} value`,
				prompt: `Sort Key: ${details.sortKey.name} (${details.sortKey.type})`
			});
			if (!sortKeyValue) { return; }
			key[details.sortKey.name] = { [details.sortKey.type]: sortKeyValue };
		}

		// Confirm deletion
		let confirm = await vscode.window.showWarningMessage(
			'Are you sure you want to delete this item?',
			{ modal: true },
			'Delete Item'
		);
		if (confirm !== 'Delete Item') { return; }

		// Delete the item
		let result = await api.DeleteItem(node.Region, node.Dynamodb, key);
		
		if (result.isSuccessful) {
			this.Refresh();
		}
	}

	async ShowCapacityExplanation(node: DynamodbTreeItem, capacityType: string) {
		ui.logToOutput(`DynamodbTreeView.ShowCapacityExplanation Started for ${capacityType}`);
		
		const isRead = capacityType === 'read';
		const capacity = isRead ? (node.ReadCapacity || 0) : (node.WriteCapacity || 0);
		
		// Build detailed explanation
		let explanation = `## ${isRead ? 'Read' : 'Write'} Capacity Units\n\n`;
		explanation += `**Current Capacity:** ${capacity} ${isRead ? 'RCU' : 'WCU'}s\n\n`;
		
		if (isRead) {
			explanation += `### Read Capacity Units (RCU)\n\n`;
			explanation += `One Read Capacity Unit represents:\n`;
			explanation += `- **1 strongly consistent read** per second for items up to **4 KB**\n`;
			explanation += `- **2 eventually consistent reads** per second for items up to **4 KB**\n`;
			explanation += `- **0.5 transactional read requests** per second for items up to **4 KB**\n\n`;
			
			explanation += `### Eventually Consistent Reads\n`;
			explanation += `- Default read mode\n`;
			explanation += `- May not reflect results of a recently completed write\n`;
			explanation += `- **Cost:** Half the RCUs of strongly consistent reads\n`;
			explanation += `- **Formula:** Item size (KB) / 4 KB, rounded up, then divided by 2\n\n`;
			
			explanation += `### Strongly Consistent Reads\n`;
			explanation += `- Returns a result that reflects all writes prior to the read\n`;
			explanation += `- **Cost:** Full RCUs\n`;
			explanation += `- **Formula:** Item size (KB) / 4 KB, rounded up\n\n`;
			
			explanation += `### Transactional Reads\n`;
			explanation += `- Part of DynamoDB transactions\n`;
			explanation += `- Provide ACID guarantees\n`;
			explanation += `- **Cost:** 2x the RCUs of strongly consistent reads\n`;
			explanation += `- **Formula:** (Item size  (KB) / 4 KB, rounded up) × 2\n\n`;
			
			explanation += `### Example Calculations\n`;
			explanation += `For a **6 KB** item:\n`;
			explanation += `- Eventually consistent: 6/4 = 2, rounded up = 2, divided by 2 = **1 RCU**\n`;
			explanation += `- Strongly consistent: 6/4 = 2, rounded up = **2 RCUs**\n`;
			explanation += `- Transactional: 2 × 2 = **4 RCUs**\n\n`;
			
			explanation += `### Your Table Capacity\n`;
			explanation += `With **${capacity} RCUs**, you can perform:\n`;
			explanation += `- ${capacity} strongly consistent reads/sec (4 KB items)\n`;
			explanation += `- ${capacity * 2} eventually consistent reads/sec (4 KB items)\n`;
			explanation += `- ${Math.floor(capacity / 2)} transactional reads/sec (4 KB items)\n`;
		} else {
			explanation += `### Write Capacity Units (WCU)\n\n`;
			explanation += `One Write Capacity Unit represents:\n`;
			explanation += `- **1 standard write** per second for items up to **1 KB**\n`;
			explanation += `- **0.5 transactional write requests** per second for items up to **1 KB**\n\n`;
			
			explanation += `### Standard Writes\n`;
			explanation += `- Default write mode\n`;
			explanation += `- **Formula:** Item size (KB) / 1 KB, rounded up\n\n`;
			
			explanation += `### Transactional Writes\n`;
			explanation += `- Part of DynamoDB transactions\n`;
			explanation += `- Provide ACID guarantees across multiple items/tables\n`;
			explanation += `- **Cost:** 2x the WCUs of standard writes\n`;
			explanation += `- **Formula:** (Item size (KB) / 1 KB, rounded up) × 2\n\n`;
			
			explanation += `### Example Calculations\n`;
			explanation += `For a **2.5 KB** item:\n`;
			explanation += `- Standard write: 2.5/1 = 3, rounded up = **3 WCUs**\n`;
			explanation += `- Transactional write: 3 × 2 = **6 WCUs**\n\n`;
			
			explanation += `### Your Table Capacity\n`;
			explanation += `With **${capacity} WCUs**, you can perform:\n`;
			explanation += `- ${capacity} standard writes/sec (1 KB items)\n`;
			explanation += `- ${Math.floor(capacity / 2)} transactional writes/sec (1 KB items)\n`;
		}
		
		explanation += `\n### Additional Information\n`;
		explanation += `- Larger items consume more capacity units proportionally\n`;
		explanation += `- Capacity is automatically provisioned if using on-demand mode\n`;
		explanation += `- Consider auto-scaling for variable workloads\n`;
		
		// Show in a new document
		ui.ShowTextDocument(explanation, 'markdown');
	}
}
