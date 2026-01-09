import * as ui from './UI';
import * as vscode from 'vscode';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

export class Session implements vscode.Disposable {
    public static Current: Session | undefined = undefined;

    public Context: vscode.ExtensionContext;
    public ExtensionUri: vscode.Uri;
    public FilterString: string = '';
    public IsShowOnlyFavorite: boolean = false;
    public IsShowHiddenNodes: boolean = false;
    public AwsProfile: string = "default";
    public AwsEndPoint: string | undefined;
    public AwsRegion: string = "us-east-1";
    public CurrentCredentials: AwsCredentialIdentity | undefined;
    public HostAppName: string = '';
    public IsProVersion: boolean = false;

    private _onDidChangeSession = new vscode.EventEmitter<void>();
    public readonly onDidChangeSession = this._onDidChangeSession.event;

    public constructor(context: vscode.ExtensionContext) {
        Session.Current = this;
        this.Context = context;
        this.ExtensionUri = context.extensionUri;
        this.LoadState();
        this.GetCredentials();
        this.HostAppName = vscode.env.appName;
    }

    public IsHostSupportLanguageTools(): boolean {
        const supportedHosts = ['Visual Studio Code', 'Visual Studio Code - Insiders', 'VSCodium'];
        return supportedHosts.includes(this.HostAppName);
    }

    public SaveState() {
        ui.logToOutput('Saving state...');

        try {
            this.Context.globalState.update('AwsProfile', Session.Current?.AwsProfile);
            this.Context.globalState.update('AwsEndPoint', Session.Current?.AwsEndPoint);
            this.Context.globalState.update('AwsRegion', Session.Current?.AwsRegion);
            this.Context.globalState.update('FilterString', Session.Current?.FilterString);
            this.Context.globalState.update('IsShowOnlyFavorite', Session.Current?.IsShowOnlyFavorite);
            this.Context.globalState.update('IsShowHiddenNodes', Session.Current?.IsShowHiddenNodes);
            this._onDidChangeSession.fire();
        } catch (error: any) {
            ui.logToOutput("Session.SaveState Error !!!", error);
        }
    }

    public LoadState() {
        ui.logToOutput('Loading state...');

        try {
            const AwsProfileTemp: string | undefined = this.Context.globalState.get('AwsProfile');
            const AwsEndPointTemp: string | undefined = this.Context.globalState.get('AwsEndPoint');
            const AwsRegionTemp: string | undefined = this.Context.globalState.get('AwsRegion');
            const FilterStringTemp: string | undefined = this.Context.globalState.get('FilterString');
            const IsShowOnlyFavoriteTemp: boolean | undefined = this.Context.globalState.get('IsShowOnlyFavorite');
            const IsShowHiddenNodesTemp: boolean | undefined = this.Context.globalState.get('IsShowHiddenNodes');
            if (AwsEndPointTemp) { Session.Current!.AwsEndPoint = AwsEndPointTemp; }
            if (AwsRegionTemp) { Session.Current!.AwsRegion = AwsRegionTemp; }
            if (AwsProfileTemp) { Session.Current!.AwsProfile = AwsProfileTemp; }
            if (FilterStringTemp) { Session.Current!.FilterString = FilterStringTemp; }
            if (IsShowOnlyFavoriteTemp !== undefined) { Session.Current!.IsShowOnlyFavorite = IsShowOnlyFavoriteTemp; }
            if (IsShowHiddenNodesTemp !== undefined) { Session.Current!.IsShowHiddenNodes = IsShowHiddenNodesTemp; }

        } catch (error: any) {
            ui.logToOutput("Session.LoadState Error !!!", error);
        }
    }

    public async SetAwsEndpoint() {
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

    public async SetAwsRegion() {
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

    public async GetCredentials(): Promise<AwsCredentialIdentity | undefined> {
        if (this.CurrentCredentials !== undefined) {
            ui.logToOutput(`Using cached credentials (AccessKeyId=${this.CurrentCredentials.accessKeyId})`);
            return this.CurrentCredentials;
        }

        try {
            process.env.AWS_PROFILE = this.AwsProfile;

            const provider = fromNodeProviderChain({ ignoreCache: true });
            this.CurrentCredentials = await provider();

            if (!this.CurrentCredentials) {
                throw new Error('AWS credentials not found');
            }

            ui.logToOutput(`Credentials loaded (AccessKeyId=${this.CurrentCredentials.accessKeyId})`);
            return this.CurrentCredentials;
        } catch (error: any) {
            ui.logToOutput('Failed to get credentials', error);
            throw error;
        }
    }

    public RefreshCredentials() {
        this.CurrentCredentials = undefined;
        this.GetCredentials();
        this._onDidChangeSession.fire();
        // MessageHub.CredentialsChanged();
        ui.logToOutput('Credentials cache refreshed');
    }

    public ClearCredentials() {
        this.CurrentCredentials = undefined;
        this._onDidChangeSession.fire();
        ui.logToOutput('Credentials cache cleared');
    }

    public TestAwsConnection() {
        if (!Session.Current?.GetCredentials()) {
            ui.showErrorMessage('AWS Connection Test Failed', new Error('No AWS credentials available'));
            return;
        }
        ui.showInfoMessage('AWS Connection Test Succeeded');
    }

    public dispose() {
        Session.Current = undefined;
        this._onDidChangeSession.dispose();
    }
}