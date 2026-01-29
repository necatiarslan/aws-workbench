"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBBatchView = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const ui = require("../common/UI");
const api = require("./API");
class DynamoDBBatchView {
    static Current;
    panel;
    disposables = [];
    extensionUri;
    state;
    constructor(panel, extensionUri, region, tableName, tableDetails, operationType) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.state = { region, tableName, tableDetails, operationType };
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.onDidReceiveMessage(this.handleMessage.bind(this), null, this.disposables);
        this.render();
    }
    static Render(extensionUri, region, tableName, tableDetails, operationType = 'get') {
        ui.logToOutput(`DynamoDBBatchView.Render ${tableName} @ ${region} - ${operationType}`);
        const title = operationType === 'get' ? `Batch Get: ${tableName}` : `Batch Write: ${tableName}`;
        if (DynamoDBBatchView.Current) {
            DynamoDBBatchView.Current.state = { region, tableName, tableDetails, operationType };
            DynamoDBBatchView.Current.panel.title = title;
            DynamoDBBatchView.Current.panel.reveal(vscode.ViewColumn.One);
            DynamoDBBatchView.Current.render();
            return;
        }
        const panel = vscode.window.createWebviewPanel("DynamoDBBatchView", title, vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
        DynamoDBBatchView.Current = new DynamoDBBatchView(panel, extensionUri, region, tableName, tableDetails, operationType);
    }
    dispose() {
        DynamoDBBatchView.Current = undefined;
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
            case "batchGet":
                await this.executeBatchGet(message.keys);
                return;
            case "batchWrite":
                await this.executeBatchWrite(message.requests);
                return;
            case "copyResults":
                await this.copyResults(message.items);
                return;
            case "exportResults":
                await this.exportResults(message.items);
                return;
            case "cancel":
                this.panel.dispose();
                return;
        }
    }
    async executeBatchGet(keysJson) {
        try {
            ui.logToOutput('DynamoDBBatchView: Executing batch get');
            let keys;
            try {
                keys = JSON.parse(keysJson);
            }
            catch (e) {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: 'Invalid JSON format for keys'
                });
                return;
            }
            if (!Array.isArray(keys) || keys.length === 0) {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: 'Keys must be a non-empty array'
                });
                return;
            }
            if (keys.length > 100) {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: 'Maximum 100 keys allowed per batch get request'
                });
                return;
            }
            const result = await api.BatchGetItem(this.state.region, this.state.tableName, keys);
            if (result.isSuccessful) {
                const items = result.result.Responses?.[this.state.tableName] || [];
                const unprocessed = result.result.UnprocessedKeys?.[this.state.tableName]?.Keys?.length || 0;
                this.panel.webview.postMessage({
                    command: 'batchGetResults',
                    items: items,
                    count: items.length,
                    unprocessedCount: unprocessed
                });
            }
            else {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: result.error?.message || 'Batch get failed'
                });
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBBatchView: Error in batch get', error);
            this.panel.webview.postMessage({
                command: 'error',
                message: error.message || 'An unexpected error occurred'
            });
        }
    }
    async executeBatchWrite(requestsJson) {
        try {
            ui.logToOutput('DynamoDBBatchView: Executing batch write');
            let requests;
            try {
                requests = JSON.parse(requestsJson);
            }
            catch (e) {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: 'Invalid JSON format for requests'
                });
                return;
            }
            if (!Array.isArray(requests) || requests.length === 0) {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: 'Requests must be a non-empty array'
                });
                return;
            }
            if (requests.length > 25) {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: 'Maximum 25 requests allowed per batch write'
                });
                return;
            }
            const result = await api.BatchWriteItem(this.state.region, this.state.tableName, requests);
            if (result.isSuccessful) {
                const unprocessed = result.result.UnprocessedItems?.[this.state.tableName]?.length || 0;
                this.panel.webview.postMessage({
                    command: 'batchWriteResults',
                    success: true,
                    unprocessedCount: unprocessed
                });
            }
            else {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: result.error?.message || 'Batch write failed'
                });
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBBatchView: Error in batch write', error);
            this.panel.webview.postMessage({
                command: 'error',
                message: error.message || 'An unexpected error occurred'
            });
        }
    }
    async copyResults(items) {
        const json = JSON.stringify(items, null, 2);
        await vscode.env.clipboard.writeText(json);
        ui.showInfoMessage(`Copied ${items.length} items to clipboard`);
    }
    async exportResults(items) {
        const json = JSON.stringify(items, null, 2);
        const uri = await vscode.window.showSaveDialog({
            filters: { 'JSON': ['json'] },
            defaultUri: vscode.Uri.file(`${this.state.tableName}_batch_results.json`)
        });
        if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(json, 'utf8'));
            ui.showInfoMessage(`Exported ${items.length} items to ${uri.fsPath}`);
        }
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
        const details = this.state.tableDetails;
        const codiconsUri = ui.getUri(webview, this.extensionUri, ["node_modules", "@vscode", "codicons", "dist", "codicon.css"]);
        const styleUri = ui.getUri(webview, this.extensionUri, ["media", "dynamodb", "style.css"]);
        const isGet = this.state.operationType === 'get';
        const title = isGet ? 'Batch Get Items' : 'Batch Write Items';
        // Example JSON for batch get
        const batchGetExample = details.sortKey
            ? `[
  { "${details.partitionKey?.name}": { "${details.partitionKey?.type}": "value1" }, "${details.sortKey.name}": { "${details.sortKey.type}": "sk1" } },
  { "${details.partitionKey?.name}": { "${details.partitionKey?.type}": "value2" }, "${details.sortKey.name}": { "${details.sortKey.type}": "sk2" } }
]`
            : `[
  { "${details.partitionKey?.name}": { "${details.partitionKey?.type}": "value1" } },
  { "${details.partitionKey?.name}": { "${details.partitionKey?.type}": "value2" } }
]`;
        // Example JSON for batch write (PutRequest)
        const batchWriteExample = `[
  { "PutRequest": { "Item": { "${details.partitionKey?.name}": { "${details.partitionKey?.type}": "value1" }${details.sortKey ? `, "${details.sortKey.name}": { "${details.sortKey.type}": "sk1" }` : ''}, "attr1": { "S": "data" } } } },
  { "DeleteRequest": { "Key": { "${details.partitionKey?.name}": { "${details.partitionKey?.type}": "value2" }${details.sortKey ? `, "${details.sortKey.name}": { "${details.sortKey.type}": "sk2" }` : ''} } } }
]`;
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
    <link href="${codiconsUri}" rel="stylesheet" />
    <link href="${styleUri}" rel="stylesheet" />
    <title>${title}: ${this.state.tableName}</title>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <div class="subtitle">Table: ${this.state.tableName} | Region: ${this.state.region}</div>
        </div>

        <div class="error-message" id="errorMessage"></div>
        <div class="success-message" id="successMessage"></div>

        <div class="section">
            <div class="section-title">${isGet ? 'Keys (JSON Array)' : 'Write Requests (JSON Array)'}</div>
            <div class="help-text">
                ${isGet
            ? `Enter an array of key objects (max 100). Each key must include the partition key${details.sortKey ? ' and sort key' : ''}.`
            : `Enter an array of PutRequest or DeleteRequest objects (max 25).`}
            </div>
            <textarea id="jsonInput" class="json-editor" rows="15" placeholder='${isGet ? batchGetExample : batchWriteExample}'></textarea>
        </div>

        <div class="section">
            <div class="button-group">
                <button type="button" id="cancelBtn" class="btn-secondary">Close</button>
                <button type="button" id="executeBtn" class="btn-primary">🚀 Execute</button>
            </div>
        </div>

        ${isGet ? `
        <div class="results-section" id="resultsSection">
            <div class="section">
                <div class="results-header">
                    <div class="results-count" id="resultsCount">Results: 0 items</div>
                    <div class="results-actions">
                        <button type="button" id="copyBtn" class="btn-secondary">📋 Copy JSON</button>
                        <button type="button" id="exportBtn" class="btn-secondary">💾 Export</button>
                    </div>
                </div>
                <pre id="resultsJson" class="json-output"></pre>
            </div>
        </div>
        ` : ''}
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const isGet = ${isGet};
        let currentResults = [];

        document.getElementById('executeBtn').addEventListener('click', () => {
            hideError();
            hideSuccess();
            
            const jsonInput = document.getElementById('jsonInput').value;
            if (!jsonInput.trim()) {
                showError('Please enter JSON data');
                return;
            }

            if (isGet) {
                vscode.postMessage({ command: 'batchGet', keys: jsonInput });
            } else {
                vscode.postMessage({ command: 'batchWrite', requests: jsonInput });
            }
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'cancel' });
        });

        ${isGet ? `
        document.getElementById('copyBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'copyResults', items: currentResults });
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'exportResults', items: currentResults });
        });
        ` : ''}

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'batchGetResults':
                    currentResults = message.items;
                    document.getElementById('resultsSection').classList.add('show');
                    document.getElementById('resultsCount').textContent = 
                        'Results: ' + message.count + ' items' + 
                        (message.unprocessedCount > 0 ? ' (' + message.unprocessedCount + ' unprocessed)' : '');
                    document.getElementById('resultsJson').textContent = JSON.stringify(message.items, null, 2);
                    break;
                case 'batchWriteResults':
                    if (message.success) {
                        let msg = 'Batch write completed successfully!';
                        if (message.unprocessedCount > 0) {
                            msg += ' (' + message.unprocessedCount + ' unprocessed items)';
                        }
                        showSuccess(msg);
                    }
                    break;
                case 'error':
                    showError(message.message);
                    break;
            }
        });

        function showError(msg) {
            const el = document.getElementById('errorMessage');
            el.textContent = msg;
            el.classList.add('show');
        }

        function hideError() {
            document.getElementById('errorMessage').classList.remove('show');
        }

        function showSuccess(msg) {
            const el = document.getElementById('successMessage');
            el.textContent = msg;
            el.classList.add('show');
        }

        function hideSuccess() {
            document.getElementById('successMessage').classList.remove('show');
        }
    </script>
</body>
</html>`;
    }
}
exports.DynamoDBBatchView = DynamoDBBatchView;
//# sourceMappingURL=DynamoDBBatchView.js.map