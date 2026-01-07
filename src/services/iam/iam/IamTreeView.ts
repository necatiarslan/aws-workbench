/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { IamTreeItem, TreeItemType } from './IamTreeItem';
import { IamTreeDataProvider } from './IamTreeDataProvider';
import * as ui from '../common/UI';
import * as api from '../common/API';

export class IamTreeView {

	public static Current: IamTreeView;
	public view: vscode.TreeView<IamTreeItem>;
	public treeDataProvider: IamTreeDataProvider;
	public context: vscode.ExtensionContext;
	public FilterString: string = "";
	public isShowOnlyFavorite: boolean = false;
	public isShowHiddenNodes: boolean = false;
	public AwsProfile: string = "default";	
	public AwsEndPoint: string | undefined;
	public IamRoleList: {Region: string, IamRole: string}[] = [];


	constructor(context: vscode.ExtensionContext) {
		ui.logToOutput('IamTreeView.constructor Started');
		IamTreeView.Current = this;
		this.context = context;
		this.LoadState();
		this.treeDataProvider = new IamTreeDataProvider();
		this.view = vscode.window.createTreeView('IamTreeView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
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
			ui.logToOutput('IamTreeView.TestAwsCredentials Error !!!', response.error);
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
			ui.logToOutput('IamTreeView.TestAwsConnection Error !!!', response.error);
			ui.showErrorMessage('Aws Connection Test Error !!!', response.error);
		}
	}

	BugAndNewFeature() {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/necatiarslan/aws-iam-vscode-extension/issues/new'));
	}
	Donate() {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/sponsors/necatiarslan'));
	}

	Refresh(): void {
		ui.logToOutput('IamTreeView.refresh Started');

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			title: "Aws Iam: Loading...",
		}, (progress, token) => {
			progress.report({ increment: 0 });

			this.LoadTreeItems();

			return new Promise<void>(resolve => { resolve(); });
		});
	}

	LoadTreeItems(){
		ui.logToOutput('IamTreeView.loadTreeItems Started');
		this.treeDataProvider.Refresh();
		this.SetViewTitle();
	}

	ResetView(): void {
		ui.logToOutput('IamTreeView.resetView Started');
		this.FilterString = '';

		this.treeDataProvider.Refresh();
		this.SetViewTitle();

		this.SaveState();
		this.Refresh();
	}

	async AddToFav(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.AddToFav Started');
		node.IsFav = true;
		node.refreshUI();
	}

	async HideNode(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.HideNode Started');
		node.IsHidden = true;

		this.treeDataProvider.Refresh();
	}

	async UnHideNode(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.UnHideNode Started');
		node.IsHidden = false;
	}

	async DeleteFromFav(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.DeleteFromFav Started');
		node.IsFav = false;
		node.refreshUI();
	}

	async Filter() {
		ui.logToOutput('IamTreeView.Filter Started');
		let filterStringTemp = await vscode.window.showInputBox({ value: this.FilterString, placeHolder: 'Enter Your Filter Text' });

		if (filterStringTemp === undefined) { return; }

		this.FilterString = filterStringTemp;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async ShowOnlyFavorite() {
		ui.logToOutput('IamTreeView.ShowOnlyFavorite Started');
		this.isShowOnlyFavorite = !this.isShowOnlyFavorite;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async ShowHiddenNodes() {
		ui.logToOutput('IamTreeView.ShowHiddenNodes Started');
		this.isShowHiddenNodes = !this.isShowHiddenNodes;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async SetViewTitle(){
		this.view.title = "";
	}

	SaveState() {
		ui.logToOutput('IamTreeView.saveState Started');
		try {

			this.context.globalState.update('AwsProfile', this.AwsProfile);
			this.context.globalState.update('FilterString', this.FilterString);
			this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
			this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
			this.context.globalState.update('IamRoleList', this.IamRoleList);
			this.context.globalState.update('AwsEndPoint', this.AwsEndPoint);

			ui.logToOutput("IamTreeView.saveState Successfull");
		} catch (error) {
			ui.logToOutput("IamTreeView.saveState Error !!!");
		}
	}

	LoadState() {
		ui.logToOutput('IamTreeView.loadState Started');
		try {
			let AwsEndPointTemp: string | undefined = this.context.globalState.get('AwsEndPoint');
			if (AwsEndPointTemp) { this.AwsEndPoint = AwsEndPointTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("IamTreeView.loadState AwsEndPoint Error !!!", error);
			ui.showErrorMessage("Aws Iam Load State AwsEndPoint Error !!!", error);
		}

		try {
			let AwsProfileTemp: string | undefined = this.context.globalState.get('AwsProfile');
			if (AwsProfileTemp) { this.AwsProfile = AwsProfileTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("IamTreeView.loadState AwsProfile Error !!!", error);
			ui.showErrorMessage("Aws Iam Load State AwsProfile Error !!!", error);
		}

		try {
			let filterStringTemp: string | undefined = this.context.globalState.get('FilterString');
			if (filterStringTemp) { this.FilterString = filterStringTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("IamTreeView.loadState FilterString Error !!!", error);
			ui.showErrorMessage("Aws Iam Load State FilterString Error !!!", error);
		}

		try {
			let ShowOnlyFavoriteTemp: boolean | undefined = this.context.globalState.get('ShowOnlyFavorite');
			if (ShowOnlyFavoriteTemp) { this.isShowOnlyFavorite = ShowOnlyFavoriteTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("IamTreeView.loadState Error !!!", error);
			ui.showErrorMessage("Aws Iam Load State Error !!!", error);
		}

		try {
			let ShowHiddenNodesTemp: boolean | undefined = this.context.globalState.get('ShowHiddenNodes');
			if (ShowHiddenNodesTemp) { this.isShowHiddenNodes = ShowHiddenNodesTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("IamTreeView.loadState isShowHiddenNodes Error !!!", error);
			ui.showErrorMessage("Aws Iam Load State isShowHiddenNodes Error !!!", error);
		}

		try {
			let IamRoleListTemp:{Region: string, IamRole: string}[] | undefined  = this.context.globalState.get('IamRoleList');
			if(IamRoleListTemp){ this.IamRoleList = IamRoleListTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("IamTreeView.loadState IamRoleList Error !!!", error);
			ui.showErrorMessage("Aws Iam Load State IamRoleList Error !!!", error);
		}

	}

	async SetFilterMessage(){
		if(this.IamRoleList.length > 0)
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

	async AddIamRole(){
		ui.logToOutput('IamTreeView.AddIamRole Started');

		let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
		if(selectedRegion===undefined){ return; }

		let selectedRoleName = await vscode.window.showInputBox({ placeHolder: 'Enter IAM Role Name / Search Text' });
		if(selectedRoleName===undefined){ return; }

		var resultRoles = await api.GetIamRoleList(selectedRegion, selectedRoleName);
		if(!resultRoles.isSuccessful){ return; }

		let selectedRoleList = await vscode.window.showQuickPick(resultRoles.result, {canPickMany:true, placeHolder: 'Select IAM Role(s)'});
		if(!selectedRoleList || selectedRoleList.length===0){ return; }

		for(var selectedRole of selectedRoleList)
		{
			this.treeDataProvider.AddIamRole(selectedRegion, selectedRole);
		}
		this.SaveState();
	}

	async RemoveIamRole(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.RemoveIamRole Started');
		
		if(node.TreeItemType !== TreeItemType.IamRole) { return;}

		this.treeDataProvider.RemoveIamRole(node.Region, node.IamRole);		
		this.SaveState();
	}

	async Goto(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.Goto Started');
		
		if(node.TreeItemType !== TreeItemType.IamRole) { return;}

		ui.showInfoMessage("Work In Progress");
		
	}

	async SelectAwsProfile(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.SelectAwsProfile Started');

		var result = await api.GetAwsProfileList();
		if(!result.isSuccessful){ return; }

		let selectedAwsProfile = await vscode.window.showQuickPick(result.result, {canPickMany:false, placeHolder: 'Select Aws Profile'});
		if(!selectedAwsProfile){ return; }

		this.AwsProfile = selectedAwsProfile;
		this.SaveState();
		this.SetFilterMessage();
	}

	async UpdateAwsEndPoint() {
		ui.logToOutput('IamTreeView.UpdateAwsEndPoint Started');

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

	async PrintIamRole(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.PrintIamRole Started');
		if(node.TreeItemType !== TreeItemType.IamRole) { return;}

		let result = await api.GetIamRole(node.Region, node.IamRole);
		if(!result.isSuccessful)
		{
			ui.logToOutput("api.GetIamRole Error !!!", result.error);
			ui.showErrorMessage('Get IAM Role Error !!!', result.error);
			return;
		}
		let jsonString = JSON.stringify(result.result, null, 2);
		ui.ShowTextDocument(jsonString, "json");

	}

	private SetNodeRunning(node: IamTreeItem, isRunning: boolean) {
		node.IsRunning = isRunning; node.refreshUI(); this.treeDataProvider.Refresh();
	}

	async LoadPermissions(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.LoadPermissions Started');
		if(node.TreeItemType !== TreeItemType.PermissionsGroup) { return;}
		if(node.IsRunning) { return; }
		
		this.SetNodeRunning(node, true);
		let result = await api.GetIamRolePolicies(node.Region, node.IamRole);
		
		if(!result.isSuccessful) {
			ui.logToOutput("api.GetIamRolePolicies Error !!!", result.error);
			ui.showErrorMessage('Get IAM Role Policies Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}

		// Clear existing children
		node.Children = [];
		
		// Add policies as children
		if(result.result && result.result.AttachedPolicies) {
			for(let policy of result.result.AttachedPolicies) {
				let policyNode = new IamTreeItem(policy.PolicyName || 'Unknown Policy', TreeItemType.Permission);
				policyNode.IamRole = node.IamRole;
				policyNode.Region = node.Region;
				policyNode.PolicyName = policy.PolicyName;
				policyNode.PolicyArn = policy.PolicyArn;
				policyNode.Parent = node;
				node.Children.push(policyNode);
			}
		}

		if(node.Children.length > 0) {
			node.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
		} else {
			node.collapsibleState = vscode.TreeItemCollapsibleState.None;
		}

		this.SetNodeRunning(node, false);
		this.treeDataProvider.Refresh();
	}

	async LoadTrustRelationships(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.LoadTrustRelationships Started');
		if(node.TreeItemType !== TreeItemType.TrustRelationshipsGroup) { return;}
		if(node.IsRunning) { return; }
		
		this.SetNodeRunning(node, true);
		let result = await api.GetIamRoleTrustPolicy(node.Region, node.IamRole);
		
		if(!result.isSuccessful) {
			ui.logToOutput("api.GetIamRoleTrustPolicy Error !!!", result.error);
			ui.showErrorMessage('Get IAM Role Trust Policy Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}

		// Clear existing children
		node.Children = [];
		
		// Add trust relationships as children
		if(result.result && result.result.Statement) {
			for(let statement of result.result.Statement) {
				if(statement.Principal && statement.Principal.Service) {
					const services = Array.isArray(statement.Principal.Service) 
						? statement.Principal.Service 
						: [statement.Principal.Service];
					
					for(let service of services) {
						let trustNode = new IamTreeItem(`Service: ${service}`, TreeItemType.TrustRelationship);
						trustNode.IamRole = node.IamRole;
						trustNode.Region = node.Region;
						trustNode.TrustEntity = service;
						trustNode.Parent = node;
						node.Children.push(trustNode);
					}
				}
			}
		}

		if(node.Children.length > 0) {
			node.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
		} else {
			node.collapsibleState = vscode.TreeItemCollapsibleState.None;
		}

		this.SetNodeRunning(node, false);
		this.treeDataProvider.Refresh();
	}

	async LoadTags(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.LoadTags Started');
		if(node.TreeItemType !== TreeItemType.TagsGroup) { return;}
		if(node.IsRunning) { return; }
		
		this.SetNodeRunning(node, true);
		
		// Get IAM role tags
		let result = await api.GetIamRoleTags(node.Region, node.IamRole);
		
		if(!result.isSuccessful) {
			ui.logToOutput("api.GetIamRoleTags Error !!!", result.error);
			ui.showErrorMessage('Get IAM Role Tags Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}

		// Clear existing children
		node.Children = [];
		
		// Add tags as children
		if(result.result && result.result.Tags) {
			for(let tag of result.result.Tags) {
				let tagNode = new IamTreeItem(`${tag.Key} = ${tag.Value}`, TreeItemType.Tag);
				tagNode.IamRole = node.IamRole;
				tagNode.Region = node.Region;
				tagNode.TagKey = tag.Key;
				tagNode.TagValue = tag.Value;
				tagNode.Parent = node;
				node.Children.push(tagNode);
			}
		}

		if(node.Children.length > 0) {
			node.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
		} else {
			node.collapsibleState = vscode.TreeItemCollapsibleState.None;
		}

		this.SetNodeRunning(node, false);
		this.treeDataProvider.Refresh();
	}

	async LoadInfo(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.LoadInfo Started');
		if(node.TreeItemType !== TreeItemType.InfoGroup) { return;}
		if(node.IsRunning) { return; }
		
		this.SetNodeRunning(node, true);
		let result = await api.GetIamRole(node.Region, node.IamRole);
		
		if(!result.isSuccessful) {
			ui.logToOutput("api.GetIamRole Error !!!", result.error);
			ui.showErrorMessage('Get IAM Role Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}

		// Clear existing children
		node.Children = [];
		
		// Add info items as children
		const role = result.result.Role;
		if(role) {
			const infoItems = [
				{ key: 'RoleName', value: role.RoleName || 'N/A' },
				{ key: 'RoleId', value: role.RoleId || 'N/A' },
				{ key: 'Arn', value: role.Arn || 'N/A' },
				{ key: 'CreateDate', value: role.CreateDate?.toString() || 'N/A' },
				{ key: 'Path', value: role.Path || 'N/A' },
				{ key: 'MaxSessionDuration', value: role.MaxSessionDuration?.toString() || 'N/A' },
				{ key: 'Description', value: role.Description || 'N/A' }
			];

			for(let item of infoItems) {
				let infoNode = new IamTreeItem(`${item.key}: ${item.value}`, TreeItemType.InfoItem);
				infoNode.IamRole = node.IamRole;
				infoNode.Region = node.Region;
				infoNode.InfoKey = item.key;
				infoNode.InfoValue = item.value;
				infoNode.Parent = node;
				node.Children.push(infoNode);
			}
		}

		if(node.Children.length > 0) {
			node.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
		}

		this.SetNodeRunning(node, false);
		this.treeDataProvider.Refresh();
	}

	async AddTag(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.AddTag Started');
		if(node.TreeItemType !== TreeItemType.TagsGroup) { return;}
		
		let tagKey = await vscode.window.showInputBox({ 
			placeHolder: 'Enter Tag Key (e.g., Environment)' 
		});

		if(!tagKey) { return; }

		let tagValue = await vscode.window.showInputBox({ 
			placeHolder: 'Enter Tag Value (e.g., Production)' 
		});

		if(tagValue === undefined) { return; }

		this.SetNodeRunning(node, true);
		let result = await api.AddIamRoleTag(
			node.Region, 
			node.IamRole, 
			tagKey, 
			tagValue
		);

		if(!result.isSuccessful) {
			ui.logToOutput("api.AddIamRoleTag Error !!!", result.error);
			ui.showErrorMessage('Add IAM Role Tag Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}

		ui.showInfoMessage('Tag Added Successfully');
		
		// Reset running state before calling Load
		this.SetNodeRunning(node, false);
		
		// Refresh tags
		await this.LoadTags(node);
	}

	async UpdateTag(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.UpdateTag Started');
		if(node.TreeItemType !== TreeItemType.Tag) { return;}
		
		let newValue = await vscode.window.showInputBox({ 
			value: node.TagValue, 
			placeHolder: 'Enter New Value for ' + node.TagKey 
		});

		if(newValue === undefined) { return; }

		if(!node.TagKey) { return; }

		this.SetNodeRunning(node, true);
		let result = await api.UpdateIamRoleTag(
			node.Region, 
			node.IamRole, 
			node.TagKey, 
			newValue
		);

		if(!result.isSuccessful) {
			ui.logToOutput("api.UpdateIamRoleTag Error !!!", result.error);
			ui.showErrorMessage('Update Tag Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}

		ui.showInfoMessage('Tag Updated Successfully');
		
		// Refresh the parent node to show updated values
		if(node.Parent) {
			await this.LoadTags(node.Parent);
		}
		
		this.SetNodeRunning(node, false);
	}

	async RemoveTag(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.RemoveTag Started');
		if(node.TreeItemType !== TreeItemType.Tag) { return;}
		
		if(!node.TagKey) { return; }

		const confirm = await vscode.window.showWarningMessage(
			`Are you sure you want to remove tag "${node.TagKey}"?`,
			{ modal: true },
			'Yes', 'No'
		);

		if(confirm !== 'Yes') { return; }

		this.SetNodeRunning(node, true);
		let result = await api.RemoveIamRoleTag(
			node.Region, 
			node.IamRole, 
			node.TagKey
		);

		if(!result.isSuccessful) {
			ui.logToOutput("api.RemoveIamRoleTag Error !!!", result.error);
			ui.showErrorMessage('Remove Tag Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}

		ui.showInfoMessage('Tag Removed Successfully');
		
		// Refresh the parent node
		if(node.Parent) {
			this.SetNodeRunning(node, false);
			await this.LoadTags(node.Parent);
		}
	}

	async ViewPolicy(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.ViewPolicy Started');
		if(node.TreeItemType !== TreeItemType.Permission) { return;}
		
		if(!node.PolicyArn) { 
			ui.showWarningMessage('Policy ARN not found');
			return;
		}

		this.SetNodeRunning(node, true);
		let result = await api.GetPolicyDocument(node.Region, node.PolicyArn);
		
		if(!result.isSuccessful) {
			ui.logToOutput("api.GetPolicyDocument Error !!!", result.error);
			ui.showErrorMessage('Get Policy Document Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}

		// Display the policy document as formatted JSON
		const jsonString = JSON.stringify(result.result, null, 2);
		ui.ShowTextDocument(jsonString, "json");
		
		this.SetNodeRunning(node, false);
	}

	async DownloadPolicy(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.DownloadPolicy Started');
		if(node.TreeItemType !== TreeItemType.Permission) { return;}
		
		if(!node.PolicyArn || !node.PolicyName) { 
			ui.showWarningMessage('Policy information not found');
			return;
		}

		this.SetNodeRunning(node, true);
		let result = await api.GetPolicyDocument(node.Region, node.PolicyArn);
		
		if(!result.isSuccessful) {
			ui.logToOutput("api.GetPolicyDocument Error !!!", result.error);
			ui.showErrorMessage('Get Policy Document Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}

		// Ask user where to save the file
		const saveOptions: vscode.SaveDialogOptions = {
			defaultUri: vscode.Uri.file(`${node.PolicyName}.json`),
			filters: {
				'JSON files': ['json'],
				'All files': ['*']
			}
		};

		const fileUri = await vscode.window.showSaveDialog(saveOptions);
		
		if(!fileUri) {
			this.SetNodeRunning(node, false);
			return;
		}

		// Save the policy document to file
		const jsonString = JSON.stringify(result.result, null, 2);
		const fs = require('fs');
		
		try {
			fs.writeFileSync(fileUri.fsPath, jsonString, 'utf8');
			ui.showInfoMessage(`Policy saved to ${fileUri.fsPath}`);
			ui.logToOutput(`Policy saved to ${fileUri.fsPath}`);
		} catch (error: any) {
			ui.showErrorMessage('Failed to save policy file', error);
			ui.logToOutput('Failed to save policy file', error);
		}
		
		this.SetNodeRunning(node, false);
	}

	async ViewTrustRelationship(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.ViewTrustRelationship Started');
		if(node.TreeItemType !== TreeItemType.TrustRelationship) { return;}
		
		if(!node.Parent || !node.Parent.IamRole) { 
			ui.showWarningMessage('IAM Role information not found');
			return;
		}

		this.SetNodeRunning(node, true);
		let result = await api.GetIamRoleTrustPolicy(node.Region, node.Parent.IamRole);
		
		if(!result.isSuccessful) {
			ui.logToOutput("api.GetIamRoleTrustPolicy Error !!!", result.error);
			ui.showErrorMessage('Get Trust Policy Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}

		// Display the trust policy document as formatted JSON
		const jsonString = JSON.stringify(result.result, null, 2);
		ui.ShowTextDocument(jsonString, "json");
		
		this.SetNodeRunning(node, false);
	}

	async DownloadTrustRelationship(node: IamTreeItem) {
		ui.logToOutput('IamTreeView.DownloadTrustRelationship Started');
		if(node.TreeItemType !== TreeItemType.TrustRelationship) { return;}
		
		if(!node.Parent || !node.Parent.IamRole) { 
			ui.showWarningMessage('IAM Role information not found');
			return;
		}

		this.SetNodeRunning(node, true);
		let result = await api.GetIamRoleTrustPolicy(node.Region, node.Parent.IamRole);
		
		if(!result.isSuccessful) {
			ui.logToOutput("api.GetIamRoleTrustPolicy Error !!!", result.error);
			ui.showErrorMessage('Get Trust Policy Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}

		// Ask user where to save the file
		const saveOptions: vscode.SaveDialogOptions = {
			defaultUri: vscode.Uri.file(`${node.Parent.IamRole}-trust-policy.json`),
			filters: {
				'JSON files': ['json'],
				'All files': ['*']
			}
		};

		const fileUri = await vscode.window.showSaveDialog(saveOptions);
		
		if(!fileUri) {
			this.SetNodeRunning(node, false);
			return;
		}

		// Save the trust policy document to file
		const jsonString = JSON.stringify(result.result, null, 2);
		const fs = require('fs');
		
		try {
			fs.writeFileSync(fileUri.fsPath, jsonString, 'utf8');
			ui.showInfoMessage(`Trust policy saved to ${fileUri.fsPath}`);
			ui.logToOutput(`Trust policy saved to ${fileUri.fsPath}`);
		} catch (error: any) {
			ui.showErrorMessage('Failed to save trust policy file', error);
			ui.logToOutput('Failed to save trust policy file', error);
		}
		
		this.SetNodeRunning(node, false);
	}
}
