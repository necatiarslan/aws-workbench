import * as vscode from "vscode";
import * as ui from "../common/UI";
import { TreeState } from "../tree/TreeState";
import { Session } from "../common/Session";

interface NoteViewState {
    noteTitle: string;
    noteContent: string;
}

interface INoteNode {
    NoteTitle: string;
    NoteContent: string;
}

export class NoteView {
    public static Current: NoteView | undefined;
    private readonly panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];
    private extensionUri: vscode.Uri;
    private state: NoteViewState;
    private noteNode: INoteNode;

    private constructor(
        panel: vscode.WebviewPanel,
        noteNode: INoteNode
    ) {
        this.panel = panel;
        this.extensionUri = Session.Current.ExtensionUri;
        this.noteNode = noteNode;
        this.state = { 
            noteTitle: noteNode.NoteTitle, 
            noteContent: noteNode.NoteContent 
        };

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.onDidReceiveMessage(this.handleMessage.bind(this), null, this.disposables);
        this.render();
    }

    public static Render(noteNode: INoteNode) {
        ui.logToOutput(`NoteView.Render ${noteNode.NoteTitle}`);
        
        if (NoteView.Current) {
            NoteView.Current.noteNode = noteNode;
            NoteView.Current.state = { 
                noteTitle: noteNode.NoteTitle, 
                noteContent: noteNode.NoteContent 
            };
            NoteView.Current.panel.title = `Note: ${noteNode.NoteTitle}`;
            NoteView.Current.panel.reveal(vscode.ViewColumn.One);
            NoteView.Current.render();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            "NoteView",
            `Note: ${noteNode.NoteTitle}`,
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        NoteView.Current = new NoteView(panel, noteNode);
    }

    private dispose() {
        NoteView.Current = undefined;
        while (this.disposables.length) {
            const d = this.disposables.pop();
            if (d) { d.dispose(); }
        }
    }

    private render() {
        this.panel.webview.html = this.getHtml(this.panel.webview);
    }

    private async handleMessage(message: any) {
        switch (message.command) {
            case "save":
                this.noteNode.NoteContent = message.content;
                TreeState.save();
                ui.showInfoMessage("Note saved successfully");
                return;
            case "close":
                this.panel.dispose();
                return;
        }
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    private getHtml(webview: vscode.Webview): string {
        const nonce = this.getNonce();
        const styleUri = ui.getUri(webview, this.extensionUri, ["media", "notes", "style.css"]);
        
        // Escape content for safe embedding
        const escapedContent = this.escapeHtml(this.state.noteContent);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' https://cdn.quilljs.com; script-src 'nonce-${nonce}' https://cdn.quilljs.com; font-src ${webview.cspSource} https://cdn.quilljs.com;">
    <link href="https://cdn.quilljs.com/1.3.7/quill.snow.css" rel="stylesheet">
    <link href="${styleUri}" rel="stylesheet" />
    <title>Note: ${this.escapeHtml(this.state.noteTitle)}</title>
    <style>
        body {
            padding: 20px;
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .header h1 {
            margin: 0;
            font-size: 1.5em;
            color: var(--vscode-editor-foreground);
        }
        .button-group {
            display: flex;
            gap: 10px;
        }
        button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .save-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .save-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .close-btn {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .close-btn:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        #editor-container {
            height: 500px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
        }
        .ql-toolbar {
            background-color: var(--vscode-editor-background);
            border-color: var(--vscode-input-border) !important;
            border-radius: 4px 4px 0 0;
        }
        .ql-container {
            border-color: var(--vscode-input-border) !important;
            border-radius: 0 0 4px 4px;
            font-size: 14px;
        }
        .ql-editor {
            background-color: var(--vscode-input-background);
            color: var(--vscode-editor-foreground);
            min-height: 400px;
        }
        .ql-editor.ql-blank::before {
            color: var(--vscode-input-placeholderForeground);
        }
        .ql-snow .ql-stroke {
            stroke: var(--vscode-editor-foreground);
        }
        .ql-snow .ql-fill {
            fill: var(--vscode-editor-foreground);
        }
        .ql-snow .ql-picker {
            color: var(--vscode-editor-foreground);
        }
        .ql-snow .ql-picker-options {
            background-color: var(--vscode-dropdown-background);
            border-color: var(--vscode-dropdown-border);
        }
        .status-message {
            margin-top: 10px;
            padding: 8px;
            border-radius: 4px;
            display: none;
        }
        .status-message.success {
            background-color: var(--vscode-inputValidation-infoBackground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
            display: block;
        }
        .status-message.error {
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${this.escapeHtml(this.state.noteTitle)}</h1>
            <div class="button-group">
                <button class="save-btn" id="saveBtn">Save</button>
                <button class="close-btn" id="closeBtn">Close</button>
            </div>
        </div>
        
        <div id="editor-container"></div>
        <div id="statusMessage" class="status-message"></div>
    </div>

    <script src="https://cdn.quilljs.com/1.3.7/quill.min.js"></script>
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        
        // Initialize Quill editor
        const quill = new Quill('#editor-container', {
            theme: 'snow',
            placeholder: 'Write your note here...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['blockquote', 'code-block'],
                    ['link'],
                    ['clean']
                ]
            }
        });

        // Load initial content
        const initialContent = ${JSON.stringify(this.state.noteContent)};
        if (initialContent) {
            try {
                // Try to parse as Delta (Quill's native format)
                const parsed = JSON.parse(initialContent);
                if (parsed.ops) {
                    quill.setContents(parsed);
                } else {
                    // Plain text or HTML
                    quill.root.innerHTML = initialContent;
                }
            } catch (e) {
                // Plain text or HTML
                quill.root.innerHTML = initialContent;
            }
        }

        // Save button
        document.getElementById('saveBtn').addEventListener('click', () => {
            const content = JSON.stringify(quill.getContents());
            vscode.postMessage({ command: 'save', content: content });
            showStatus('Note saved!', 'success');
        });

        // Close button
        document.getElementById('closeBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'close' });
        });

        // Auto-save on Ctrl+S
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                const content = JSON.stringify(quill.getContents());
                vscode.postMessage({ command: 'save', content: content });
                showStatus('Note saved!', 'success');
            }
        });

        function showStatus(message, type) {
            const statusEl = document.getElementById('statusMessage');
            statusEl.textContent = message;
            statusEl.className = 'status-message ' + type;
            setTimeout(() => {
                statusEl.className = 'status-message';
            }, 3000);
        }

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'error') {
                showStatus(message.message, 'error');
            }
        });
    </script>
</body>
</html>`;
    }
}
