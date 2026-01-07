/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { SnsTreeItem, TreeItemType } from './SnsTreeItem';
import { SnsTreeDataProvider } from './SnsTreeDataProvider';
import * as ui from '../common/UI';
import * as api from '../common/API';

export class SnsTreeView {

	public static Current: SnsTreeView;
	public view: vscode.TreeView<SnsTreeItem>;
	public treeDataProvider: SnsTreeDataProvider;
	public context: vscode.ExtensionContext;
	public FilterString: string = "";
	public isShowOnlyFavorite: boolean = false;
	public isShowHiddenNodes: boolean = false;
	public AwsProfile: string = "default";	
	public AwsEndPoint: string | undefined;
	public TopicList: {Region: string, TopicArn: string}[] = [];
	public MessageFilePathList: {Region: string, TopicArn: string, MessageFilePath: string}[] = [];


	constructor(context: vscode.ExtensionContext) {
		ui.logToOutput('TreeView.constructor Started');
		SnsTreeView.Current = this;
		this.context = context;
		this.LoadState();
		this.treeDataProvider = new SnsTreeDataProvider();
		this.view = vscode.window.createTreeView('SnsTreeView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
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
			ui.logToOutput('SnsTreeView.TestAwsCredentials Error !!!', response.error);
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
			ui.logToOutput('SnsTreeView.TestAwsConnection Error !!!', response.error);
			ui.showErrorMessage('Aws Connection Test Error !!!', response.error);
		}
	}

	BugAndNewFeature() {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/necatiarslan/aws-sns-vscode-extension/issues/new'));
	}
	Donate() {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/sponsors/necatiarslan'));
	}

	Refresh(): void {
		ui.logToOutput('SnsTreeView.refresh Started');

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			title: "Aws Sns: Loading...",
		}, (progress, token) => {
			progress.report({ increment: 0 });

			this.LoadTreeItems();

			return new Promise<void>(resolve => { resolve(); });
		});
	}

	LoadTreeItems(){
		ui.logToOutput('SnsTreeView.loadTreeItems Started');
		this.treeDataProvider.Refresh();
		this.SetViewTitle();
	}

	ResetView(): void {
		ui.logToOutput('SnsTreeView.resetView Started');
		this.FilterString = '';

		this.treeDataProvider.Refresh();
		this.SetViewTitle();

		this.SaveState();
		this.Refresh();
	}

	async AddToFav(node: SnsTreeItem) {
		ui.logToOutput('SnsTreeView.AddToFav Started');
		node.IsFav = true;
		node.refreshUI();
	}

	async HideNode(node: SnsTreeItem) {
		ui.logToOutput('SnsTreeView.HideNode Started');
		node.IsHidden = true;

		this.treeDataProvider.Refresh();
	}

	async UnHideNode(node: SnsTreeItem) {
		ui.logToOutput('SnsTreeView.UnHideNode Started');
		node.IsHidden = false;
	}

	async DeleteFromFav(node: SnsTreeItem) {
		ui.logToOutput('SnsTreeView.DeleteFromFav Started');
		node.IsFav = false;
		node.refreshUI();
	}

	async Filter() {
		ui.logToOutput('SnsTreeView.Filter Started');
		let filterStringTemp = await vscode.window.showInputBox({ value: this.FilterString, placeHolder: 'Enter Your Filter Text' });

		if (filterStringTemp === undefined) { return; }

		this.FilterString = filterStringTemp;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async ShowOnlyFavorite() {
		ui.logToOutput('SnsTreeView.ShowOnlyFavorite Started');
		this.isShowOnlyFavorite = !this.isShowOnlyFavorite;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async ShowHiddenNodes() {
		ui.logToOutput('SnsTreeView.ShowHiddenNodes Started');
		this.isShowHiddenNodes = !this.isShowHiddenNodes;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async SetViewTitle(){
		this.view.title = "Aws Sns";
	}

	SaveState() {
		ui.logToOutput('SnsTreeView.saveState Started');
		try {

			this.context.globalState.update('AwsProfile', this.AwsProfile);
			this.context.globalState.update('FilterString', this.FilterString);
			this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
			this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
			this.context.globalState.update('TopicList', this.TopicList);
			this.context.globalState.update('MessageFilePathList', this.MessageFilePathList);
			this.context.globalState.update('AwsEndPoint', this.AwsEndPoint);

			ui.logToOutput("SnsTreeView.saveState Successfull");
		} catch (error) {
			ui.logToOutput("SnsTreeView.saveState Error !!!");
		}
	}

	LoadState() {
		ui.logToOutput('SnsTreeView.loadState Started');
		try {
			let AwsEndPointTemp: string | undefined = this.context.globalState.get('AwsEndPoint');
			if (AwsEndPointTemp) { this.AwsEndPoint = AwsEndPointTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("SnsTreeView.loadState AwsEndPoint Error !!!", error);
			ui.showErrorMessage("Aws Sns Load State AwsEndPoint Error !!!", error);
		}

		try {
			let AwsProfileTemp: string | undefined = this.context.globalState.get('AwsProfile');
			if (AwsProfileTemp) { this.AwsProfile = AwsProfileTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("SnsTreeView.loadState AwsProfile Error !!!", error);
			ui.showErrorMessage("Aws Sns Load State AwsProfile Error !!!", error);
		}

		try {
			let filterStringTemp: string | undefined = this.context.globalState.get('FilterString');
			if (filterStringTemp) { this.FilterString = filterStringTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("SnsTreeView.loadState FilterString Error !!!", error);
			ui.showErrorMessage("Aws Sns Load State FilterString Error !!!", error);
		}

		try {
			let ShowOnlyFavoriteTemp: boolean | undefined = this.context.globalState.get('ShowOnlyFavorite');
			if (ShowOnlyFavoriteTemp) { this.isShowOnlyFavorite = ShowOnlyFavoriteTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("SnsTreeView.loadState Error !!!", error);
			ui.showErrorMessage("Aws Sns Load State Error !!!", error);
		}

		try {
			let ShowHiddenNodesTemp: boolean | undefined = this.context.globalState.get('ShowHiddenNodes');
			if (ShowHiddenNodesTemp) { this.isShowHiddenNodes = ShowHiddenNodesTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("SnsTreeView.loadState isShowHiddenNodes Error !!!", error);
			ui.showErrorMessage("Aws Sns Load State isShowHiddenNodes Error !!!", error);
		}

		try {
			let TopicListTemp:{Region: string, TopicArn: string}[] | undefined  = this.context.globalState.get('TopicList');
			if(TopicListTemp){ this.TopicList = TopicListTemp; }

			let MessageFilePathListTemp:{Region: string, TopicArn: string, MessageFilePath: string}[] | undefined  = this.context.globalState.get('MessageFilePathList');
			if(MessageFilePathListTemp){ this.MessageFilePathList = MessageFilePathListTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("SnsTreeView.loadState SnsList Error !!!", error);
			ui.showErrorMessage("Aws Sns Load State SnsList Error !!!", error);
		}

	}

	async SetFilterMessage(){
		if(this.TopicList.length > 0)
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

	async AddTopic(){
		ui.logToOutput('SnsTreeView.AddTopic Started');

		let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
		if(selectedRegion===undefined){ return; }

		let selectedTopicName = await vscode.window.showInputBox({ placeHolder: 'Enter Topic Name / Search Text' });
		if(selectedTopicName===undefined){ return; }

		var resultTopic = await api.GetSnsTopicList(selectedRegion, selectedTopicName);
		if(!resultTopic.isSuccessful){ return; }

		let selectedTopicList = await vscode.window.showQuickPick(resultTopic.result, {canPickMany:true, placeHolder: 'Select Topic(s)'});
		if(!selectedTopicList || selectedTopicList.length===0){ return; }

		for(var selectedTopic of selectedTopicList)
		{
			this.treeDataProvider.AddTopic(selectedRegion, selectedTopic);
		}
		this.SaveState();
	}

	async RemoveTopic(node: SnsTreeItem) {
		ui.logToOutput('SnsTreeView.RemoveTopic Started');
		
		if(node.TreeItemType !== TreeItemType.Topic) { return;}

		this.treeDataProvider.RemoveTopic(node.Region, node.TopicArn);		
		this.SaveState();
	}

	async Goto(node: SnsTreeItem) {
		ui.logToOutput('SnsTreeView.Goto Started');
		
		if(node.TreeItemType !== TreeItemType.Topic) { return;}

		ui.showInfoMessage("Work In Progress");
		
	}

	async SnsView(node: SnsTreeItem) {
		ui.logToOutput('SnsTreeView.SnsView Started');
		if(node.TreeItemType !== TreeItemType.Topic) { return;}

		ui.showInfoMessage('Work In Progress');
	}

	async PublishMessage(node: SnsTreeItem) {
		ui.logToOutput('SnsTreeView.PublishMessage Started');
		if(node.IsRunning) { return;}
		this.SetNodeRunning(node, true);
		let message: string = "";

		if(node.TreeItemType === TreeItemType.PublishFile)
		{
			if(!node.MessageFilePath) {
				ui.showWarningMessage('Message Path is not set');
				this.SetNodeRunning(node, false);
				return; 
			}

			let file = await vscode.workspace.openTextDocument(node.MessageFilePath);
			if(file===undefined){ 
				ui.showWarningMessage('File not found: ' + node.MessageFilePath);
				this.SetNodeRunning(node, false);
				return; 
			}
			message = file.getText()
		}
		else
		{
			let input = await vscode.window.showInputBox({ placeHolder: 'Enter Message' });
			if(input===undefined){ this.SetNodeRunning(node, false);return; }
			if(input===""){ this.SetNodeRunning(node, false);return; }

			message = input;
		}
		
		let result = await api.PublishMessage(node.Region, node.TopicArn, message);
		if(!result.isSuccessful)
		{
			ui.logToOutput("api.PublishMessage Error !!!", result.error);
			ui.showErrorMessage('Publish Message Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}
		ui.logToOutput("api.PublishMessage Success !!!");
		ui.logToOutput("MessageId: " + result.result.MessageId);

		ui.showInfoMessage('Message Published Successfully. MessageId: ' + result.result.MessageId);
		this.SetNodeRunning(node, false);
	}

	private SetNodeRunning(node: SnsTreeItem, isRunning: boolean) {
		node.IsRunning = isRunning; node.refreshUI(); this.treeDataProvider.Refresh();
	}

	async GetSubscriptions(node: SnsTreeItem) {
		ui.logToOutput('SnsTreeView.GetSubscriptions Started');
		if(node.IsRunning) { return;}
		this.SetNodeRunning(node, true);
		let result = await api.GetSubscriptions(node.Region, node.TopicArn);
		if(!result.isSuccessful)
		{
			ui.logToOutput("api.GetSubscriptions Error !!!", result.error);
			ui.showErrorMessage('Get Subscriptions Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}
		ui.logToOutput("api.GetSubscriptions Success !!!");
		ui.logToOutput("Subscriptions: " + JSON.stringify(result.result));

		this.treeDataProvider.AddSubscriptions(node, result.result);
		this.SetNodeRunning(node, false);
	}

	async SelectAwsProfile(node: SnsTreeItem) {
		ui.logToOutput('SnsTreeView.SelectAwsProfile Started');

		var result = await api.GetAwsProfileList();
		if(!result.isSuccessful){ return; }

		let selectedAwsProfile = await vscode.window.showQuickPick(result.result, {canPickMany:false, placeHolder: 'Select Aws Profile'});
		if(!selectedAwsProfile){ return; }

		this.AwsProfile = selectedAwsProfile;
		this.SaveState();
		this.SetFilterMessage();
	}

	async UpdateAwsEndPoint() {
		ui.logToOutput('SnsTreeView.UpdateAwsEndPoint Started');

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

	async PrintTopic(node: SnsTreeItem) {
		ui.logToOutput('SnsTreeView.PrintTopic Started');
		ui.showInfoMessage('Work In Progress');

	}

	async RemoveMessageFilePath(node: SnsTreeItem) {
		ui.logToOutput('SnsTreeView.RemoveMessageFilePath Started');
		if(node.TreeItemType !== TreeItemType.PublishFile) { return;}

		this.treeDataProvider.RemoveMessageFilePath(node);
		this.SaveState();
		ui.showInfoMessage('Message Path Removed Successfully');
	}

	async AddMessageFilePath(node: SnsTreeItem) {
		ui.logToOutput('SnsTreeView.AddMessageFilePath Started');
		if(node.TreeItemType !== TreeItemType.PublishGroup) { return;}

		const selectedPath = await vscode.window.showOpenDialog({
			canSelectMany: false,
			openLabel: 'Select',
			canSelectFiles: true
		});
		
		if(!selectedPath || selectedPath.length===0){ return; }

		this.treeDataProvider.AddMessageFilePath(node, selectedPath[0].path);
		this.SaveState();
		ui.showInfoMessage('Message Path Added Successfully');
	}

}
