"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessService = void 0;
const vscode = require("vscode");
const ui = require("../../common/UI");
const StatusBar = require("./StatusBarItem");
class AccessService {
    static Instance;
    serviceId = 'access';
    context;
    constructor(context) {
        AccessService.Instance = this;
        this.context = context;
        // Initialize Status Bar
        ui.logToOutput('Aws Access Service is now active!');
        new StatusBar.StatusBarItem(context);
    }
    registerCommands(context, treeProvider, treeView) {
        context.subscriptions.push(vscode.commands.registerCommand('aws-workbench.access.RefreshCredentials', () => {
            StatusBar.StatusBarItem.Current.GetCredentials();
        }), vscode.commands.registerCommand('aws-workbench.access.SetAwsLoginCommand', () => {
            StatusBar.StatusBarItem.Current.SetAwsLoginCommand();
        }), vscode.commands.registerCommand('aws-workbench.access.ListAwsProfiles', () => {
            StatusBar.StatusBarItem.Current.ListAwsProfiles();
        }), vscode.commands.registerCommand('aws-workbench.access.RunLoginCommand', () => {
            StatusBar.StatusBarItem.Current.RunLoginCommand();
        }), vscode.commands.registerCommand('aws-workbench.access.PauseAutoLogin', () => {
            StatusBar.StatusBarItem.Current.PauseAutoLogin();
        }), vscode.commands.registerCommand('aws-workbench.access.SetActiveProfile', () => {
            StatusBar.StatusBarItem.Current.SetActiveProfile();
        }), vscode.commands.registerCommand('aws-workbench.access.ShowActiveCredentials', () => {
            StatusBar.StatusBarItem.Current.ShowActiveCredentials();
        }), vscode.commands.registerCommand('aws-workbench.access.ShowDefaultCredentials', () => {
            StatusBar.StatusBarItem.Current.ShowDefaultCredentials();
        }), vscode.commands.registerCommand('aws-workbench.access.OpenCredentialsFile', () => {
            StatusBar.StatusBarItem.Current.OpenCredentialsFile();
        }), vscode.commands.registerCommand('aws-workbench.access.OpenConfigFile', () => {
            StatusBar.StatusBarItem.Current.OpenConfigFile();
        }), vscode.commands.registerCommand('aws-workbench.access.TestAwsConnectivity', () => {
            StatusBar.StatusBarItem.Current.TestAwsConnectivity();
        }), vscode.commands.registerCommand('aws-workbench.access.CopyCredentialsToDefaultProfile', () => {
            StatusBar.StatusBarItem.Current.CopyCredentialsToDefaultProfile();
        }));
        vscode.window.onDidCloseTerminal((terminal) => {
            if (StatusBar.StatusBarItem.Current) {
                StatusBar.StatusBarItem.Current.onDidCloseTerminal(terminal);
            }
        });
    }
    async getRootNodes() {
        return [];
    }
    async getChildren(element) {
        return [];
    }
    getTreeItem(element) {
        return element.itemData || element;
    }
    async addResource() {
        return undefined;
    }
}
exports.AccessService = AccessService;
//# sourceMappingURL=AccessService.js.map