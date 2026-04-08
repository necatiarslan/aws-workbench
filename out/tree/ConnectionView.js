"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionView = void 0;
const vscode = require("vscode");
const ConnectionTreeProvider_1 = require("./ConnectionTreeProvider");
const Session_1 = require("../common/Session");
const ui = require("../common/UI");
const NodeBase_1 = require("./NodeBase");
const TreeView_1 = require("./TreeView");
class ConnectionView {
    static Current;
    view;
    treeDataProvider;
    constructor(context) {
        ConnectionView.Current = this;
        this.treeDataProvider = new ConnectionTreeProvider_1.ConnectionTreeProvider();
        this.view = vscode.window.createTreeView('AwsWorkbenchConnectionView', {
            treeDataProvider: this.treeDataProvider,
            showCollapseAll: false
        });
        context.subscriptions.push(this.view);
        context.subscriptions.push(this.treeDataProvider);
        context.subscriptions.push(vscode.commands.registerCommand('AwsWorkbench.ConnectionRefreshView', () => {
            this.Refresh();
        }));
        context.subscriptions.push(vscode.commands.registerCommand('AwsWorkbench.ConnectionRefreshCredentials', () => {
            Session_1.Session.Current.RefreshCredentials();
            ui.showInfoMessage('AWS credentials refreshed.');
            this.Refresh();
        }));
        context.subscriptions.push(vscode.commands.registerCommand('AwsWorkbench.ConnectionTestAwsConnection', async () => {
            await Session_1.Session.Current.TestAwsConnection();
            this.Refresh();
        }));
        context.subscriptions.push(vscode.commands.registerCommand('AwsWorkbench.ConnectionChangeProfile', async () => {
            await Session_1.Session.Current.SetAwsProfile();
            NodeBase_1.NodeBase.RootNodes.forEach(node => {
                node.SetVisible();
            });
            TreeView_1.TreeView.Current?.Refresh();
            this.Refresh();
        }));
    }
    Refresh() {
        this.treeDataProvider.Refresh();
    }
}
exports.ConnectionView = ConnectionView;
//# sourceMappingURL=ConnectionView.js.map