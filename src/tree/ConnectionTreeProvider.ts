import * as vscode from 'vscode';
import { Session } from '../common/Session';

export class ConnectionTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    public Refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    public getTreeItem(node: vscode.TreeItem): vscode.TreeItem {
        return node;
    }

    public getChildren(node?: vscode.TreeItem): vscode.TreeItem[] {
        if (node) {
            return [];
        }

        const activeProfileNode = new vscode.TreeItem(`Active Profile: ${Session.Current.AwsProfile}`, vscode.TreeItemCollapsibleState.None);
        activeProfileNode.contextValue = 'ConnectionActiveProfileNode';
        activeProfileNode.iconPath = new vscode.ThemeIcon('account');
        activeProfileNode.command = {
            command: 'AwsWorkbench.ConnectionChangeProfile',
            title: 'Change Profile'
        };

        var expirationLabel = Session.Current.HasExpiration ? `Expire In: ${Session.Current.ExpireTime}` : 'No Expiration';
        const expirationTimeNode = new vscode.TreeItem(expirationLabel, vscode.TreeItemCollapsibleState.None);
        expirationTimeNode.contextValue = 'ConnectionExpirationTimeNode';
        expirationTimeNode.iconPath = new vscode.ThemeIcon('history');
        expirationTimeNode.command = {
            command: 'AwsWorkbench.ConnectionRefreshView',
            title: 'Refresh'
        };

        const refreshCredentialsNode = new vscode.TreeItem('Refresh Credentials', vscode.TreeItemCollapsibleState.None);
        refreshCredentialsNode.contextValue = 'ConnectionRefreshCredentialsNode';
        refreshCredentialsNode.iconPath = new vscode.ThemeIcon('refresh');
        refreshCredentialsNode.command = {
            command: 'AwsWorkbench.ConnectionRefreshCredentials',
            title: 'Refresh Credentials'
        };

        const testConnectionNode = new vscode.TreeItem('Test Aws Connection', vscode.TreeItemCollapsibleState.None);
        testConnectionNode.contextValue = 'ConnectionTestAwsNode';
        testConnectionNode.iconPath = new vscode.ThemeIcon('plug');
        testConnectionNode.command = {
            command: 'AwsWorkbench.ConnectionTestAwsConnection',
            title: 'Test Aws Connection'
        };

        const changeProfileNode = new vscode.TreeItem('Change Profile', vscode.TreeItemCollapsibleState.None);
        changeProfileNode.contextValue = 'ConnectionChangeProfileNode';
        changeProfileNode.iconPath = new vscode.ThemeIcon('settings-gear');
        changeProfileNode.command = {
            command: 'AwsWorkbench.ConnectionChangeProfile',
            title: 'Change Profile'
        };

        return [
            activeProfileNode,
            expirationTimeNode,
            refreshCredentialsNode,
            testConnectionNode,
            changeProfileNode
        ];
    }
}