"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const ui = require("./UI");
const vscode = require("vscode");
const credential_providers_1 = require("@aws-sdk/credential-providers");
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
    folders = new Map();
    folderFilter;
    resourceNameFilter;
    favoriteFolderIds = new Set();
    hiddenFolderIds = new Set();
    isShowOnlyFavorites = false;
    isShowHiddenNodes = false;
    _onDidChangeSession = new vscode.EventEmitter();
    onDidChangeSession = this._onDidChangeSession.event;
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
    SaveState() {
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
            const folderFilterTemp = this.Context.globalState.get('folderFilter');
            const resourceNameFilterTemp = this.Context.globalState.get('resourceNameFilter');
            const favoriteFolderIdsTemp = this.Context.globalState.get('favoriteFolderIds', []);
            const hiddenFolderIdsTemp = this.Context.globalState.get('hiddenFolderIds', []);
            const isShowOnlyFavoritesTemp = this.Context.globalState.get('isShowOnlyFavorites');
            const isShowHiddenNodesTemp = this.Context.globalState.get('isShowHiddenNodes');
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
            if (folderFilterTemp !== undefined) {
                Session.Current.folderFilter = folderFilterTemp;
            }
            if (resourceNameFilterTemp !== undefined) {
                Session.Current.resourceNameFilter = resourceNameFilterTemp;
            }
            Session.Current.favoriteFolderIds = new Set(favoriteFolderIdsTemp);
            Session.Current.hiddenFolderIds = new Set(hiddenFolderIdsTemp);
            if (isShowOnlyFavoritesTemp !== undefined) {
                Session.Current.isShowOnlyFavorites = isShowOnlyFavoritesTemp;
            }
            if (isShowHiddenNodesTemp !== undefined) {
                Session.Current.isShowHiddenNodes = isShowHiddenNodesTemp;
            }
        }
        catch (error) {
            ui.logToOutput("Session.LoadState Error !!!", error);
        }
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
        this._onDidChangeSession.fire();
        // MessageHub.CredentialsChanged();
        ui.logToOutput('Credentials cache refreshed');
    }
    ClearCredentials() {
        this.CurrentCredentials = undefined;
        this._onDidChangeSession.fire();
        ui.logToOutput('Credentials cache cleared');
    }
    TestAwsConnection() {
        if (!Session.Current?.GetCredentials()) {
            ui.showErrorMessage('AWS Connection Test Failed', new Error('No AWS credentials available'));
            return;
        }
        ui.showInfoMessage('AWS Connection Test Succeeded');
    }
    // --- Folder Management ---
    generateFolderId() {
        return Math.random().toString(36).substr(2, 9);
    }
    async loadFolders() {
        try {
            const folderData = this.Context.globalState.get('workbench.globalFolders', []);
            this.folders = new Map(folderData);
            ui.logToOutput(`Loaded ${this.folders.size} folders`);
        }
        catch (error) {
            ui.logToOutput('Failed to load folders', error);
        }
    }
    async saveFolders() {
        try {
            const folderArray = Array.from(this.folders.entries());
            await this.Context.globalState.update('workbench.globalFolders', folderArray);
        }
        catch (error) {
            ui.logToOutput('Failed to save folders', error);
        }
    }
    async addFolder(name, parentFolderId) {
        const id = this.generateFolderId();
        const folder = {
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
    async updateFolder(id, name) {
        const folder = this.folders.get(id);
        if (folder) {
            folder.name = name;
            await this.saveFolders();
            ui.logToOutput(`Updated folder: ${name} (${id})`);
        }
    }
    async deleteFolder(id) {
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
    getDescendantFolders(parentId) {
        const descendants = [];
        for (const [id, folder] of this.folders.entries()) {
            if (folder.parentFolderId === parentId) {
                descendants.push(id);
                descendants.push(...this.getDescendantFolders(id));
            }
        }
        return descendants;
    }
    getAllDescendantFolders(parentId) {
        return this.getDescendantFolders(parentId);
    }
    countResourcesInFolders(folderIds) {
        // This will be called by services to count their resources in these folders
        // For now, return 0 - actual counting happens at service level
        return 0;
    }
    getFolderHierarchy(parentId = null) {
        return Array.from(this.folders.values()).filter(f => f.parentFolderId === parentId);
    }
    getFolderPath(id) {
        const folder = this.folders.get(id);
        if (!folder)
            return '';
        let path = folder.name;
        let currentId = folder.parentFolderId;
        while (currentId) {
            const parent = this.folders.get(currentId);
            if (!parent)
                break;
            path = parent.name + ' > ' + path;
            currentId = parent.parentFolderId;
        }
        return path;
    }
    getFolderById(id) {
        return this.folders.get(id);
    }
    addFolderToFavorites(folderId) {
        this.favoriteFolderIds.add(folderId);
        this.SaveState();
    }
    removeFolderFromFavorites(folderId) {
        this.favoriteFolderIds.delete(folderId);
        this.SaveState();
    }
    isFolderFavorite(folderId) {
        return this.favoriteFolderIds.has(folderId);
    }
    hideFolderNode(folderId) {
        this.hiddenFolderIds.add(folderId);
        this.SaveState();
    }
    unhideFolderNode(folderId) {
        this.hiddenFolderIds.delete(folderId);
        this.SaveState();
    }
    isFolderHidden(folderId) {
        return this.hiddenFolderIds.has(folderId);
    }
    toggleShowHiddenNodes() {
        this.isShowHiddenNodes = !this.isShowHiddenNodes;
        this.SaveState();
    }
    toggleShowOnlyFavorites() {
        this.isShowOnlyFavorites = !this.isShowOnlyFavorites;
        this.SaveState();
    }
    dispose() {
        this._onDidChangeSession.dispose();
    }
}
exports.Session = Session;
//# sourceMappingURL=Session.js.map