"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSMessageView = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const ui = require("../common/UI");
class SQSMessageView {
    static Current;
    panel;
    disposables = [];
    extensionUri;
    state;
    constructor(panel, extensionUri, messageNode) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.state = {
            messageId: messageNode.MessageId,
            body: messageNode.Body,
            attributes: messageNode.Attributes,
            receiptHandle: messageNode.ReceiptHandle
        };
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.onDidReceiveMessage(this.handleMessage.bind(this), null, this.disposables);
        this.render();
    }
    static Render(extensionUri, messageNode) {
        ui.logToOutput(`SQSMessageView.Render ${messageNode.MessageId}`);
        if (SQSMessageView.Current) {
            SQSMessageView.Current.state = {
                messageId: messageNode.MessageId,
                body: messageNode.Body,
                attributes: messageNode.Attributes,
                receiptHandle: messageNode.ReceiptHandle
            };
            SQSMessageView.Current.panel.title = `Message: ${messageNode.MessageId.substring(0, 20)}...`;
            SQSMessageView.Current.panel.reveal(vscode.ViewColumn.One);
            SQSMessageView.Current.render();
            return;
        }
        const panel = vscode.window.createWebviewPanel("SQSMessageView", `Message: ${messageNode.MessageId.substring(0, 20)}...`, vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
        SQSMessageView.Current = new SQSMessageView(panel, extensionUri, messageNode);
    }
    dispose() {
        SQSMessageView.Current = undefined;
        while (this.disposables.length) {
            const d = this.disposables.pop();
            if (d) {
                d.dispose();
            }
        }
    }
    render() {
        this.panel.webview.html = this.getHtml(this.panel.webview);
    }
    async handleMessage(message) {
        switch (message.command) {
            case "copyBody":
                await this.copyBody();
                return;
            case "copyMessageId":
                await this.copyMessageId();
                return;
            case "copyAll":
                await this.copyAll();
                return;
            case "formatBody":
                this.formatBody();
                return;
            case "close":
                this.panel.dispose();
                return;
        }
    }
    async copyBody() {
        ui.CopyToClipboard(this.state.body);
        ui.showInfoMessage('Message body copied to clipboard');
    }
    async copyMessageId() {
        ui.CopyToClipboard(this.state.messageId);
        ui.showInfoMessage('Message ID copied to clipboard');
    }
    async copyAll() {
        const fullMessage = {
            MessageId: this.state.messageId,
            Body: this.tryParseJson(this.state.body),
            Attributes: this.state.attributes,
            ReceiptHandle: this.state.receiptHandle
        };
        ui.CopyToClipboard(JSON.stringify(fullMessage, null, 2));
        ui.showInfoMessage('Full message copied to clipboard');
    }
    formatBody() {
        try {
            const parsed = JSON.parse(this.state.body);
            this.state.body = JSON.stringify(parsed, null, 2);
            this.render();
        }
        catch {
            ui.showInfoMessage('Body is not valid JSON, cannot format');
        }
    }
    tryParseJson(str) {
        try {
            return JSON.parse(str);
        }
        catch {
            return str;
        }
    }
    escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    getHtml(webview) {
        const nonce = this.getNonce();
        const codiconsUri = ui.getUri(webview, this.extensionUri, ["node_modules", "@vscode", "codicons", "dist", "codicon.css"]);
        const styleUri = ui.getUri(webview, this.extensionUri, ["media", "sqs", "style.css"]);
        // Format body for display
        let formattedBody = this.state.body;
        let isJson = false;
        try {
            const parsed = JSON.parse(this.state.body);
            formattedBody = JSON.stringify(parsed, null, 2);
            isJson = true;
        }
        catch {
            // Keep as-is
        }
        // Build attributes table
        let attributesHtml = '';
        const attrEntries = Object.entries(this.state.attributes);
        if (attrEntries.length > 0) {
            attributesHtml = '<div class="section"><div class="section-title">Message Attributes</div><table class="attributes-table"><tbody>';
            for (const [key, value] of attrEntries) {
                attributesHtml += `<tr><td class="attr-key">${this.escapeHtml(key)}</td><td class="attr-value">${this.escapeHtml(value)}</td></tr>`;
            }
            attributesHtml += '</tbody></table></div>';
        }
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
    <link href="${codiconsUri}" rel="stylesheet" />
    <link href="${styleUri}" rel="stylesheet" />
    <title>SQS Message</title>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SQS Message</h1>
            <div class="subtitle">Message ID: ${this.escapeHtml(this.state.messageId)}</div>
        </div>

        <div class="toolbar">
            <button type="button" class="toolbar-button" onclick="copyBody()">
                <i class="codicon codicon-copy"></i> Copy Body
            </button>
            <button type="button" class="toolbar-button" onclick="copyMessageId()">
                <i class="codicon codicon-key"></i> Copy ID
            </button>
            <button type="button" class="toolbar-button" onclick="copyAll()">
                <i class="codicon codicon-files"></i> Copy All
            </button>
            ${isJson ? `
            <button type="button" class="toolbar-button" onclick="formatBody()">
                <i class="codicon codicon-json"></i> Format JSON
            </button>
            ` : ''}
        </div>

        <div class="section">
            <div class="section-title">Message Body</div>
            <pre class="message-body ${isJson ? 'json' : ''}">${this.escapeHtml(formattedBody)}</pre>
        </div>

        ${attributesHtml}

        <div class="section">
            <div class="section-title">Receipt Handle</div>
            <pre class="receipt-handle">${this.escapeHtml(this.state.receiptHandle)}</pre>
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();

        function copyBody() {
            vscode.postMessage({ command: 'copyBody' });
        }

        function copyMessageId() {
            vscode.postMessage({ command: 'copyMessageId' });
        }

        function copyAll() {
            vscode.postMessage({ command: 'copyAll' });
        }

        function formatBody() {
            vscode.postMessage({ command: 'formatBody' });
        }
    </script>
</body>
</html>`;
    }
}
exports.SQSMessageView = SQSMessageView;
//# sourceMappingURL=SQSMessageView.js.map