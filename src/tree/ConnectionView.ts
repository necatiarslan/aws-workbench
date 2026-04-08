import * as vscode from 'vscode';
import { ConnectionTreeProvider } from './ConnectionTreeProvider';
import { Session } from '../common/Session';
import * as ui from '../common/UI';
import { NodeBase } from './NodeBase';
import { TreeView } from './TreeView';

export class ConnectionView {

    public static Current: ConnectionView;
    public view: vscode.TreeView<vscode.TreeItem>;
    public treeDataProvider: ConnectionTreeProvider;

    constructor(context: vscode.ExtensionContext) {
        ConnectionView.Current = this;
        this.treeDataProvider = new ConnectionTreeProvider();
        this.view = vscode.window.createTreeView('AwsWorkbenchConnectionView', {
            treeDataProvider: this.treeDataProvider,
            showCollapseAll: false
        });

        context.subscriptions.push(this.view);
        context.subscriptions.push(this.treeDataProvider);

        context.subscriptions.push(vscode.commands.registerCommand('AwsWorkbench.ConnectionRefreshView', () => {
            this.Refresh();
        }));

        context.subscriptions.push(vscode.commands.registerCommand('AwsWorkbench.ConnectionRefreshCredentials', async () => {
            try {
                await Session.Current.RefreshCredentials();
                ui.showInfoMessage('AWS credentials refreshed.');
                this.Refresh();
            } catch (error: any) {
                ui.showErrorMessage('Failed to refresh AWS credentials', error);
            }
        }));

        context.subscriptions.push(vscode.commands.registerCommand('AwsWorkbench.ConnectionTestAwsConnection', async () => {
            try {
                await Session.Current.TestAwsConnection();
                this.Refresh();
            } catch (error: any) {
                ui.showErrorMessage('Failed to test AWS connection', error);
            }
        }));

        context.subscriptions.push(vscode.commands.registerCommand('AwsWorkbench.ConnectionChangeProfile', async () => {
            await Session.Current.SetAwsProfile();
            NodeBase.RootNodes.forEach(node => {
                node.SetVisible();
            });
            TreeView.Current?.Refresh();
            this.Refresh();
        }));
    }

    public Refresh(): void {
        this.treeDataProvider.Refresh();
    }
}