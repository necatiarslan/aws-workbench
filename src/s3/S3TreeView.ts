/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { S3TreeItem, TreeItemType } from './S3TreeItem';
import { S3TreeDataProvider } from './S3TreeDataProvider';
import * as ui from '../common/UI';
import * as api from '../common/API';
import { ConfigManager } from '../common/ConfigManager';
import { S3Explorer } from './S3Explorer';
import { S3Search } from './S3Search';
import { S3API } from './S3API';


export class S3TreeView {

	public static Current: S3TreeView | undefined;
	public view: vscode.TreeView<S3TreeItem>;
	public treeDataProvider: S3TreeDataProvider;
	public context: vscode.ExtensionContext;
	public FilterString: string = "";
	public isShowOnlyFavorite: boolean = false;
	public isShowHiddenNodes: boolean = false;
	public AwsProfile: string = "default";	
	public AwsEndPoint: string | undefined;
	public AwsRegion: string | undefined;
	public IsSharedIniFileCredentials: boolean = false;
	public CredentialProviderName: string | undefined;
	
	// S3 API instance using new architecture (public so other S3 components can use it)
	public s3Api: S3API;

	constructor(context: vscode.ExtensionContext) {
		ui.logToOutput('TreeView.constructor Started');
		S3TreeView.Current = this;
		this.context = context;
		this.treeDataProvider = new S3TreeDataProvider();
		
		// Initialize S3 API
		this.s3Api = new S3API();
		
		this.LoadState();
		this.view = vscode.window.createTreeView('S3TreeView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
		this.Refresh();
		context.subscriptions.push(this.view);
		this.SetFilterMessage();
		
		// Configure S3 API with current settings
		this.updateS3ApiConfiguration();
	}
	
	/**
	 * Update S3 API configuration with current settings
	 */
	private updateS3ApiConfiguration() {
		if (this.AwsProfile) {
			this.s3Api.setProfile(this.AwsProfile);
		}
		if (this.AwsEndPoint) {
			this.s3Api.setEndpoint(this.AwsEndPoint);
		}
		if (this.AwsRegion) {
			this.s3Api.setRegion(this.AwsRegion);
		}
	}

	async TestAwsConnection(){
		let response = await api.TestAwsCredentials()
		if(response.isSuccessful && response.result){
			ui.logToOutput('Aws Credentials Found, Test Successfull');
			ui.showInfoMessage('Aws Credentials Found, Test Successfull');
		}
		else{
			ui.logToOutput('S3TreeView.TestAwsConnection Error !!!', response.error);
			ui.showErrorMessage('Aws Credentials Can Not Be Found !!!', response.error);
		}
		
		let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
		if(selectedRegion===undefined){ return; }

		response = await api.TestAwsConnection(selectedRegion)
		if(response.isSuccessful && response.result){
			ui.logToOutput('Aws Connection Test Successfull');
			ui.showInfoMessage('Aws Connection Test Successfull');
		}
		else{
			ui.logToOutput('S3TreeView.TestAwsConnection Error !!!', response.error);
			ui.showErrorMessage('Aws Connection Test Error !!!', response.error);
		}
	}

	Refresh(): void {
		ui.logToOutput('S3TreeView.refresh Started');

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			title: "Aws S3: Loading...",
		}, (progress, token) => {
			progress.report({ increment: 0 });

			this.LoadTreeItems();

			return new Promise<void>(resolve => { resolve(); });
		});
	}

	LoadTreeItems(){
		ui.logToOutput('S3TreeView.loadTreeItems Started');

		//this.treeDataProvider.LoadRegionNodeList();
		//this.treeDataProvider.LoadLogGroupNodeList();
		//this.treeDataProvider.LoadLogStreamNodeList();
		//this.treeDataProvider.Refresh();
		this.SetViewTitle();
	}

	ResetView(): void {
		ui.logToOutput('S3TreeView.resetView Started');
		this.FilterString = '';

		this.treeDataProvider.Refresh();
		this.SetViewTitle();

		this.SaveState();
		this.Refresh();
	}

	async AddToFav(node: S3TreeItem) {
		ui.logToOutput('S3TreeView.AddToFav Started');
		node.IsFav = true;
		this.treeDataProvider.Refresh();
	}

	async HideNode(node: S3TreeItem) {
		ui.logToOutput('S3TreeView.HideNode Started');
		node.IsHidden = true;

		this.treeDataProvider.Refresh();
	}

	async UnHideNode(node: S3TreeItem) {
		ui.logToOutput('S3TreeView.UnHideNode Started');
		node.IsHidden = false;
		this.treeDataProvider.Refresh();
	}

	async ShowOnlyInThisProfile(node: S3TreeItem) {
		ui.logToOutput('S3TreeView.ShowOnlyInThisProfile Started');
		if (node.TreeItemType !== TreeItemType.Bucket) { return; }
		if (!node.Bucket) { return; }
		
		if(this.AwsProfile)
		{
			node.ProfileToShow = this.AwsProfile;
			this.treeDataProvider.AddBucketProfile(node.Bucket, node.ProfileToShow);
			this.treeDataProvider.Refresh();
			this.SaveState();
		}
	}

	async ShowInAnyProfile(node: S3TreeItem) {
		ui.logToOutput('S3TreeView.ShowInAnyProfile Started');
		if (node.TreeItemType !== TreeItemType.Bucket) { return; }
		if (!node.Bucket) { return; }
		
		node.ProfileToShow = "";
		this.treeDataProvider.RemoveBucketProfile(node.Bucket);
		this.treeDataProvider.Refresh();
		this.SaveState();
	}
	
	async DeleteFromFav(node: S3TreeItem) {
		ui.logToOutput('S3TreeView.DeleteFromFav Started');
		node.IsFav = false;
		this.treeDataProvider.Refresh();
	}

	async Filter() {
		ui.logToOutput('S3TreeView.Filter Started');
		let filterStringTemp = await vscode.window.showInputBox({ value: this.FilterString, placeHolder: 'Enter Your Filter Text' });

		if (filterStringTemp === undefined) { return; }

		this.FilterString = filterStringTemp;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async ShowOnlyFavorite() {
		ui.logToOutput('S3TreeView.ShowOnlyFavorite Started');
		this.isShowOnlyFavorite = !this.isShowOnlyFavorite;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async ShowHiddenNodes() {
		ui.logToOutput('S3TreeView.ShowHiddenNodes Started');
		this.isShowHiddenNodes = !this.isShowHiddenNodes;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async SetViewTitle(){
		this.view.title = "";
	}

	SaveState() {
		ui.logToOutput('S3TreeView.saveState Started');
		try {

			this.context.globalState.update('AwsProfile', this.AwsProfile);
			this.context.globalState.update('FilterString', this.FilterString);
			this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
			this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
			this.context.globalState.update('BucketList', this.treeDataProvider.GetBucketList());
			this.context.globalState.update('ShortcutList', this.treeDataProvider.GetShortcutList());
			this.context.globalState.update('ViewType', this.treeDataProvider.ViewType);
			this.context.globalState.update('AwsEndPoint', this.AwsEndPoint);
			this.context.globalState.update('AwsRegion', this.AwsRegion);
			this.context.globalState.update('BucketProfileList', this.treeDataProvider.BucketProfileList);

			// Save tree structure to YAML
			const treeStructure = this.treeDataProvider.GetTreeStructure();
			ConfigManager.saveConfig(treeStructure as any); // Cast to any to avoid import issues, structure matches ConfigItem[]

			ui.logToOutput("S3TreeView.saveState Successfull");
		} catch (error) {
			ui.logToOutput("S3TreeView.saveState Error !!!");
		}
	}

	LoadState() {
		ui.logToOutput('S3TreeView.loadState Started');
		try {

			// First, try to load from YAML config file
			const yamlConfig = ConfigManager.loadConfig();
			
			if (yamlConfig) {
				ui.logToOutput('S3TreeView: Loading from YAML config file');
				
				if (yamlConfig.Tree && yamlConfig.Tree.length > 0) {
					// Load from hierarchical structure
					this.treeDataProvider.LoadFromTreeStructure(yamlConfig.Tree);
					ui.logToOutput(`S3TreeView: Loaded tree structure from YAML config`);
				} else {
					// Backward compatibility: Load from flat lists
					if (yamlConfig.BucketList && Array.isArray(yamlConfig.BucketList)) {
						this.treeDataProvider.SetBucketList(yamlConfig.BucketList);
						ui.logToOutput(`S3TreeView: Loaded ${yamlConfig.BucketList.length} buckets from YAML config`);
					}
					
					// Load shortcut list from YAML
					if (yamlConfig.ShortcutList && Array.isArray(yamlConfig.ShortcutList)) {
						this.treeDataProvider.SetShortcutList(yamlConfig.ShortcutList);
						ui.logToOutput(`S3TreeView: Loaded ${yamlConfig.ShortcutList.length} shortcuts from YAML config`);
					}
				}
			} else {
				ui.logToOutput('S3TreeView: No YAML config found, loading from VSCode state');
			}

			// Load remaining state from VSCode globalState (these are not in YAML)
			let AwsProfileTemp: string | undefined = this.context.globalState.get('AwsProfile');
			if (AwsProfileTemp) {
				this.AwsProfile = AwsProfileTemp;
			}

			let filterStringTemp: string | undefined = this.context.globalState.get('FilterString');
			if (filterStringTemp) {
				this.FilterString = filterStringTemp;
			}

			let ShowOnlyFavoriteTemp: boolean | undefined = this.context.globalState.get('ShowOnlyFavorite');
			if (ShowOnlyFavoriteTemp) { this.isShowOnlyFavorite = ShowOnlyFavoriteTemp; }

			let ShowHiddenNodesTemp: boolean | undefined = this.context.globalState.get('ShowHiddenNodes');
			if (ShowHiddenNodesTemp) { this.isShowHiddenNodes = ShowHiddenNodesTemp; }

			let BucketProfileListTemp: {Bucket: string, Profile: string}[] | undefined = this.context.globalState.get('BucketProfileList');
			if (BucketProfileListTemp) {
				this.treeDataProvider.BucketProfileList = BucketProfileListTemp;
			}

			// Only load from VSCode state if YAML config didn't provide these
			const isConfigEmpty = !yamlConfig || 
				((!yamlConfig.Tree || yamlConfig.Tree.length === 0) && 
				 (!yamlConfig.BucketList || yamlConfig.BucketList.length === 0));

			if (isConfigEmpty) {
				let BucketListTemp:string[] | undefined  = this.context.globalState.get('BucketList');
				if(BucketListTemp)
				{
					this.treeDataProvider.SetBucketList(BucketListTemp);
				}
				
				let ShortcutListTemp: {Bucket: string, Shortcut: string}[] | undefined
				//TODO: Remove this legacy code after 1 year
				try
				{
					let legacyShortcutListTemp:[[string,string]] | undefined
					legacyShortcutListTemp  = this.context.globalState.get('ShortcutList');
					if(legacyShortcutListTemp && Array.isArray(legacyShortcutListTemp) && legacyShortcutListTemp[0] && Array.isArray(legacyShortcutListTemp[0]))
					{
						ShortcutListTemp = [];
						for(let i = 0; i < legacyShortcutListTemp.length; i++)
						{
							ShortcutListTemp.push({Bucket: legacyShortcutListTemp[i][0], Shortcut: legacyShortcutListTemp[i][1]});
						}
					}
				}
				catch {}
				
				if(!ShortcutListTemp)
				{
					ShortcutListTemp  = this.context.globalState.get('ShortcutList');
				}
				
				if(ShortcutListTemp)
				{
					this.treeDataProvider.SetShortcutList(ShortcutListTemp);
				}
			}

			let ViewTypeTemp:number | undefined = this.context.globalState.get('ViewType');
			if(ViewTypeTemp)
			{
				this.treeDataProvider.ViewType = ViewTypeTemp;
			}

			let AwsEndPointTemp: string | undefined = this.context.globalState.get('AwsEndPoint');
			this.AwsEndPoint = AwsEndPointTemp;

			let AwsRegionTemp: string | undefined = this.context.globalState.get('AwsRegion');
			this.AwsRegion = AwsRegionTemp;

			ui.logToOutput("S3TreeView.loadState Successfull");

		} 
		catch (error) 
		{
			ui.logToOutput("S3TreeView.loadState Error !!!");
		}
	}

	async SetFilterMessage(){
		if(this.treeDataProvider.BucketList.length > 0)
		{
			this.view.message = 
			await this.GetFilterProfilePrompt()
			+ this.GetBoolenSign(this.isShowOnlyFavorite) + "Fav, " 
			+ this.GetBoolenSign(this.isShowHiddenNodes) + "Hidden, "
			+ this.FilterString;	
		}
		else
		{
			this.view.message = undefined;
		}
	}

	private async GetFilterProfilePrompt() {
		return "Profile:" + this.AwsProfile + " ";
	}

	GetBoolenSign(variable: boolean){
		return variable ? "✓" : "𐄂";
	}

	async AddResource(parentNode?: S3TreeItem) {
		ui.logToOutput('S3TreeView.AddResource Started');

		// Import resource type options
		const { RESOURCE_TYPE_OPTIONS } = await import('./S3TreeItem');

		// Show resource type selection
		const selectedType = await vscode.window.showQuickPick(
			RESOURCE_TYPE_OPTIONS.map(opt => ({
				label: `$(${opt.icon}) ${opt.label}`,
				description: opt.description,
				type: opt.type
			})),
			{
				placeHolder: 'Select resource type to add'
			}
		);

		if (!selectedType) { return; }

		// Route to appropriate handler based on type
		switch (selectedType.type) {
			case (await import('./S3TreeItem')).TreeItemType.Folder:
				await this.AddFolder(parentNode);
				break;
			case (await import('./S3TreeItem')).TreeItemType.Bucket:
				await this.AddS3Bucket(parentNode);
				break;
			case (await import('./S3TreeItem')).TreeItemType.LambdaFunction:
				await this.AddLambdaFunction(parentNode);
				break;
			case (await import('./S3TreeItem')).TreeItemType.CloudWatchLogGroup:
				await this.AddCloudWatchLogGroup(parentNode);
				break;
			case (await import('./S3TreeItem')).TreeItemType.SNSTopic:
				await this.AddSNSTopic(parentNode);
				break;
			case (await import('./S3TreeItem')).TreeItemType.DynamoDBTable:
				await this.AddDynamoDBTable(parentNode);
				break;
			case (await import('./S3TreeItem')).TreeItemType.SQSQueue:
				await this.AddSQSQueue(parentNode);
				break;
			case (await import('./S3TreeItem')).TreeItemType.StepFunction:
				await this.AddStepFunction(parentNode);
				break;
			case (await import('./S3TreeItem')).TreeItemType.IAMRole:
				await this.AddIAMRole(parentNode);
				break;
		}
	}

	async AddFolder(parentNode?: S3TreeItem) {
		ui.logToOutput('S3TreeView.AddFolder Started');

		const folderName = await vscode.window.showInputBox({ 
			placeHolder: 'Enter folder name',
			prompt: 'Folder name for organizing resources'
		});

		if (!folderName) { return; }

		// Create folder path
		let folderPath = folderName;
		if (parentNode && parentNode.FolderPath) {
			folderPath = `${parentNode.FolderPath}/${folderName}`;
		}

		this.treeDataProvider.AddFolder(folderName, folderPath, parentNode);
		this.SaveState();
		ui.showInfoMessage(`Folder "${folderName}" created`);
	}

	async RenameFolder(node: S3TreeItem) {
		ui.logToOutput('S3TreeView.RenameFolder Started');

		const { TreeItemType } = await import('./S3TreeItem');
		if (node.TreeItemType !== TreeItemType.Folder) { return; }

		const newName = await vscode.window.showInputBox({ 
			placeHolder: 'Enter new folder name',
			value: node.Text
		});

		if (!newName || newName === node.Text) { return; }

		this.treeDataProvider.RenameFolder(node, newName);
		this.SaveState();
		ui.showInfoMessage(`Folder renamed to "${newName}"`);
	}

	async RemoveFolder(node: S3TreeItem) {
		ui.logToOutput('S3TreeView.RemoveFolder Started');

		const { TreeItemType } = await import('./S3TreeItem');
		if (node.TreeItemType !== TreeItemType.Folder) { return; }

		const hasChildren = node.Children && node.Children.length > 0;
		const message = hasChildren 
			? `Delete folder "${node.Text}" and all its contents?`
			: `Delete folder "${node.Text}"?`;

		const confirmed = await vscode.window.showWarningMessage(
			message,
			{ modal: true },
			'Delete'
		);

		if (confirmed !== 'Delete') { return; }

		this.treeDataProvider.RemoveFolder(node);
		this.SaveState();
		ui.showInfoMessage(`Folder "${node.Text}" deleted`);
	}

	// S3 Bucket handler (using new S3API)
	async AddS3Bucket(parentNode?: S3TreeItem) {
		ui.logToOutput('S3TreeView.AddS3Bucket Started');

		let selectedBucketName = await vscode.window.showInputBox({ placeHolder: 'Enter Bucket Name / Search Text' });
		if(selectedBucketName===undefined){ return; }

		// Use new S3API instead of common/api
		var resultBucket = await this.s3Api.getBucketList(selectedBucketName);
		if(!resultBucket.isSuccessful){ return; }

		let selectedBucketList = await vscode.window.showQuickPick(resultBucket.result, {canPickMany:true, placeHolder: 'Select Bucket(s)'});
		if(!selectedBucketList || selectedBucketList.length===0){ return; }

		for(var selectedBucket of selectedBucketList)
		{
			this.treeDataProvider.AddBucket(selectedBucket, parentNode);
			this.SetFilterMessage();
		}
		this.SaveState();
	}

	// Keep old AddBucket for backward compatibility
	async AddBucket(){
		return this.AddS3Bucket();
	}

	// Resource type handlers (stubs for now - can be implemented later)
	async AddLambdaFunction(parentNode?: S3TreeItem) {
		ui.showInfoMessage('Lambda Function support coming soon!');
		// TODO: Implement Lambda function addition
	}

	async AddCloudWatchLogGroup(parentNode?: S3TreeItem) {
		ui.showInfoMessage('CloudWatch Log Group support coming soon!');
		// TODO: Implement CloudWatch log group addition
	}

	async AddSNSTopic(parentNode?: S3TreeItem) {
		ui.showInfoMessage('SNS Topic support coming soon!');
		// TODO: Implement SNS topic addition
	}

	async AddDynamoDBTable(parentNode?: S3TreeItem) {
		ui.showInfoMessage('DynamoDB Table support coming soon!');
		// TODO: Implement DynamoDB table addition
	}

	async AddSQSQueue(parentNode?: S3TreeItem) {
		ui.showInfoMessage('SQS Queue support coming soon!');
		// TODO: Implement SQS queue addition
	}

	async AddStepFunction(parentNode?: S3TreeItem) {
		ui.showInfoMessage('Step Function support coming soon!');
		// TODO: Implement Step Function addition
	}

	async AddIAMRole(parentNode?: S3TreeItem) {
		ui.showInfoMessage('IAM Role support coming soon!');
		// TODO: Implement IAM role addition
	}

	async RemoveBucket(node: S3TreeItem) {
		ui.logToOutput('S3TreeView.RemoveBucket Started');
		
		if(node.TreeItemType !== TreeItemType.Bucket) { return;}
		if(!node.Bucket) { return; }

		this.treeDataProvider.RemoveBucket(node.Bucket);
		this.SetFilterMessage();		
		this.SaveState();
	}

	async Goto(node: S3TreeItem) {
		ui.logToOutput('S3TreeView.Goto Started');
		
		if(node.TreeItemType !== TreeItemType.Bucket) { return;}
		if(!node.Bucket) { return; }

		let shortcut = await vscode.window.showInputBox({ placeHolder: 'Enter a Folder/File Key' });
		if(shortcut===undefined){ return; }
		
		S3Explorer.Render(this.context.extensionUri, node, shortcut);
	}

	async AddOrRemoveShortcut(Bucket:string, Key:string) {
		ui.logToOutput('S3TreeView.AddOrRemoveShortcut Started');
		if(!Bucket || !Key) { return; }
		
		if(this.treeDataProvider.DoesShortcutExists(Bucket, Key))
		{
			this.treeDataProvider.RemoveShortcut(Bucket, Key);
		}
		else
		{
			this.treeDataProvider.AddShortcut(Bucket, Key);
		}
		
		this.SaveState();
	}

	async RemoveShortcutByKey(Bucket:string, Key:string) {
		ui.logToOutput('S3TreeView.RemoveShortcutByKey Started');
		if(!Bucket || !Key) { return; }
		
		if(this.treeDataProvider.DoesShortcutExists(Bucket, Key))
		{
			this.treeDataProvider.RemoveShortcut(Bucket, Key);
			this.SaveState();
		}
	}

	async UpdateShortcutByKey(Bucket:string, Key:string, NewKey:string) {
		ui.logToOutput('S3TreeView.RemoveShortcutByKey Started');
		if(!Bucket || !Key) { return; }
		
		if(this.treeDataProvider.DoesShortcutExists(Bucket, Key))
		{
			this.treeDataProvider.UpdateShortcut(Bucket, Key, NewKey);
			this.SaveState();
		}
	}

	DoesShortcutExists(Bucket:string, Key:string|undefined):boolean {
		if(!Key){return false;}
		return this.treeDataProvider.DoesShortcutExists(Bucket, Key);
	}

	async RemoveShortcut(node: S3TreeItem) {
		ui.logToOutput('S3TreeView.RemoveShortcut Started');
		if(node.TreeItemType !== TreeItemType.Shortcut) { return;}
		if(!node.Bucket || !node.Shortcut) { return; }
		
		this.treeDataProvider.RemoveShortcut(node.Bucket, node.Shortcut);
		S3Explorer.Current?.RenderHtml();//to update shortcut icon
		this.SaveState();
	}

	async CopyShortcut(node: S3TreeItem) {
		ui.logToOutput('S3TreeView.CopyShortcut Started');
		if(node.TreeItemType !== TreeItemType.Shortcut) { return;}
		if(!node.Bucket || !node.Shortcut) { return; }
		
		vscode.env.clipboard.writeText(node.Shortcut)
	}

	async AddShortcut(node: S3TreeItem) {
		ui.logToOutput('S3TreeView.AddShortcut Started');
		if(!node.Bucket) { return; }
		
		let bucket = node.Bucket

		let shortcut = await vscode.window.showInputBox({ placeHolder: 'Enter a Folder/File Key' });
		if(shortcut===undefined){ return; }
		
		this.AddOrRemoveShortcut(bucket, shortcut)
	}

	async ShowS3Explorer(node: S3TreeItem) {
		ui.logToOutput('S3TreeView.ShowS3Explorer Started');
		

		S3Explorer.Render(this.context.extensionUri, node);
	}

	async ShowS3Search(node: S3TreeItem) {
		ui.logToOutput('S3TreeView.ShowS3Search Started');
		

		S3Search.Render(this.context.extensionUri, node);
	}

	async SelectAwsProfile(node: S3TreeItem) {
		ui.logToOutput('S3TreeView.SelectAwsProfile Started');

		var result = await api.GetAwsProfileList();
		if(!result.isSuccessful){ return; }

		let selectedAwsProfile = await vscode.window.showQuickPick(result.result, {canPickMany:false, placeHolder: 'Select Aws Profile'});
		if(!selectedAwsProfile){ return; }

		this.AwsProfile = selectedAwsProfile;
		this.SaveState();
		this.SetFilterMessage();
		this.treeDataProvider.Refresh();
	}

	async UpdateAwsEndPoint() {
		ui.logToOutput('S3TreeView.UpdateAwsEndPoint Started');

		let awsEndPointUrl = await vscode.window.showInputBox({ placeHolder: 'Enter Aws End Point URL (Leave Empty To Return To Default)', value: this.AwsEndPoint });
		if(awsEndPointUrl===undefined){ return; }
		if(awsEndPointUrl.length===0) { this.AwsEndPoint = undefined; }
		else
		{
			this.AwsEndPoint = awsEndPointUrl;
		}
		this.SaveState();
		ui.showInfoMessage('Aws End Point Updated');
	}

	async SetAwsRegion() {
		ui.logToOutput('S3TreeView.UpdateAwsRegion Started');

		let awsRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Aws Region (Leave Empty To Return To Default)' });
		if(awsRegion===undefined){ return; }
		if(awsRegion.length===0) { this.AwsRegion = undefined; }
		else
		{
			this.AwsRegion = awsRegion;
		}
		this.SaveState();
	}

	async ExportToYaml() {
		ui.logToOutput('S3TreeView.ExportToYaml Started');
		
		const treeStructure = this.treeDataProvider.GetTreeStructure();
		
		if (treeStructure.length === 0) {
			ui.showWarningMessage('No resources to export');
			return;
		}
		
		await ConfigManager.exportToConfig(treeStructure);
	}



}
