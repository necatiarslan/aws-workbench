/* eslint-disable @typescript-eslint/naming-convention */
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
    [key: string]: any;
}

/**
 * Provider for managing Workflow Studio as a custom editor
 */
export class StepFuncStudioEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = 'stepFuncStudio.asl';
    private static webviewHtml: string | undefined;
    private managedVisualizations = new Map<string, StepFuncStudioView>();

    /**
     * Register the custom editor provider
     */
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new StepFuncStudioEditorProvider();
        return vscode.window.registerCustomEditorProvider(
            StepFuncStudioEditorProvider.viewType,
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
            StepFuncStudioEditorProvider.viewType,
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
        ui.logToOutput('StepFuncStudioEditorProvider.resolveCustomTextEditor');

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
            const visualization = new StepFuncStudioView(
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
        if (StepFuncStudioEditorProvider.webviewHtml) {
            return StepFuncStudioEditorProvider.webviewHtml;
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
                    StepFuncStudioEditorProvider.webviewHtml = data;
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
     * Injects initialization script into HTML
     */
    private _injectInitScript(html: string): string {
        // Add base tag for CDN resources
        const baseTag = `<base href='https://d5t62uwepi9lu.cloudfront.net/'/>`;
        let result = html;
        if (result.includes('<head>')) {
            result = result.replace('<head>', `<head>\n    ${baseTag}`);
        }

        // Inject initialization script
        const initScript = `
<script>
    (function() {
        console.log('Workflow Studio initializing...');
        
        // Listen for messages from extension
        window.addEventListener('message', function(event) {
            const message = event.data;
            console.log('Received message from extension:', message.command);
            
            if (message.command === 'setDefinition') {
                try {
                    const definition = typeof message.definition === 'string' 
                        ? JSON.parse(message.definition) 
                        : message.definition;
                    
                    console.log('Setting definition:', definition);
                    
                    // Dispatch event to Workflow Studio to load the definition
                    window.dispatchEvent(new CustomEvent('asl-definition-ready', {
                        detail: {
                            definition: definition,
                            stateMachineName: message.stateMachineName
                        }
                    }));
                    
                    // Try to set via postMessage to iFrame if it exists
                    const iframes = document.querySelectorAll('iframe');
                    iframes.forEach(iframe => {
                        try {
                            iframe.contentWindow?.postMessage({
                                command: 'setDefinition',
                                definition: definition,
                                stateMachineName: message.stateMachineName
                            }, '*');
                        } catch (e) {
                            console.log('Could not post to iframe:', e);
                        }
                    });
                } catch (e) {
                    console.error('Error setting definition:', e);
                }
            }
        });
        
        // Send init message when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM loaded, sending init message');
            try {
                acquireVsCodeApi().postMessage({ command: 'init' });
            } catch (e) {
                console.error('Error sending init:', e);
            }
        });
        
        // Also send init after a delay
        setTimeout(function() {
            console.log('Sending delayed init message');
            try {
                acquireVsCodeApi().postMessage({ command: 'init' });
            } catch (e) {
                console.error('Error sending delayed init:', e);
            }
        }, 1000);
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
export class StepFuncStudioView {
    private readonly _panel: vscode.WebviewPanel;
    private readonly _document: vscode.TextDocument;
    private _disposables: vscode.Disposable[] = [];
    private provider: StepFuncStudioEditorProvider;
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
        ui.logToOutput('StepFuncStudioView.constructor Started');

        this._document = document;
        this.stepFuncName = stepFuncName;
        this.aslDefinition = aslDefinition;
        this._panel = panel;
        this.fileId = fileId;
        this.workflowMode = workflowMode;
        this.provider = new StepFuncStudioEditorProvider();

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
        ui.logToOutput('StepFuncStudioView.constructor Completed');
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
        ui.logToOutput('StepFuncStudioView.refreshPanel Started');
        try {
            this._panel.webview.html = await this.provider.getWebviewContent();
            // Send definition after a short delay to ensure webview is ready
            setTimeout(() => this._sendAslDefinition(), 500);
        } catch (error: any) {
            ui.logToOutput('Error refreshing panel', error);
            this._panel.webview.html = this._getFallbackHtml(error);
        }
        ui.logToOutput('StepFuncStudioView.refreshPanel Completed');
    }

    /**
     * Handles messages from the webview
     */
    private _handleMessage(message: Message) {
        ui.logToOutput(`Received message from webview: ${message.command}`);
        
        if (message.command === 'init') {
            // Webview is ready, send the ASL definition
            this._sendAslDefinition();
        }
    }

    /**
     * Sends the ASL definition to the webview
     */
    private _sendAslDefinition() {
        ui.logToOutput('Sending ASL definition to webview');
        
        // Convert ASL definition to string if it's an object
        const aslString = typeof this.aslDefinition === 'string' 
            ? this.aslDefinition 
            : JSON.stringify(this.aslDefinition);

        this._panel.webview.postMessage({
            command: 'setDefinition',
            definition: aslString,
            stateMachineName: this.stepFuncName,
        });
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
        aslDefinition: any
    ) {
        ui.logToOutput('StepFuncStudioView.Render Started');

        try {
            // Convert definition to JSON string
            const aslJson = typeof aslDefinition === 'string' ? aslDefinition : JSON.stringify(aslDefinition, null, 2);
            
            // Create a temporary file URI - use base64 to encode the definition
            const definitionB64 = Buffer.from(aslJson).toString('base64');
            const query = `statemachineName=${encodeURIComponent(stepFuncName)}&workflowMode=${encodeURIComponent(WorkflowMode.Editable)}&definition=${definitionB64}`;
            
            // Create an untitled document with the definition as content
            const uri = vscode.Uri.parse(`untitled:${stepFuncName}.asl.json?${query}`);
            
            // Create text document directly with the content
            const doc = await vscode.workspace.openTextDocument(uri);
            
            // Write the ASL definition to the document
            const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.One, false);
            
            // Get the full content range
            const fullRange = new vscode.Range(
                new vscode.Position(0, 0),
                new vscode.Position(doc.lineCount, 0)
            );
            
            // Apply edit to add content
            const edit = new vscode.WorkspaceEdit();
            edit.set(uri, [vscode.TextEdit.replace(fullRange, aslJson)]);
            await vscode.workspace.applyEdit(edit);
            
            // Now open with the custom editor
            await StepFuncStudioEditorProvider.openWithWorkflowStudio(uri, {
                preserveFocus: false,
                viewColumn: vscode.ViewColumn.One,
            });

        } catch (error: any) {
            ui.logToOutput('StepFuncStudioView.Render Error !!!', error);
            ui.showErrorMessage('Failed to open Workflow Studio', error);
        }
    }

    /**
     * Cleanup and dispose resources
     */
    private dispose() {
        ui.logToOutput('StepFuncStudioView.dispose Started');

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }

        ui.logToOutput('StepFuncStudioView.dispose Completed');
    }
}
