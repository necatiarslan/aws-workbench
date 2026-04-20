"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionView = void 0;
const vscode = __importStar(require("vscode"));
const ConnectionTreeProvider_1 = require("./ConnectionTreeProvider");
const Session_1 = require("../common/Session");
const ui = __importStar(require("../common/UI"));
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
        context.subscriptions.push(vscode.commands.registerCommand('AwsWorkbench.ConnectionRefreshCredentials', async () => {
            try {
                await Session_1.Session.Current.RefreshCredentials();
                ui.showInfoMessage('AWS credentials refreshed.');
                this.Refresh();
            }
            catch (error) {
                ui.showErrorMessage('Failed to refresh AWS credentials', error);
            }
        }));
        context.subscriptions.push(vscode.commands.registerCommand('AwsWorkbench.ConnectionTestAwsConnection', async () => {
            try {
                await Session_1.Session.Current.TestAwsConnection();
                this.Refresh();
            }
            catch (error) {
                ui.showErrorMessage('Failed to test AWS connection', error);
            }
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