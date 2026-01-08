import * as vscode from 'vscode';
import { IService } from '../IService';
import { WorkbenchTreeItem } from '../../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../../tree/WorkbenchTreeProvider';
import * as ui from '../../common/UI';
import * as StatusBar from './StatusBarItem';

export class AccessService implements IService {
    public static Instance: AccessService;
    public serviceId = 'access';
    public context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        AccessService.Instance = this;
        this.context = context;
        
        // Initialize Status Bar
        ui.logToOutput('Aws Access Service is now active!');
        new StatusBar.StatusBarItem(context);
    }

    registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider, treeView: vscode.TreeView<WorkbenchTreeItem>): void {
        context.subscriptions.push(
            vscode.commands.registerCommand('aws-workbench.access.RefreshCredentials', () => {
                StatusBar.StatusBarItem.Current.GetCredentials();
            }),
            vscode.commands.registerCommand('aws-workbench.access.SetAwsLoginCommand', () => {
                StatusBar.StatusBarItem.Current.SetAwsLoginCommand();
            }),
            vscode.commands.registerCommand('aws-workbench.access.ListAwsProfiles', () => {
                StatusBar.StatusBarItem.Current.ListAwsProfiles();
            }),
            vscode.commands.registerCommand('aws-workbench.access.RunLoginCommand', () => {
                StatusBar.StatusBarItem.Current.RunLoginCommand();
            }),
            vscode.commands.registerCommand('aws-workbench.access.PauseAutoLogin', () => {
                StatusBar.StatusBarItem.Current.PauseAutoLogin();
            }),
            vscode.commands.registerCommand('aws-workbench.access.SetActiveProfile', () => {
                StatusBar.StatusBarItem.Current.SetActiveProfile();
            }),
            vscode.commands.registerCommand('aws-workbench.access.ShowActiveCredentials', () => {
                StatusBar.StatusBarItem.Current.ShowActiveCredentials();
            }),
            vscode.commands.registerCommand('aws-workbench.access.ShowDefaultCredentials', () => {
                StatusBar.StatusBarItem.Current.ShowDefaultCredentials();
            }),
            vscode.commands.registerCommand('aws-workbench.access.OpenCredentialsFile', () => {
                StatusBar.StatusBarItem.Current.OpenCredentialsFile();
            }),
            vscode.commands.registerCommand('aws-workbench.access.OpenConfigFile', () => {
                StatusBar.StatusBarItem.Current.OpenConfigFile();
            }),
            vscode.commands.registerCommand('aws-workbench.access.TestAwsConnectivity', () => {
                StatusBar.StatusBarItem.Current.TestAwsConnectivity();
            }),
            vscode.commands.registerCommand('aws-workbench.access.CopyCredentialsToDefaultProfile', () => {
                StatusBar.StatusBarItem.Current.CopyCredentialsToDefaultProfile();
            })
        );
        
        vscode.window.onDidCloseTerminal((terminal) => {
            if (StatusBar.StatusBarItem.Current) {
                StatusBar.StatusBarItem.Current.onDidCloseTerminal(terminal);
            }
        });
    }

    async getRootNodes(): Promise<WorkbenchTreeItem[]> {
        return [];
    }

    async getChildren(element?: WorkbenchTreeItem): Promise<WorkbenchTreeItem[]> {
        return [];
    }

    getTreeItem(element: WorkbenchTreeItem): vscode.TreeItem | Promise<vscode.TreeItem> {
        return element.itemData as vscode.TreeItem || element;
    }

    async addResource(): Promise<WorkbenchTreeItem | undefined> {
        return undefined;
    }
}
