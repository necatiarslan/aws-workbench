"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBAddItemView = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const ui = require("../common/UI");
const api = require("./API");
class DynamoDBAddItemView {
    static Current;
    panel;
    disposables = [];
    extensionUri;
    state;
    onItemAddedCallback;
    constructor(panel, extensionUri, region, tableName, tableDetails, onItemAdded) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.state = { region, tableName, tableDetails };
        this.onItemAddedCallback = onItemAdded;
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.onDidReceiveMessage(this.handleMessage.bind(this), null, this.disposables);
        this.render();
    }
    static Render(extensionUri, region, tableName, tableDetails, onItemAdded) {
        ui.logToOutput(`DynamoDBAddItemView.Render ${tableName} @ ${region}`);
        if (DynamoDBAddItemView.Current) {
            DynamoDBAddItemView.Current.state = { region, tableName, tableDetails };
            DynamoDBAddItemView.Current.onItemAddedCallback = onItemAdded;
            DynamoDBAddItemView.Current.panel.title = `Add Item: ${tableName}`;
            DynamoDBAddItemView.Current.panel.reveal(vscode.ViewColumn.One);
            DynamoDBAddItemView.Current.render();
            return;
        }
        const panel = vscode.window.createWebviewPanel("DynamoDBAddItemView", `Add Item: ${tableName}`, vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
        DynamoDBAddItemView.Current = new DynamoDBAddItemView(panel, extensionUri, region, tableName, tableDetails, onItemAdded);
    }
    dispose() {
        DynamoDBAddItemView.Current = undefined;
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
            case "addItem":
                await this.addItem(message.item);
                return;
            case "cancel":
                this.panel.dispose();
                return;
        }
    }
    async addItem(itemData) {
        try {
            ui.logToOutput('DynamoDBAddItemView: Adding item');
            // Convert to DynamoDB format
            const dynamodbItem = {};
            for (const attr of itemData.attributes) {
                if (attr.name && attr.value !== undefined && attr.value !== '') {
                    dynamodbItem[attr.name] = api.toDynamoDBValue(attr.value, attr.type);
                }
            }
            // Validate required keys
            const details = this.state.tableDetails;
            if (!dynamodbItem[details.partitionKey.name]) {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: `Partition key "${details.partitionKey.name}" is required`
                });
                return;
            }
            if (details.sortKey && !dynamodbItem[details.sortKey.name]) {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: `Sort key "${details.sortKey.name}" is required`
                });
                return;
            }
            const result = await api.PutItem(this.state.region, this.state.tableName, dynamodbItem);
            if (result.isSuccessful) {
                if (this.onItemAddedCallback) {
                    this.onItemAddedCallback();
                }
                this.panel.dispose();
            }
            else {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: result.error?.message || 'Failed to add item'
                });
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBAddItemView: Error adding item', error);
            this.panel.webview.postMessage({
                command: 'error',
                message: error.message || 'An unexpected error occurred'
            });
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
    <title>Add Item: ${this.state.tableName}</title>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Add Item</h1>
            <div class="subtitle">Table: ${this.state.tableName} | Region: ${this.state.region}</div>
        </div>

        <div class="error-message" id="errorMessage"></div>

        <form id="addItemForm">
            <div class="section">
                <div class="section-title">Key Attributes</div>
                
                <div class="field-group">
                    <label class="field-label">
                        ${details.partitionKey?.name}
                        <span class="key-badge">${details.partitionKey?.type || 'S'}</span>
                        <span class="key-badge">HASH</span>
                        <span class="required-badge">Required</span>
                    </label>
                    <input type="text" id="pk-value" data-name="${details.partitionKey?.name}" data-type="${details.partitionKey?.type || 'S'}" required>
                </div>

                ${details.sortKey ? `
                <div class="field-group">
                    <label class="field-label">
                        ${details.sortKey.name}
                        <span class="key-badge">${details.sortKey.type}</span>
                        <span class="key-badge">RANGE</span>
                        <span class="required-badge">Required</span>
                    </label>
                    <input type="text" id="sk-value" data-name="${details.sortKey.name}" data-type="${details.sortKey.type}" required>
                </div>
                ` : ''}
            </div>

            <div class="section">
                <div class="section-header-row">
                    <div class="section-title">Additional Attributes</div>
                    <button type="button" id="addAttrBtn" class="btn-secondary">➕ Add Attribute</button>
                </div>
                
                <div id="attributesList"></div>
            </div>

            <div class="section">
                <div class="button-group">
                    <button type="button" id="cancelBtn" class="btn-secondary">Cancel</button>
                    <button type="submit" id="saveBtn" class="btn-primary">💾 Save Item</button>
                </div>
            </div>
        </form>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const pkName = "${details.partitionKey?.name || ''}";
        const pkType = "${details.partitionKey?.type || 'S'}";
        const skName = "${details.sortKey?.name || ''}";
        const skType = "${details.sortKey?.type || 'S'}";

        let additionalAttributes = [];
        let attrCounter = 0;

        function renderAttributes() {
            const container = document.getElementById('attributesList');
            container.innerHTML = '';
            
            additionalAttributes.forEach((attr, idx) => {
                const row = document.createElement('div');
                row.className = 'attribute-row';
                row.innerHTML = \`
                    <input type="text" placeholder="Attribute name" value="\${attr.name}" onchange="updateAttr(\${idx}, 'name', this.value)" style="flex: 1;">
                    <select onchange="updateAttr(\${idx}, 'type', this.value)" class="field-select" style="width: 100px;">
                        <option value="S" \${attr.type === 'S' ? 'selected' : ''}>String</option>
                        <option value="N" \${attr.type === 'N' ? 'selected' : ''}>Number</option>
                        <option value="BOOL" \${attr.type === 'BOOL' ? 'selected' : ''}>Boolean</option>
                        <option value="NULL" \${attr.type === 'NULL' ? 'selected' : ''}>Null</option>
                        <option value="SS" \${attr.type === 'SS' ? 'selected' : ''}>String Set</option>
                        <option value="NS" \${attr.type === 'NS' ? 'selected' : ''}>Number Set</option>
                        <option value="M" \${attr.type === 'M' ? 'selected' : ''}>Map (JSON)</option>
                        <option value="L" \${attr.type === 'L' ? 'selected' : ''}>List (JSON)</option>
                    </select>
                    <input type="text" placeholder="Value" value="\${escapeHtml(attr.value)}" onchange="updateAttr(\${idx}, 'value', this.value)" style="flex: 2;" \${attr.type === 'NULL' ? 'disabled' : ''}>
                    <button type="button" class="btn-icon btn-remove" onclick="removeAttr(\${idx})" title="Remove">✕</button>
                \`;
                container.appendChild(row);
            });
        }

        function updateAttr(idx, field, value) {
            additionalAttributes[idx][field] = value;
            if (field === 'type') {
                renderAttributes();
            }
        }

        function removeAttr(idx) {
            additionalAttributes.splice(idx, 1);
            renderAttributes();
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        document.getElementById('addAttrBtn').addEventListener('click', () => {
            additionalAttributes.push({ name: '', type: 'S', value: '' });
            renderAttributes();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'cancel' });
        });

        document.getElementById('addItemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            hideError();

            const attributes = [];
            
            // Add partition key
            const pkValue = document.getElementById('pk-value').value;
            attributes.push({ name: pkName, type: pkType, value: pkValue });
            
            // Add sort key if exists
            if (skName) {
                const skValue = document.getElementById('sk-value').value;
                attributes.push({ name: skName, type: skType, value: skValue });
            }
            
            // Add additional attributes
            additionalAttributes.forEach(attr => {
                if (attr.name) {
                    attributes.push(attr);
                }
            });

            vscode.postMessage({ command: 'addItem', item: { attributes } });
        });

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'error') {
                showError(message.message);
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
    </script>
</body>
</html>`;
    }
}
exports.DynamoDBAddItemView = DynamoDBAddItemView;
//# sourceMappingURL=DynamoDBAddItemView.js.map