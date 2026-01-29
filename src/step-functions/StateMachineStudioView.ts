/**
 * AWS Workflow Studio View for visualizing and editing Step Functions
 * Based on AWS Toolkit for VS Code implementation
 * Uses CustomTextEditorProvider pattern with URI query parameters
 */

import * as vscode from 'vscode';
import * as ui from '../common/UI';
import * as https from 'https';
import * as crypto from 'crypto';

enum WorkflowMode {
    Editable = 'toolkit',
    Readonly = 'readonly',
}

interface Message {
    command: string;
    messageType?: string;
    [key: string]: any;
}

enum MessageType {
    REQUEST = 'REQUEST',
    BROADCAST = 'BROADCAST',
    RESPONSE = 'RESPONSE',
}

enum Command {
    INIT = 'INIT',
    FILE_CHANGED = 'FILE_CHANGED',
}

/**
 * Provider for managing Workflow Studio as a custom editor
 */
export class StateMachineStudioEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = 'stateMachineStudio.asl';
    private static webviewHtml: string | undefined;
    private managedVisualizations = new Map<string, StateMachineStudioView>();

    /**
     * Register the custom editor provider
     */
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new StateMachineStudioEditorProvider();
        return vscode.window.registerCustomEditorProvider(
            StateMachineStudioEditorProvider.viewType,
            provider,
            {
                webviewOptions: {
                    enableFindWidget: true,
                    retainContextWhenHidden: true,
                },
            }
        );
    }

    /**
     * Open a file with Workflow Studio
     */
    public static async openWithWorkflowStudio(
        uri: vscode.Uri,
        params?: Parameters<typeof vscode.window.createWebviewPanel>[2]
    ): Promise<void> {
        await vscode.commands.executeCommand(
            'vscode.openWith',
            uri,
            StateMachineStudioEditorProvider.viewType,
            params
        );
    }

    /**
     * Resolve custom text editor
     */
    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        ui.logToOutput('StateMachineStudioEditorProvider.resolveCustomTextEditor');

        try {
            // Parse query parameters from document URI
            const queryParams = new URLSearchParams(document.uri.query);
            const stateMachineName = queryParams.get('statemachineName') || document.uri.fsPath.split('/').pop() || 'Unknown';
            const workflowModeStr = queryParams.get('workflowMode') || 'toolkit';
            const workflowMode: WorkflowMode = workflowModeStr === 'readonly' ? WorkflowMode.Readonly : WorkflowMode.Editable;
            
            // Get ASL definition from query params or parse from document
            let aslDefinition: any;
            const definitionParam = queryParams.get('definition');
            
            if (definitionParam) {
                // Definition is base64 encoded in query params
                try {
                    const decoded = Buffer.from(definitionParam, 'base64').toString('utf-8');
                    aslDefinition = JSON.parse(decoded);
                } catch (e: any) {
                    ui.logToOutput('Failed to decode definition from query params', e);
                    aslDefinition = {};
                }
            } else if (document.getText().trim()) {
                // Definition is in document text
                try {
                    aslDefinition = JSON.parse(document.getText());
                } catch (e: any) {
                    ui.logToOutput('Failed to parse definition from document', e);
                    aslDefinition = {};
                }
            } else {
                // No definition found
                aslDefinition = {};
            }

            // Generate unique ID
            const fileId = crypto.createHash('sha256')
                .update(`${document.uri.fsPath}${Date.now()}`)
                .digest('hex')
                .substring(0, 8);

            // Create visualization
            const visualization = new StateMachineStudioView(
                document,
                webviewPanel,
                fileId,
                stateMachineName,
                aslDefinition,
                workflowMode
            );

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

        } catch (error: any) {
            ui.logToOutput('Error resolving custom text editor', error);
            ui.showErrorMessage('Failed to open Workflow Studio', error);
        }
    }

    /**
     * Fetches the Workflow Studio HTML from AWS CDN
     */
    public async fetchWebviewHtml(): Promise<string> {
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
    public async getWebviewContent(): Promise<string> {
        const html = await this.fetchWebviewHtml();
        return this._injectInitScript(html);
    }

    /**
     * Injects initialization metadata into HTML
     */
    private _injectInitScript(html: string): string {
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
        } else {
            result = result + initScript;
        }

        return result;
    }
}

/**
 * Displays AWS Workflow Studio for visualizing and editing Step Function definitions
 */
export class StateMachineStudioView {
    private readonly _panel: vscode.WebviewPanel;
    private readonly _document: vscode.TextDocument;
    private _disposables: vscode.Disposable[] = [];
    private provider: StateMachineStudioEditorProvider;
    private aslDefinition: any;
    private stepFuncName: string;
    private workflowMode: WorkflowMode;
    private fileId: string;
    private _onDisposeEvent = new vscode.EventEmitter<void>();

    public constructor(
        document: vscode.TextDocument,
        panel: vscode.WebviewPanel,
        fileId: string,
        stepFuncName: string,
        aslDefinition: any,
        workflowMode: WorkflowMode
    ) {
        ui.logToOutput('StateMachineStudioView.constructor Started');

        this._document = document;
        this.stepFuncName = stepFuncName;
        this.aslDefinition = aslDefinition;
        this._panel = panel;
        this.fileId = fileId;
        this.workflowMode = workflowMode;
        this.provider = new StateMachineStudioEditorProvider();

        // Set up message handler from webview
        this._disposables.push(
            this._panel.webview.onDidReceiveMessage(
                (message: Message) => this._handleMessage(message),
                null,
                this._disposables
            )
        );

        // Set up disposal handler
        this._disposables.push(
            this._panel.onDidDispose(() => {
                this._onDisposeEvent.fire();
                this.dispose();
            })
        );

        this.setupPanel();
        ui.logToOutput('StateMachineStudioView.constructor Completed');
    }

    /**
     * Get the onVisualizationDispose event
     */
    public onVisualizationDispose(listener: () => void): vscode.Disposable {
        return this._onDisposeEvent.event(listener);
    }

    /**
     * Setup the webview panel
     */
    private async setupPanel() {
        this._panel.webview.options = {
            enableScripts: true,
            localResourceRoots: [],
        };

        await this.refreshPanel();
    }

    /**
     * Refresh the panel with latest webview content
     */
    public async refreshPanel() {
        ui.logToOutput('StateMachineStudioView.refreshPanel Started');
        try {
            this._panel.webview.html = await this.provider.getWebviewContent();
        } catch (error: any) {
            ui.logToOutput('Error refreshing panel', error);
            this._panel.webview.html = this._getFallbackHtml(error);
        }
        ui.logToOutput('StateMachineStudioView.refreshPanel Completed');
    }

    /**
     * Handles messages from the webview
     */
    private _handleMessage(message: Message) {
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
    private _broadcastFileChange() {
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
    private _getFileContents(): string {
        if (this._document.getText().trim()) {
            // Use document text if available
            return this._document.getText();
        } else if (typeof this.aslDefinition === 'string') {
            // Use ASL definition if it's already a string
            return this.aslDefinition;
        } else {
            // Convert ASL definition object to string
            return JSON.stringify(this.aslDefinition, null, 2);
        }
    }

    /**
     * Get fallback HTML on error
     */
    private _getFallbackHtml(error: any): string {
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
    public static async Render(
        extensionUri: vscode.Uri,
        stepFuncName: string,
        codePath: string
    ) {
        ui.logToOutput('StateMachineStudioView.Render Started');

        try {
            // Create URI with query parameters
            const uri = vscode.Uri.file(codePath);
            
            // Now open with the custom editor
            await StateMachineStudioEditorProvider.openWithWorkflowStudio(uri, {
                preserveFocus: false,
                viewColumn: vscode.ViewColumn.One,
            });

        } catch (error: any) {
            ui.logToOutput('StateMachineStudioView.Render Error !!!', error);
            ui.showErrorMessage('Failed to open Workflow Studio', error);
        }
    }

    /**
     * Cleanup and dispose resources
     */
    private dispose() {
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
