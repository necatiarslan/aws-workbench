"use strict";
/* eslint-disable @typescript-eslint/naming-convention */
/**
 * AWS Workflow Studio View for visualizing and editing Step Functions
 * Based on AWS Toolkit for VS Code implementation
 * Uses CustomTextEditorProvider pattern with URI query parameters
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineStudioView = exports.StateMachineStudioEditorProvider = void 0;
const vscode = require("vscode");
const ui = require("../common/UI");
const https = require("https");
const crypto = require("crypto");
var WorkflowMode;
(function (WorkflowMode) {
    WorkflowMode["Editable"] = "toolkit";
    WorkflowMode["Readonly"] = "readonly";
})(WorkflowMode || (WorkflowMode = {}));
var MessageType;
(function (MessageType) {
    MessageType["REQUEST"] = "REQUEST";
    MessageType["BROADCAST"] = "BROADCAST";
    MessageType["RESPONSE"] = "RESPONSE";
})(MessageType || (MessageType = {}));
var Command;
(function (Command) {
    Command["INIT"] = "INIT";
    Command["FILE_CHANGED"] = "FILE_CHANGED";
})(Command || (Command = {}));
/**
 * Provider for managing Workflow Studio as a custom editor
 */
class StateMachineStudioEditorProvider {
    static viewType = 'stateMachineStudio.asl';
    static webviewHtml;
    managedVisualizations = new Map();
    /**
     * Register the custom editor provider
     */
    static register(context) {
        const provider = new StateMachineStudioEditorProvider();
        return vscode.window.registerCustomEditorProvider(StateMachineStudioEditorProvider.viewType, provider, {
            webviewOptions: {
                enableFindWidget: true,
                retainContextWhenHidden: true,
            },
        });
    }
    /**
     * Open a file with Workflow Studio
     */
    static async openWithWorkflowStudio(uri, params) {
        await vscode.commands.executeCommand('vscode.openWith', uri, StateMachineStudioEditorProvider.viewType, params);
    }
    /**
     * Resolve custom text editor
     */
    async resolveCustomTextEditor(document, webviewPanel, _token) {
        ui.logToOutput('StateMachineStudioEditorProvider.resolveCustomTextEditor');
        try {
            // Parse query parameters from document URI
            const queryParams = new URLSearchParams(document.uri.query);
            const stateMachineName = queryParams.get('statemachineName') || document.uri.fsPath.split('/').pop() || 'Unknown';
            const workflowModeStr = queryParams.get('workflowMode') || 'toolkit';
            const workflowMode = workflowModeStr === 'readonly' ? WorkflowMode.Readonly : WorkflowMode.Editable;
            // Get ASL definition from query params or parse from document
            let aslDefinition;
            const definitionParam = queryParams.get('definition');
            if (definitionParam) {
                // Definition is base64 encoded in query params
                try {
                    const decoded = Buffer.from(definitionParam, 'base64').toString('utf-8');
                    aslDefinition = JSON.parse(decoded);
                }
                catch (e) {
                    ui.logToOutput('Failed to decode definition from query params', e);
                    aslDefinition = {};
                }
            }
            else if (document.getText().trim()) {
                // Definition is in document text
                try {
                    aslDefinition = JSON.parse(document.getText());
                }
                catch (e) {
                    ui.logToOutput('Failed to parse definition from document', e);
                    aslDefinition = {};
                }
            }
            else {
                // No definition found
                aslDefinition = {};
            }
            // Generate unique ID
            const fileId = crypto.createHash('sha256')
                .update(`${document.uri.fsPath}${Date.now()}`)
                .digest('hex')
                .substring(0, 8);
            // Create visualization
            const visualization = new StateMachineStudioView(document, webviewPanel, fileId, stateMachineName, aslDefinition, workflowMode);
            // Register for management
            this.managedVisualizations.set(document.uri.fsPath, visualization);
            // Handle disposal
            const disposable = visualization.onVisualizationDispose(() => {
                this.managedVisualizations.delete(document.uri.fsPath);
            });
            // Fetch HTML and refresh all visualizations
            await this.fetchWebviewHtml();
            for (const viz of this.managedVisualizations.values()) {
                await viz.refreshPanel().catch(err => {
                    ui.logToOutput('Error refreshing visualization', err);
                });
            }
        }
        catch (error) {
            ui.logToOutput('Error resolving custom text editor', error);
            ui.showErrorMessage('Failed to open Workflow Studio', error);
        }
    }
    /**
     * Fetches the Workflow Studio HTML from AWS CDN
     */
    async fetchWebviewHtml() {
        if (StateMachineStudioEditorProvider.webviewHtml) {
            return StateMachineStudioEditorProvider.webviewHtml;
        }
        ui.logToOutput('Fetching Workflow Studio from CDN...');
        return new Promise((resolve, reject) => {
            const cdn = 'https://d5t62uwepi9lu.cloudfront.net';
            const url = new URL('/index.html', cdn);
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    StateMachineStudioEditorProvider.webviewHtml = data;
                    ui.logToOutput('Successfully fetched Workflow Studio HTML');
                    resolve(data);
                });
            }).on('error', (err) => {
                ui.logToOutput('Error fetching Workflow Studio HTML', err);
                reject(err);
            });
        });
    }
    /**
     * Get webview content with initialization
     */
    async getWebviewContent() {
        const html = await this.fetchWebviewHtml();
        return this._injectInitScript(html);
    }
    /**
     * Injects initialization metadata into HTML
     */
    _injectInitScript(html) {
        // Add base tag for CDN resources
        const cdn = 'https://d5t62uwepi9lu.cloudfront.net';
        const baseTag = `<base href='${cdn}/'/>`;
        let result = html;
        // Inject base tag for CDN resources
        if (result.includes('<head>')) {
            result = result.replace('<head>', `<head>\n    ${baseTag}`);
        }
        // Inject simple initialization script that listens for messages
        const initScript = `
<script>
    (function() {
        const vscode = acquireVsCodeApi();
        console.log('Workflow Studio: Initialization script loaded');
        
        // Send init message to indicate webview is ready
        vscode.postMessage({ 
            command: 'INIT',
            messageType: 'REQUEST'
        });
    })();
</script>
        `;
        if (result.includes('</body>')) {
            result = result.replace('</body>', initScript + '</body>');
        }
        else {
            result = result + initScript;
        }
        return result;
    }
}
exports.StateMachineStudioEditorProvider = StateMachineStudioEditorProvider;
/**
 * Displays AWS Workflow Studio for visualizing and editing Step Function definitions
 */
class StateMachineStudioView {
    _panel;
    _document;
    _disposables = [];
    provider;
    aslDefinition;
    stepFuncName;
    workflowMode;
    fileId;
    _onDisposeEvent = new vscode.EventEmitter();
    constructor(document, panel, fileId, stepFuncName, aslDefinition, workflowMode) {
        ui.logToOutput('StateMachineStudioView.constructor Started');
        this._document = document;
        this.stepFuncName = stepFuncName;
        this.aslDefinition = aslDefinition;
        this._panel = panel;
        this.fileId = fileId;
        this.workflowMode = workflowMode;
        this.provider = new StateMachineStudioEditorProvider();
        // Set up message handler from webview
        this._disposables.push(this._panel.webview.onDidReceiveMessage((message) => this._handleMessage(message), null, this._disposables));
        // Set up disposal handler
        this._disposables.push(this._panel.onDidDispose(() => {
            this._onDisposeEvent.fire();
            this.dispose();
        }));
        this.setupPanel();
        ui.logToOutput('StateMachineStudioView.constructor Completed');
    }
    /**
     * Get the onVisualizationDispose event
     */
    onVisualizationDispose(listener) {
        return this._onDisposeEvent.event(listener);
    }
    /**
     * Setup the webview panel
     */
    async setupPanel() {
        this._panel.webview.options = {
            enableScripts: true,
            localResourceRoots: [],
        };
        await this.refreshPanel();
    }
    /**
     * Refresh the panel with latest webview content
     */
    async refreshPanel() {
        ui.logToOutput('StateMachineStudioView.refreshPanel Started');
        try {
            this._panel.webview.html = await this.provider.getWebviewContent();
        }
        catch (error) {
            ui.logToOutput('Error refreshing panel', error);
            this._panel.webview.html = this._getFallbackHtml(error);
        }
        ui.logToOutput('StateMachineStudioView.refreshPanel Completed');
    }
    /**
     * Handles messages from the webview
     */
    _handleMessage(message) {
        ui.logToOutput(`Received message from webview: ${message.command}`);
        if (message.command === Command.INIT) {
            // Webview is ready, broadcast the file contents (ASL definition)
            ui.logToOutput('Webview sent init, broadcasting file contents');
            this._broadcastFileChange();
        }
    }
    /**
     * Broadcasts file content (ASL definition) to the webview
     * Follows AWS Workflow Studio message protocol
     */
    _broadcastFileChange() {
        ui.logToOutput('Broadcasting file contents to webview');
        // Get file contents as string
        const fileContents = this._getFileContents();
        // Send broadcast message with file contents
        this._panel.webview.postMessage({
            messageType: MessageType.BROADCAST,
            command: Command.FILE_CHANGED,
            fileContents: fileContents,
            fileName: this.stepFuncName,
            filePath: this._document.uri.fsPath,
            trigger: 'INITIAL_RENDER',
        });
        ui.logToOutput(`Broadcasted file with ${fileContents.length} characters`);
    }
    /**
     * Get file contents as string (ASL definition)
     */
    _getFileContents() {
        if (this._document.getText().trim()) {
            // Use document text if available
            return this._document.getText();
        }
        else if (typeof this.aslDefinition === 'string') {
            // Use ASL definition if it's already a string
            return this.aslDefinition;
        }
        else {
            // Convert ASL definition object to string
            return JSON.stringify(this.aslDefinition, null, 2);
        }
    }
    /**
     * Get fallback HTML on error
     */
    _getFallbackHtml(error) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Workflow Studio Error</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
        }
        .error-container {
            background-color: var(--vscode-notifications-background);
            border-left: 4px solid var(--vscode-notificationsCenterHeader-foreground);
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
        }
        h2 {
            color: var(--vscode-errorForeground);
            margin-top: 0;
        }
    </style>
</head>
<body>
    <h1>AWS Workflow Studio</h1>
    <div class="error-container">
        <h2>Unable to Load Workflow Studio</h2>
        <p>Failed to fetch Workflow Studio from AWS CDN: ${error.message}</p>
        <p><strong>State Machine:</strong> ${this.stepFuncName}</p>
        <p>Please check your internet connection and try again.</p>
    </div>
    <div style="margin-top: 20px; padding: 15px; background-color: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px;">
        <h3>ASL Definition (Fallback)</h3>
        <pre>${JSON.stringify(this.aslDefinition, null, 2)}</pre>
    </div>
</body>
</html>
        `;
    }
    /**
     * Main entry point to render the Workflow Studio
     */
    static async Render(extensionUri, stepFuncName, codePath) {
        ui.logToOutput('StateMachineStudioView.Render Started');
        try {
            // Create URI with query parameters
            const uri = vscode.Uri.file(codePath);
            // Now open with the custom editor
            await StateMachineStudioEditorProvider.openWithWorkflowStudio(uri, {
                preserveFocus: false,
                viewColumn: vscode.ViewColumn.One,
            });
        }
        catch (error) {
            ui.logToOutput('StateMachineStudioView.Render Error !!!', error);
            ui.showErrorMessage('Failed to open Workflow Studio', error);
        }
    }
    /**
     * Cleanup and dispose resources
     */
    dispose() {
        ui.logToOutput('StateMachineStudioView.dispose Started');
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
        ui.logToOutput('StateMachineStudioView.dispose Completed');
    }
}
exports.StateMachineStudioView = StateMachineStudioView;
//# sourceMappingURL=StateMachineStudioView.js.map