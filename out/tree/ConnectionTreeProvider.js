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
exports.ConnectionTreeProvider = void 0;
const vscode = __importStar(require("vscode"));
const Session_1 = require("../common/Session");
class ConnectionTreeProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    expirationRefreshInterval;
    Refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    dispose() {
        this.StopExpirationRefreshTimer();
        this._onDidChangeTreeData.dispose();
    }
    getTreeItem(node) {
        return node;
    }
    getChildren(node) {
        if (node) {
            return [];
        }
        const activeProfileNode = new vscode.TreeItem(`Active Profile: ${Session_1.Session.Current.AwsProfile}`, vscode.TreeItemCollapsibleState.None);
        activeProfileNode.contextValue = 'ConnectionActiveProfileNode';
        activeProfileNode.iconPath = new vscode.ThemeIcon('account');
        activeProfileNode.command = {
            command: 'AwsWorkbench.ConnectionChangeProfile',
            title: 'Change Profile'
        };
        let expirationLabel;
        let expirationIcon;
        if (Session_1.Session.Current.HasExpiration && !Session_1.Session.Current.IsExpired) {
            expirationLabel = `Expire in ${Session_1.Session.Current.ExpireTime}`;
            expirationIcon = 'history';
            this.StartExpirationRefreshTimer();
        }
        else if (Session_1.Session.Current.HasExpiration && Session_1.Session.Current.IsExpired) {
            expirationLabel = `Expired (${Session_1.Session.Current.ExpireTime} ago)`;
            expirationIcon = 'warning';
            this.StopExpirationRefreshTimer();
        }
        else {
            expirationLabel = 'No Expiration Time';
            expirationIcon = 'circle';
            this.StopExpirationRefreshTimer();
        }
        const expirationTimeNode = new vscode.TreeItem(expirationLabel, vscode.TreeItemCollapsibleState.None);
        expirationTimeNode.contextValue = 'ConnectionExpirationTimeNode';
        expirationTimeNode.iconPath = new vscode.ThemeIcon(expirationIcon);
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
    StartExpirationRefreshTimer() {
        if (this.expirationRefreshInterval !== undefined) {
            return;
        }
        this.expirationRefreshInterval = setInterval(() => {
            if (!(Session_1.Session.Current.HasExpiration && !Session_1.Session.Current.IsExpired)) {
                this.StopExpirationRefreshTimer();
            }
            this.Refresh();
        }, 1000);
    }
    StopExpirationRefreshTimer() {
        if (this.expirationRefreshInterval !== undefined) {
            clearInterval(this.expirationRefreshInterval);
            this.expirationRefreshInterval = undefined;
        }
    }
}
exports.ConnectionTreeProvider = ConnectionTreeProvider;
//# sourceMappingURL=ConnectionTreeProvider.js.map