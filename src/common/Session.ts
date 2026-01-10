import * as ui from './UI';
import * as vscode from 'vscode';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

export interface Folder {
    id: string;
    name: string;
    parentFolderId: string | null;
    createdAt: number;
}

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
    public folders: Map<string, Folder> = new Map();
    public folderFilter: string | undefined;
    public resourceNameFilter: string | undefined;
    public favoriteFolderIds: Set<string> = new Set();
    public hiddenFolderIds: Set<string> = new Set();
    public isShowOnlyFavorites: boolean = false;
    public isShowHiddenNodes: boolean = false;

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
            this.Context.globalState.update('folderFilter', Session.Current?.folderFilter);
            this.Context.globalState.update('resourceNameFilter', Session.Current?.resourceNameFilter);
            this.Context.globalState.update('favoriteFolderIds', Array.from(Session.Current?.favoriteFolderIds || []));
            this.Context.globalState.update('hiddenFolderIds', Array.from(Session.Current?.hiddenFolderIds || []));
            this.Context.globalState.update('isShowOnlyFavorites', Session.Current?.isShowOnlyFavorites);
            this.Context.globalState.update('isShowHiddenNodes', Session.Current?.isShowHiddenNodes);
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
            const folderFilterTemp: string | undefined = this.Context.globalState.get('folderFilter');
            const resourceNameFilterTemp: string | undefined = this.Context.globalState.get('resourceNameFilter');
            const favoriteFolderIdsTemp: string[] = this.Context.globalState.get('favoriteFolderIds', []);
            const hiddenFolderIdsTemp: string[] = this.Context.globalState.get('hiddenFolderIds', []);
            const isShowOnlyFavoritesTemp: boolean | undefined = this.Context.globalState.get('isShowOnlyFavorites');
            const isShowHiddenNodesTemp: boolean | undefined = this.Context.globalState.get('isShowHiddenNodes');
            if (AwsEndPointTemp) { Session.Current!.AwsEndPoint = AwsEndPointTemp; }
            if (AwsRegionTemp) { Session.Current!.AwsRegion = AwsRegionTemp; }
            if (AwsProfileTemp) { Session.Current!.AwsProfile = AwsProfileTemp; }
            if (FilterStringTemp) { Session.Current!.FilterString = FilterStringTemp; }
            if (IsShowOnlyFavoriteTemp !== undefined) { Session.Current!.IsShowOnlyFavorite = IsShowOnlyFavoriteTemp; }
            if (IsShowHiddenNodesTemp !== undefined) { Session.Current!.IsShowHiddenNodes = IsShowHiddenNodesTemp; }
            if (folderFilterTemp !== undefined) { Session.Current!.folderFilter = folderFilterTemp; }
            if (resourceNameFilterTemp !== undefined) { Session.Current!.resourceNameFilter = resourceNameFilterTemp; }
            Session.Current!.favoriteFolderIds = new Set(favoriteFolderIdsTemp);
            Session.Current!.hiddenFolderIds = new Set(hiddenFolderIdsTemp);
            if (isShowOnlyFavoritesTemp !== undefined) { Session.Current!.isShowOnlyFavorites = isShowOnlyFavoritesTemp; }
            if (isShowHiddenNodesTemp !== undefined) { Session.Current!.isShowHiddenNodes = isShowHiddenNodesTemp; }

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

    // --- Folder Management ---

    private generateFolderId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    public async loadFolders(): Promise<void> {
        try {
            const folderData = this.Context.globalState.get<[string, Folder][]>('workbench.globalFolders', []);
            this.folders = new Map(folderData);
            ui.logToOutput(`Loaded ${this.folders.size} folders`);
        } catch (error: any) {
            ui.logToOutput('Failed to load folders', error);
        }
    }

    private async saveFolders(): Promise<void> {
        try {
            const folderArray = Array.from(this.folders.entries());
            await this.Context.globalState.update('workbench.globalFolders', folderArray);
        } catch (error: any) {
            ui.logToOutput('Failed to save folders', error);
        }
    }

    public async addFolder(name: string, parentFolderId?: string): Promise<string> {
        const id = this.generateFolderId();
        const folder: Folder = {
            id,
            name,
            parentFolderId: parentFolderId || null,
            createdAt: Date.now(),
        };
        this.folders.set(id, folder);
        await this.saveFolders();
        ui.logToOutput(`Added folder: ${name} (${id})`);
        return id;
    }

    public async updateFolder(id: string, name: string): Promise<void> {
        const folder = this.folders.get(id);
        if (folder) {
            folder.name = name;
            await this.saveFolders();
            ui.logToOutput(`Updated folder: ${name} (${id})`);
        }
    }

    public async deleteFolder(id: string): Promise<{ subfolderCount: number; resourceCount: number }> {
        const descendantFolders = this.getDescendantFolders(id);
        const resourceCount = this.countResourcesInFolders([id, ...descendantFolders]);
        
        // Delete all descendant folders and the folder itself
        this.folders.delete(id);
        for (const folderId of descendantFolders) {
            this.folders.delete(folderId);
        }
        
        await this.saveFolders();
        ui.logToOutput(`Deleted folder (${id}) with ${descendantFolders.length} subfolders and ${resourceCount} resources`);
        
        return { subfolderCount: descendantFolders.length, resourceCount };
    }

    private getDescendantFolders(parentId: string): string[] {
        const descendants: string[] = [];
        for (const [id, folder] of this.folders.entries()) {
            if (folder.parentFolderId === parentId) {
                descendants.push(id);
                descendants.push(...this.getDescendantFolders(id));
            }
        }
        return descendants;
    }

    public getAllDescendantFolders(parentId: string): string[] {
        return this.getDescendantFolders(parentId);
    }

    private countResourcesInFolders(folderIds: string[]): number {
        // This will be called by services to count their resources in these folders
        // For now, return 0 - actual counting happens at service level
        return 0;
    }

    public getFolderHierarchy(parentId: string | null = null): Folder[] {
        return Array.from(this.folders.values()).filter(f => f.parentFolderId === parentId);
    }

    public getFolderPath(id: string): string {
        const folder = this.folders.get(id);
        if (!folder) return '';
        
        let path = folder.name;
        let currentId = folder.parentFolderId;
        
        while (currentId) {
            const parent = this.folders.get(currentId);
            if (!parent) break;
            path = parent.name + ' > ' + path;
            currentId = parent.parentFolderId;
        }
        
        return path;
    }

    public getFolderById(id: string): Folder | undefined {
        return this.folders.get(id);
    }

    public addFolderToFavorites(folderId: string): void {
        this.favoriteFolderIds.add(folderId);
        this.SaveState();
    }

    public removeFolderFromFavorites(folderId: string): void {
        this.favoriteFolderIds.delete(folderId);
        this.SaveState();
    }

    public isFolderFavorite(folderId: string): boolean {
        return this.favoriteFolderIds.has(folderId);
    }

    public hideFolderNode(folderId: string): void {
        this.hiddenFolderIds.add(folderId);
        this.SaveState();
    }

    public unhideFolderNode(folderId: string): void {
        this.hiddenFolderIds.delete(folderId);
        this.SaveState();
    }

    public isFolderHidden(folderId: string): boolean {
        return this.hiddenFolderIds.has(folderId);
    }

    public toggleShowHiddenNodes(): void {
        this.isShowHiddenNodes = !this.isShowHiddenNodes;
        this.SaveState();
    }

    public toggleShowOnlyFavorites(): void {
        this.isShowOnlyFavorites = !this.isShowOnlyFavorites;
        this.SaveState();
    }

    public dispose() {
        Session.Current = undefined;
        this._onDidChangeSession.dispose();
    }
}