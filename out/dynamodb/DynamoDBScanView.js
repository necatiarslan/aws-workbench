"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBScanView = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const ui = require("../common/UI");
const api = require("./API");
class DynamoDBScanView {
    static Current;
    panel;
    disposables = [];
    extensionUri;
    state;
    lastScanParams;
    constructor(panel, extensionUri, region, tableName, tableDetails) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.state = { region, tableName, tableDetails };
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.onDidReceiveMessage(this.handleMessage.bind(this), null, this.disposables);
        this.render();
    }
    static Render(extensionUri, region, tableName, tableDetails) {
        ui.logToOutput(`DynamoDBScanView.Render ${tableName} @ ${region}`);
        if (DynamoDBScanView.Current) {
            DynamoDBScanView.Current.state = { region, tableName, tableDetails };
            DynamoDBScanView.Current.panel.title = `Scan: ${tableName}`;
            DynamoDBScanView.Current.panel.reveal(vscode.ViewColumn.One);
            DynamoDBScanView.Current.render();
            return;
        }
        const panel = vscode.window.createWebviewPanel("DynamoDBScanView", `Scan: ${tableName}`, vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
        DynamoDBScanView.Current = new DynamoDBScanView(panel, extensionUri, region, tableName, tableDetails);
    }
    dispose() {
        DynamoDBScanView.Current = undefined;
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
            case "scan":
                await this.executeScan(message.params);
                return;
            case "editItem":
                await this.openEditItem(message.item);
                return;
            case "deleteItem":
                await this.deleteItem(message.item);
                return;
            case "addItem":
                await this.openAddItem();
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
    async executeScan(params) {
        this.lastScanParams = params;
        try {
            ui.logToOutput('DynamoDBScanView: Scanning table');
            let filterExpression;
            let expressionAttributeValues;
            let expressionAttributeNames;
            // Build filter expression if provided
            if (params.filterAttribute && params.filterValue) {
                const attrPlaceholder = '#attr';
                const valuePlaceholder = ':val';
                expressionAttributeNames = { [attrPlaceholder]: params.filterAttribute };
                // Determine type from value
                let valueType = 'S';
                if (!isNaN(params.filterValue) && params.filterValue.trim() !== '') {
                    valueType = 'N';
                }
                else if (params.filterValue.toLowerCase() === 'true' || params.filterValue.toLowerCase() === 'false') {
                    valueType = 'BOOL';
                }
                expressionAttributeValues = {
                    [valuePlaceholder]: api.toDynamoDBValue(params.filterValue, valueType)
                };
                if (params.filterOperator === 'contains') {
                    filterExpression = `contains(${attrPlaceholder}, ${valuePlaceholder})`;
                }
                else if (params.filterOperator === 'begins_with') {
                    filterExpression = `begins_with(${attrPlaceholder}, ${valuePlaceholder})`;
                }
                else {
                    filterExpression = `${attrPlaceholder} ${params.filterOperator || '='} ${valuePlaceholder}`;
                }
            }
            const result = await api.ScanTable(this.state.region, this.state.tableName, params.limit || 100, filterExpression, expressionAttributeValues, undefined, expressionAttributeNames);
            if (result.isSuccessful) {
                const items = result.result.Items || [];
                ui.logToOutput(`Scan returned ${items.length} items`);
                this.panel.webview.postMessage({
                    command: 'scanResults',
                    items: items,
                    count: items.length,
                    scannedCount: result.result.ScannedCount || items.length
                });
            }
            else {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: result.error?.message || 'Scan failed'
                });
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBScanView: Error scanning table', error);
            this.panel.webview.postMessage({
                command: 'error',
                message: error.message || 'An unexpected error occurred'
            });
        }
    }
    async openEditItem(item) {
        try {
            const { DynamoDBEditItemView } = await Promise.resolve().then(() => require('./DynamoDBEditItemView'));
            DynamoDBEditItemView.Render(this.extensionUri, this.state.region, this.state.tableName, this.state.tableDetails, item, () => {
                if (this.lastScanParams) {
                    this.executeScan(this.lastScanParams);
                }
            });
        }
        catch (error) {
            ui.logToOutput('DynamoDBScanView: Error opening edit panel', error);
            this.panel.webview.postMessage({
                command: 'error',
                message: error.message || 'Failed to open edit panel'
            });
        }
    }
    async deleteItem(item) {
        try {
            const confirm = await vscode.window.showWarningMessage('Are you sure you want to delete this item?', { modal: true }, 'Delete');
            if (confirm !== 'Delete') {
                return;
            }
            const key = {};
            const details = this.state.tableDetails;
            key[details.partitionKey.name] = item[details.partitionKey.name];
            if (details.sortKey) {
                key[details.sortKey.name] = item[details.sortKey.name];
            }
            const result = await api.DeleteItem(this.state.region, this.state.tableName, key);
            if (result.isSuccessful) {
                if (this.lastScanParams) {
                    await this.executeScan(this.lastScanParams);
                }
            }
            else {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: result.error?.message || 'Failed to delete item'
                });
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBScanView: Error deleting item', error);
            this.panel.webview.postMessage({
                command: 'error',
                message: error.message || 'An unexpected error occurred'
            });
        }
    }
    async openAddItem() {
        try {
            const { DynamoDBAddItemView } = await Promise.resolve().then(() => require('./DynamoDBAddItemView'));
            DynamoDBAddItemView.Render(this.extensionUri, this.state.region, this.state.tableName, this.state.tableDetails, () => {
                if (this.lastScanParams) {
                    this.executeScan(this.lastScanParams);
                }
            });
        }
        catch (error) {
            ui.logToOutput('DynamoDBScanView: Error opening add panel', error);
            this.panel.webview.postMessage({
                command: 'error',
                message: error.message || 'Failed to open add item panel'
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
            defaultUri: vscode.Uri.file(`${this.state.tableName}_scan_results.json`)
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
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
    <link href="${codiconsUri}" rel="stylesheet" />
    <link href="${styleUri}" rel="stylesheet" />
    <title>Scan ${this.state.tableName}</title>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Scan Table</h1>
            <div class="subtitle">Table: ${this.state.tableName} | Region: ${this.state.region}</div>
        </div>

        <div class="error-message" id="errorMessage"></div>

        <form id="scanForm">
            <div class="section">
                <div class="section-title">Scan Parameters</div>
                
                <div class="field-group">
                    <label class="field-label">Filter (optional)</label>
                    <div class="filter-row">
                        <input type="text" id="filterAttribute" placeholder="Attribute name" style="flex: 1;">
                        <select id="filterOperator" class="field-select" style="width: 120px;">
                            <option value="=">=</option>
                            <option value="<>">≠</option>
                            <option value="<"><</option>
                            <option value="<=">≤</option>
                            <option value=">">></option>
                            <option value=">=">≥</option>
                            <option value="contains">contains</option>
                            <option value="begins_with">begins_with</option>
                        </select>
                        <input type="text" id="filterValue" placeholder="Value" style="flex: 1;">
                    </div>
                </div>

                <div class="field-group">
                    <label class="field-label">Limit</label>
                    <input type="number" id="limit" value="100" min="1" max="1000" style="width: 120px;">
                </div>

                <div class="button-group">
                    <button type="button" id="cancelBtn" class="btn-secondary">Close</button>
                    <button type="button" id="addItemBtn" class="btn-secondary">➕ New Item</button>
                    <button type="submit" id="scanBtn" class="btn-primary">🔍 Scan</button>
                </div>
            </div>
        </form>

        <div class="results-section" id="resultsSection">
            <div class="section">
                <div class="results-header">
                    <div class="results-count" id="resultsCount">Results: 0 items</div>
                    <div class="results-actions">
                        <button type="button" id="copyBtn" class="btn-secondary">📋 Copy JSON</button>
                        <button type="button" id="exportBtn" class="btn-secondary">💾 Export</button>
                    </div>
                </div>
                <div class="grid-container">
                    <table id="resultsTable">
                        <thead id="tableHeader"></thead>
                        <tbody id="tableBody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const partitionKeyName = "${details.partitionKey?.name || ''}";
        const sortKeyName = "${details.sortKey?.name || ''}";
        let currentResults = [];

        document.getElementById('scanForm').addEventListener('submit', (e) => {
            e.preventDefault();
            hideError();
            
            const params = {
                filterAttribute: document.getElementById('filterAttribute').value,
                filterOperator: document.getElementById('filterOperator').value,
                filterValue: document.getElementById('filterValue').value,
                limit: parseInt(document.getElementById('limit').value) || 100
            };

            vscode.postMessage({ command: 'scan', params });
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'cancel' });
        });

        document.getElementById('addItemBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'addItem' });
        });

        document.getElementById('copyBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'copyResults', items: currentResults });
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'exportResults', items: currentResults });
        });

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'scanResults':
                    displayResults(message.items, message.count, message.scannedCount);
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

        function displayResults(items, count, scannedCount) {
            currentResults = items;
            document.getElementById('resultsSection').classList.add('show');
            document.getElementById('resultsCount').textContent = 'Results: ' + count + ' items' + (scannedCount !== count ? ' (scanned: ' + scannedCount + ')' : '');

            if (items.length === 0) {
                document.getElementById('tableHeader').innerHTML = '';
                document.getElementById('tableBody').innerHTML = '<tr><td class="no-results">No items found</td></tr>';
                return;
            }

            const allAttributes = new Set();
            items.forEach(item => Object.keys(item).forEach(key => allAttributes.add(key)));
            
            const attributes = Array.from(allAttributes).sort((a, b) => {
                if (a === partitionKeyName) return -1;
                if (b === partitionKeyName) return 1;
                if (a === sortKeyName) return -1;
                if (b === sortKeyName) return 1;
                return a.localeCompare(b);
            });

            let headerHtml = '<tr>';
            headerHtml += '<th>Actions</th>';
            attributes.forEach(attr => {
                let badge = '';
                if (attr === partitionKeyName) badge = ' 🔑';
                else if (attr === sortKeyName) badge = ' 🔑';
                headerHtml += '<th>' + attr + badge + '</th>';
            });
            headerHtml += '</tr>';
            document.getElementById('tableHeader').innerHTML = headerHtml;

            let bodyHtml = '';
            items.forEach((item, idx) => {
                bodyHtml += '<tr>';
                bodyHtml += '<td class="action-buttons">';
                bodyHtml += '<button class="btn-icon" onclick="editItem(' + idx + ')" title="Edit">✏️</button>';
                bodyHtml += '<button class="btn-icon" onclick="deleteItem(' + idx + ')" title="Delete">🗑️</button>';
                bodyHtml += '</td>';
                attributes.forEach(attr => {
                    const value = item[attr];
                    bodyHtml += '<td>' + formatValue(value) + '</td>';
                });
                bodyHtml += '</tr>';
            });
            document.getElementById('tableBody').innerHTML = bodyHtml;
        }

        function formatValue(value) {
            if (!value) return '<span class="null-value">-</span>';
            const type = Object.keys(value)[0];
            const val = value[type];
            
            switch (type) {
                case 'NULL': return '<span class="null-value">NULL</span>';
                case 'S': return escapeHtml(String(val));
                case 'N': return '<span class="number-value">' + val + '</span>';
                case 'BOOL': return '<span class="bool-value">' + (val ? 'true' : 'false') + '</span>';
                case 'B': return '<span class="binary-value">[Binary]</span>';
                case 'SS': case 'NS': case 'BS':
                    return '<span class="set-value">' + escapeHtml(JSON.stringify(val)) + '</span>';
                case 'M': case 'L':
                    return '<span class="complex-value" title="' + escapeHtml(JSON.stringify(val)) + '">' + escapeHtml(JSON.stringify(val).substring(0, 50)) + (JSON.stringify(val).length > 50 ? '...' : '') + '</span>';
                default:
                    return escapeHtml(JSON.stringify(value));
            }
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function editItem(idx) {
            vscode.postMessage({ command: 'editItem', item: currentResults[idx] });
        }

        function deleteItem(idx) {
            vscode.postMessage({ command: 'deleteItem', item: currentResults[idx] });
        }
    </script>
</body>
</html>`;
    }
}
exports.DynamoDBScanView = DynamoDBScanView;
//# sourceMappingURL=DynamoDBScanView.js.map