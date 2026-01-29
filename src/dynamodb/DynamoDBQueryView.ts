/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import * as ui from "../common/UI";
import * as api from "./API";

interface QueryViewState {
    region: string;
    tableName: string;
    tableDetails: api.TableDetails;
    selectedIndex?: string;
}

export class DynamoDBQueryView {
    public static Current: DynamoDBQueryView | undefined;
    private readonly panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];
    private extensionUri: vscode.Uri;
    private state: QueryViewState;
    private lastQueryParams: any;

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        region: string,
        tableName: string,
        tableDetails: api.TableDetails,
        selectedIndex?: string
    ) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.state = {
            region,
            tableName,
            tableDetails,
            selectedIndex
        };

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.onDidReceiveMessage(this.handleMessage.bind(this), null, this.disposables);
        this.render();
    }

    public static Render(
        extensionUri: vscode.Uri,
        region: string,
        tableName: string,
        tableDetails: api.TableDetails,
        selectedIndex?: string
    ) {
        ui.logToOutput(`DynamoDBQueryView.Render ${tableName} @ ${region}`);
        
        if (DynamoDBQueryView.Current) {
            DynamoDBQueryView.Current.state = { region, tableName, tableDetails, selectedIndex };
            DynamoDBQueryView.Current.panel.title = `Query: ${tableName}`;
            DynamoDBQueryView.Current.panel.reveal(vscode.ViewColumn.One);
            DynamoDBQueryView.Current.render();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            "DynamoDBQueryView",
            `Query: ${tableName}`,
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        DynamoDBQueryView.Current = new DynamoDBQueryView(panel, extensionUri, region, tableName, tableDetails, selectedIndex);
    }

    private dispose() {
        DynamoDBQueryView.Current = undefined;
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
            case "query":
                await this.executeQuery(message.params);
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

    private async executeQuery(params: any) {
        this.lastQueryParams = params;
        
        try {
            ui.logToOutput('DynamoDBQueryView: Querying table');

            const details = this.state.tableDetails;
            const selectedIndex = params.indexName;
            
            // Determine which key to use based on index selection
            let partitionKeyName: string;
            let partitionKeyType: string;
            let sortKeyName: string | undefined;
            let sortKeyType: string | undefined;

            if (selectedIndex && selectedIndex !== '') {
                // Find the index key schema
                const gsi = details.globalSecondaryIndexes?.find(i => i.name === selectedIndex);
                const lsi = details.localSecondaryIndexes?.find(i => i.name === selectedIndex);
                const indexSchema = gsi?.keySchema || lsi?.keySchema;

                if (indexSchema) {
                    const hashKey = indexSchema.find(k => k.keyType === 'HASH');
                    const rangeKey = indexSchema.find(k => k.keyType === 'RANGE');
                    partitionKeyName = hashKey?.name || details.partitionKey!.name;
                    partitionKeyType = hashKey?.type || details.partitionKey!.type;
                    sortKeyName = rangeKey?.name;
                    sortKeyType = rangeKey?.type;
                } else {
                    partitionKeyName = details.partitionKey!.name;
                    partitionKeyType = details.partitionKey!.type;
                    sortKeyName = details.sortKey?.name;
                    sortKeyType = details.sortKey?.type;
                }
            } else {
                partitionKeyName = details.partitionKey!.name;
                partitionKeyType = details.partitionKey!.type;
                sortKeyName = details.sortKey?.name;
                sortKeyType = details.sortKey?.type;
            }

            // Build key condition expression
            let keyConditionExpression = `${partitionKeyName} = :pkval`;
            let expressionAttributeValues: any = {
                ':pkval': api.toDynamoDBValue(params.partitionKeyValue, partitionKeyType)
            };

            // Add sort key condition if provided
            if (params.sortKeyValue && sortKeyName && sortKeyType) {
                if (params.sortKeyOperator === 'begins_with') {
                    keyConditionExpression += ` AND begins_with(${sortKeyName}, :skval)`;
                } else if (params.sortKeyOperator === 'between' && params.sortKeyValue2) {
                    keyConditionExpression += ` AND ${sortKeyName} BETWEEN :skval AND :skval2`;
                    expressionAttributeValues[':skval2'] = api.toDynamoDBValue(params.sortKeyValue2, sortKeyType);
                } else {
                    const op = params.sortKeyOperator || '=';
                    keyConditionExpression += ` AND ${sortKeyName} ${op} :skval`;
                }
                expressionAttributeValues[':skval'] = api.toDynamoDBValue(params.sortKeyValue, sortKeyType);
            }

            const result = await api.QueryTable(
                this.state.region,
                this.state.tableName,
                keyConditionExpression,
                expressionAttributeValues,
                selectedIndex || undefined,
                params.limit || 100
            );

            if (result.isSuccessful) {
                const items = result.result.Items || [];
                ui.logToOutput(`Query returned ${items.length} items`);
                
                this.panel.webview.postMessage({
                    command: 'queryResults',
                    items: items,
                    count: items.length,
                    scannedCount: result.result.ScannedCount || items.length
                });
            } else {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: result.error?.message || 'Query failed'
                });
            }
        } catch (error: any) {
            ui.logToOutput('DynamoDBQueryView: Error querying table', error);
            this.panel.webview.postMessage({
                command: 'error',
                message: error.message || 'An unexpected error occurred'
            });
        }
    }

    private async openEditItem(item: any) {
        try {
            const { DynamoDBEditItemView } = await import('./DynamoDBEditItemView');
            DynamoDBEditItemView.Render(
                this.extensionUri,
                this.state.region,
                this.state.tableName,
                this.state.tableDetails,
                item,
                () => {
                    if (this.lastQueryParams) {
                        this.executeQuery(this.lastQueryParams);
                    }
                }
            );
        } catch (error: any) {
            ui.logToOutput('DynamoDBQueryView: Error opening edit panel', error);
            this.panel.webview.postMessage({
                command: 'error',
                message: error.message || 'Failed to open edit panel'
            });
        }
    }

    private async deleteItem(item: any) {
        try {
            const confirm = await vscode.window.showWarningMessage(
                'Are you sure you want to delete this item?',
                { modal: true },
                'Delete'
            );
            
            if (confirm !== 'Delete') { return; }

            const key: any = {};
            const details = this.state.tableDetails;
            key[details.partitionKey!.name] = item[details.partitionKey!.name];
            if (details.sortKey) {
                key[details.sortKey.name] = item[details.sortKey.name];
            }

            const result = await api.DeleteItem(this.state.region, this.state.tableName, key);
            
            if (result.isSuccessful) {
                if (this.lastQueryParams) {
                    await this.executeQuery(this.lastQueryParams);
                }
            } else {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: result.error?.message || 'Failed to delete item'
                });
            }
        } catch (error: any) {
            ui.logToOutput('DynamoDBQueryView: Error deleting item', error);
            this.panel.webview.postMessage({
                command: 'error',
                message: error.message || 'An unexpected error occurred'
            });
        }
    }

    private async openAddItem() {
        try {
            const { DynamoDBAddItemView } = await import('./DynamoDBAddItemView');
            DynamoDBAddItemView.Render(
                this.extensionUri,
                this.state.region,
                this.state.tableName,
                this.state.tableDetails,
                () => {
                    if (this.lastQueryParams) {
                        this.executeQuery(this.lastQueryParams);
                    }
                }
            );
        } catch (error: any) {
            ui.logToOutput('DynamoDBQueryView: Error opening add panel', error);
            this.panel.webview.postMessage({
                command: 'error',
                message: error.message || 'Failed to open add item panel'
            });
        }
    }

    private async copyResults(items: any[]) {
        const json = JSON.stringify(items, null, 2);
        await vscode.env.clipboard.writeText(json);
        ui.showInfoMessage(`Copied ${items.length} items to clipboard`);
    }

    private async exportResults(items: any[]) {
        const json = JSON.stringify(items, null, 2);
        const uri = await vscode.window.showSaveDialog({
            filters: { 'JSON': ['json'] },
            defaultUri: vscode.Uri.file(`${this.state.tableName}_query_results.json`)
        });
        
        if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(json, 'utf8'));
            ui.showInfoMessage(`Exported ${items.length} items to ${uri.fsPath}`);
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

    private getHtml(webview: vscode.Webview): string {
        const nonce = this.getNonce();
        const details = this.state.tableDetails;
        const codiconsUri = ui.getUri(webview, this.extensionUri, ["node_modules", "@vscode", "codicons", "dist", "codicon.css"]);
        const styleUri = ui.getUri(webview, this.extensionUri, ["media", "dynamodb", "style.css"]);

        // Build index options
        let indexOptions = '<option value="">Table (default)</option>';
        if (details.globalSecondaryIndexes) {
            for (const gsi of details.globalSecondaryIndexes) {
                const selected = this.state.selectedIndex === gsi.name ? 'selected' : '';
                indexOptions += `<option value="${gsi.name}" ${selected}>GSI: ${gsi.name}</option>`;
            }
        }
        if (details.localSecondaryIndexes) {
            for (const lsi of details.localSecondaryIndexes) {
                const selected = this.state.selectedIndex === lsi.name ? 'selected' : '';
                indexOptions += `<option value="${lsi.name}" ${selected}>LSI: ${lsi.name}</option>`;
            }
        }

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
    <link href="${codiconsUri}" rel="stylesheet" />
    <link href="${styleUri}" rel="stylesheet" />
    <title>Query ${this.state.tableName}</title>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Query Table</h1>
            <div class="subtitle">Table: ${this.state.tableName} | Region: ${this.state.region}</div>
        </div>

        <div class="error-message" id="errorMessage"></div>

        <form id="queryForm">
            <div class="section">
                <div class="section-title">Query Parameters</div>
                
                <div class="field-group">
                    <label class="field-label">Index</label>
                    <select id="indexName" class="field-select">
                        ${indexOptions}
                    </select>
                </div>

                <div class="field-group">
                    <label class="field-label">
                        ${details.partitionKey?.name || 'Partition Key'}
                        <span class="key-badge">${details.partitionKey?.type || 'S'}</span>
                        <span class="key-badge">HASH</span>
                    </label>
                    <input type="text" id="partitionKeyValue" placeholder="Enter partition key value" required>
                </div>

                ${details.sortKey ? `
                <div class="field-group">
                    <label class="field-label">
                        ${details.sortKey.name}
                        <span class="key-badge">${details.sortKey.type}</span>
                        <span class="key-badge">RANGE</span>
                    </label>
                    <div class="sort-key-row">
                        <select id="sortKeyOperator" class="field-select" style="width: 120px;">
                            <option value="=">=</option>
                            <option value="<"><</option>
                            <option value="<="><=</option>
                            <option value=">">></option>
                            <option value=">=">>=</option>
                            <option value="begins_with">begins_with</option>
                            <option value="between">between</option>
                        </select>
                        <input type="text" id="sortKeyValue" placeholder="Sort key value (optional)" style="flex: 1;">
                        <input type="text" id="sortKeyValue2" placeholder="End value (for between)" style="flex: 1; display: none;">
                    </div>
                </div>
                ` : ''}

                <div class="field-group">
                    <label class="field-label">Limit</label>
                    <input type="number" id="limit" value="100" min="1" max="1000" style="width: 120px;">
                </div>

                <div class="button-group">
                    <button type="button" id="cancelBtn" class="btn-secondary">Close</button>
                    <button type="button" id="addItemBtn" class="btn-secondary">➕ New Item</button>
                    <button type="submit" id="queryBtn" class="btn-primary">🔍 Query</button>
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

        // Sort key operator change
        const sortKeyOperator = document.getElementById('sortKeyOperator');
        const sortKeyValue2 = document.getElementById('sortKeyValue2');
        if (sortKeyOperator && sortKeyValue2) {
            sortKeyOperator.addEventListener('change', () => {
                sortKeyValue2.style.display = sortKeyOperator.value === 'between' ? 'block' : 'none';
            });
        }

        // Form submission
        document.getElementById('queryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            hideError();
            
            const partitionKeyValue = document.getElementById('partitionKeyValue').value;
            if (!partitionKeyValue) {
                showError('Partition key value is required');
                return;
            }

            const params = {
                partitionKeyValue,
                sortKeyValue: document.getElementById('sortKeyValue')?.value || '',
                sortKeyValue2: document.getElementById('sortKeyValue2')?.value || '',
                sortKeyOperator: document.getElementById('sortKeyOperator')?.value || '=',
                indexName: document.getElementById('indexName')?.value || '',
                limit: parseInt(document.getElementById('limit').value) || 100
            };

            vscode.postMessage({ command: 'query', params });
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
                case 'queryResults':
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

            // Get all unique attribute names
            const allAttributes = new Set();
            items.forEach(item => Object.keys(item).forEach(key => allAttributes.add(key)));
            
            // Sort: PK first, SK second, then alphabetically
            const attributes = Array.from(allAttributes).sort((a, b) => {
                if (a === partitionKeyName) return -1;
                if (b === partitionKeyName) return 1;
                if (a === sortKeyName) return -1;
                if (b === sortKeyName) return 1;
                return a.localeCompare(b);
            });

            // Build header
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

            // Build body
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
