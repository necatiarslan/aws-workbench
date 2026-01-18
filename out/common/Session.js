"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const ui = require("./UI");
const vscode = require("vscode");
const credential_providers_1 = require("@aws-sdk/credential-providers");
const api = require("../aws-sdk/API");
const client_sts_1 = require("@aws-sdk/client-sts");
class Session {
    static Current;
    Context;
    ExtensionUri;
    FilterString = '';
    IsShowOnlyFavorite = false;
    IsShowHiddenNodes = false;
    AwsProfile = "default";
    AwsEndPoint;
    AwsRegion = "us-east-1";
    CurrentCredentials;
    HostAppName = '';
    IsProVersion = false;
    constructor(context) {
        Session.Current = this;
        this.Context = context;
        this.ExtensionUri = context.extensionUri;
        this.LoadState();
        this.GetCredentials();
        this.HostAppName = vscode.env.appName;
    }
    IsHostSupportLanguageTools() {
        const supportedHosts = ['Visual Studio Code', 'Visual Studio Code - Insiders', 'VSCodium'];
        return supportedHosts.includes(this.HostAppName);
    }
    async SaveState() {
        ui.logToOutput('Saving state...');
        try {
            this.Context.globalState.update('AwsProfile', Session.Current?.AwsProfile);
            this.Context.globalState.update('AwsEndPoint', Session.Current?.AwsEndPoint);
            this.Context.globalState.update('AwsRegion', Session.Current?.AwsRegion);
            this.Context.globalState.update('FilterString', Session.Current?.FilterString);
            this.Context.globalState.update('IsShowOnlyFavorite', Session.Current?.IsShowOnlyFavorite);
            this.Context.globalState.update('IsShowHiddenNodes', Session.Current?.IsShowHiddenNodes);
            ui.logToOutput('State saved');
        }
        catch (error) {
            ui.logToOutput("Session.SaveState Error !!!", error);
        }
    }
    LoadState() {
        ui.logToOutput('Loading state...');
        try {
            const AwsProfileTemp = this.Context.globalState.get('AwsProfile');
            const AwsEndPointTemp = this.Context.globalState.get('AwsEndPoint');
            const AwsRegionTemp = this.Context.globalState.get('AwsRegion');
            const FilterStringTemp = this.Context.globalState.get('FilterString');
            const IsShowOnlyFavoriteTemp = this.Context.globalState.get('IsShowOnlyFavorite');
            const IsShowHiddenNodesTemp = this.Context.globalState.get('IsShowHiddenNodes');
            if (AwsEndPointTemp) {
                Session.Current.AwsEndPoint = AwsEndPointTemp;
            }
            if (AwsRegionTemp) {
                Session.Current.AwsRegion = AwsRegionTemp;
            }
            if (AwsProfileTemp) {
                Session.Current.AwsProfile = AwsProfileTemp;
            }
            if (FilterStringTemp) {
                Session.Current.FilterString = FilterStringTemp;
            }
            if (IsShowOnlyFavoriteTemp !== undefined) {
                Session.Current.IsShowOnlyFavorite = IsShowOnlyFavoriteTemp;
            }
            if (IsShowHiddenNodesTemp !== undefined) {
                Session.Current.IsShowHiddenNodes = IsShowHiddenNodesTemp;
            }
            ui.logToOutput('State loaded');
        }
        catch (error) {
            ui.logToOutput("Session.LoadState Error !!!", error);
        }
    }
    async SetAwsProfile() {
        var result = await api.GetAwsProfileList();
        if (!result) {
            ui.showErrorMessage('No AWS profiles found', new Error('No profiles'));
            return;
        }
        let selectedAwsProfile = await vscode.window.showQuickPick(result, { canPickMany: false, placeHolder: 'Select Aws Profile' });
        if (!selectedAwsProfile) {
            return;
        }
        this.AwsProfile = selectedAwsProfile;
        this.SaveState();
    }
    async SetAwsEndpoint() {
        const current = Session.Current?.AwsEndPoint || '';
        const value = await vscode.window.showInputBox({
            prompt: 'Enter AWS Endpoint URL (e.g., https://s3.amazonaws.com or custom S3-compatible endpoint)',
            placeHolder: 'https://example-endpoint',
            value: current,
        });
        if (value !== undefined) {
            if (!Session.Current) {
                ui.showErrorMessage('Session not initialized', new Error('No session'));
                return;
            }
            Session.Current.AwsEndPoint = value.trim() || undefined;
            Session.Current.SaveState();
            ui.showInfoMessage('AWS Endpoint updated');
            ui.logToOutput('AWS Endpoint set to ' + (Session.Current.AwsEndPoint || 'undefined'));
            Session.Current.ClearCredentials();
        }
    }
    async SetAwsRegion() {
        const current = Session.Current?.AwsRegion || 'us-east-1';
        const value = await vscode.window.showInputBox({
            prompt: 'Enter default AWS region',
            placeHolder: 'us-east-1',
            value: current,
        });
        if (value !== undefined) {
            if (!Session.Current) {
                ui.showErrorMessage('Session not initialized', new Error('No session'));
                return;
            }
            Session.Current.AwsRegion = value.trim() || 'us-east-1';
            Session.Current.SaveState();
            Session.Current.ClearCredentials();
            ui.showInfoMessage('Default AWS Region updated');
            ui.logToOutput('AWS Region set to ' + (Session.Current.AwsRegion || 'us-east-1'));
        }
    }
    async GetCredentials() {
        if (this.CurrentCredentials !== undefined) {
            ui.logToOutput(`Using cached credentials (AccessKeyId=${this.CurrentCredentials.accessKeyId})`);
            return this.CurrentCredentials;
        }
        try {
            process.env.AWS_PROFILE = this.AwsProfile;
            const provider = (0, credential_providers_1.fromNodeProviderChain)({ ignoreCache: true });
            this.CurrentCredentials = await provider();
            if (!this.CurrentCredentials) {
                throw new Error('AWS credentials not found');
            }
            ui.logToOutput(`Credentials loaded (AccessKeyId=${this.CurrentCredentials.accessKeyId})`);
            return this.CurrentCredentials;
        }
        catch (error) {
            ui.logToOutput('Failed to get credentials', error);
            throw error;
        }
    }
    RefreshCredentials() {
        this.CurrentCredentials = undefined;
        this.GetCredentials();
        // MessageHub.CredentialsChanged();
        ui.logToOutput('Credentials cache refreshed');
    }
    ClearCredentials() {
        this.CurrentCredentials = undefined;
        ui.logToOutput('Credentials cache cleared');
    }
    async GetSTSClient(region) {
        const credentials = await this.GetCredentials();
        const stsClient = new client_sts_1.STSClient({ region, credentials, endpoint: this.AwsEndPoint });
        return stsClient;
    }
    async TestAwsConnection() {
        if (!await Session.Current.GetCredentials()) {
            ui.showErrorMessage('No AWS credentials available', new Error('No AWS credentials available'));
            return;
        }
        ui.showInfoMessage('You have valid AWS credentials configured.');
        const caller = await this.GetCallerIdentity();
        ui.showInfoMessage(`AWS Connection Test Successful. Account: ${caller.Account}, UserId: ${caller.UserId}`);
        ui.logToOutput(`AWS Connection Test Successful. Account: ${caller.Account}, UserId: ${caller.UserId}, Arn: ${caller.Arn}`);
    }
    async GetCallerIdentity() {
        const sts = await this.GetSTSClient(this.AwsRegion || 'us-east-1');
        const command = new client_sts_1.GetCallerIdentityCommand({});
        const result = await sts.send(command);
        return result;
    }
    dispose() {
    }
}
exports.Session = Session;
//# sourceMappingURL=Session.js.map