/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import * as ui from "../common/UI";
import * as api from "./API";

interface EditItemViewState {
    region: string;
    tableName: string;
    tableDetails: api.TableDetails;
    item: any;
}

export class DynamoDBEditItemView {
    public static Current: DynamoDBEditItemView | undefined;
    private readonly panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];
    private extensionUri: vscode.Uri;
    private state: EditItemViewState;
    private onItemUpdatedCallback?: () => void;

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        region: string,
        tableName: string,
        tableDetails: api.TableDetails,
        item: any,
        onItemUpdated?: () => void
    ) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.state = { region, tableName, tableDetails, item };
        this.onItemUpdatedCallback = onItemUpdated;

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.onDidReceiveMessage(this.handleMessage.bind(this), null, this.disposables);
        this.render();
    }

    public static Render(
        extensionUri: vscode.Uri,
        region: string,
        tableName: string,
        tableDetails: api.TableDetails,
        item: any,
        onItemUpdated?: () => void
    ) {
        ui.logToOutput(`DynamoDBEditItemView.Render ${tableName} @ ${region}`);
        
        if (DynamoDBEditItemView.Current) {
            DynamoDBEditItemView.Current.state = { region, tableName, tableDetails, item };
            DynamoDBEditItemView.Current.onItemUpdatedCallback = onItemUpdated;
            DynamoDBEditItemView.Current.panel.title = `Edit Item: ${tableName}`;
            DynamoDBEditItemView.Current.panel.reveal(vscode.ViewColumn.One);
            DynamoDBEditItemView.Current.render();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            "DynamoDBEditItemView",
            `Edit Item: ${tableName}`,
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        DynamoDBEditItemView.Current = new DynamoDBEditItemView(panel, extensionUri, region, tableName, tableDetails, item, onItemUpdated);
    }

    private dispose() {
        DynamoDBEditItemView.Current = undefined;
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
            case "updateItem":
                await this.updateItem(message.updates, message.removals);
                return;
            case "cancel":
                this.panel.dispose();
                return;
        }
    }

    private async updateItem(updates: any[], removals: string[]) {
        try {
            ui.logToOutput('DynamoDBEditItemView: Updating item');

            const details = this.state.tableDetails;
            
            // Build key
            const key: any = {};
            key[details.partitionKey!.name] = this.state.item[details.partitionKey!.name];
            if (details.sortKey) {
                key[details.sortKey.name] = this.state.item[details.sortKey.name];
            }

            // Build update expression
            const setExpressions: string[] = [];
            const removeExpressions: string[] = [];
            const expressionAttributeValues: any = {};
            const expressionAttributeNames: any = {};

            let valueCounter = 0;
            let nameCounter = 0;

            for (const update of updates) {
                if (update.name && update.value !== undefined && update.value !== '') {
                    const namePlaceholder = `#n${nameCounter++}`;
                    const valuePlaceholder = `:v${valueCounter++}`;
                    expressionAttributeNames[namePlaceholder] = update.name;
                    expressionAttributeValues[valuePlaceholder] = api.toDynamoDBValue(update.value, update.type);
                    setExpressions.push(`${namePlaceholder} = ${valuePlaceholder}`);
                }
            }

            for (const removal of removals) {
                const namePlaceholder = `#n${nameCounter++}`;
                expressionAttributeNames[namePlaceholder] = removal;
                removeExpressions.push(namePlaceholder);
            }

            if (setExpressions.length === 0 && removeExpressions.length === 0) {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: 'No changes to save'
                });
                return;
            }

            let updateExpression = '';
            if (setExpressions.length > 0) {
                updateExpression += `SET ${setExpressions.join(', ')}`;
            }
            if (removeExpressions.length > 0) {
                if (updateExpression) { updateExpression += ' '; }
                updateExpression += `REMOVE ${removeExpressions.join(', ')}`;
            }

            const result = await api.UpdateItem(
                this.state.region,
                this.state.tableName,
                key,
                updateExpression,
                Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
                expressionAttributeNames
            );

            if (result.isSuccessful) {
                if (this.onItemUpdatedCallback) {
                    this.onItemUpdatedCallback();
                }
                this.panel.dispose();
            } else {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: result.error?.message || 'Failed to update item'
                });
            }
        } catch (error: any) {
            ui.logToOutput('DynamoDBEditItemView: Error updating item', error);
            this.panel.webview.postMessage({
                command: 'error',
                message: error.message || 'An unexpected error occurred'
            });
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

    private itemToAttributes(): { name: string; type: string; value: string; isKey: boolean }[] {
        const details = this.state.tableDetails;
        const item = this.state.item;
        const attributes: { name: string; type: string; value: string; isKey: boolean }[] = [];

        for (const [name, dynamoValue] of Object.entries(item)) {
            const value = dynamoValue as any;
            const type = Object.keys(value)[0];
            const val = value[type];
            
            const isKey = name === details.partitionKey?.name || name === details.sortKey?.name;
            
            let displayValue: string;
            if (type === 'NULL') {
                displayValue = '';
            } else if (type === 'M' || type === 'L' || type === 'SS' || type === 'NS' || type === 'BS') {
                displayValue = JSON.stringify(val);
            } else if (type === 'BOOL') {
                displayValue = val ? 'true' : 'false';
            } else {
                displayValue = String(val);
            }

            attributes.push({ name, type, value: displayValue, isKey });
        }

        // Sort: keys first, then alphabetically
        return attributes.sort((a, b) => {
            if (a.isKey && !b.isKey) { return -1; }
            if (!a.isKey && b.isKey) { return 1; }
            if (a.name === details.partitionKey?.name) { return -1; }
            if (b.name === details.partitionKey?.name) { return 1; }
            return a.name.localeCompare(b.name);
        });
    }

    private getHtml(webview: vscode.Webview): string {
        const nonce = this.getNonce();
        const details = this.state.tableDetails;
        const codiconsUri = ui.getUri(webview, this.extensionUri, ["node_modules", "@vscode", "codicons", "dist", "codicon.css"]);
        const styleUri = ui.getUri(webview, this.extensionUri, ["media", "dynamodb", "style.css"]);
        
        const attributes = this.itemToAttributes();
        const attributesJson = JSON.stringify(attributes);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
    <link href="${codiconsUri}" rel="stylesheet" />
    <link href="${styleUri}" rel="stylesheet" />
    <title>Edit Item: ${this.state.tableName}</title>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Edit Item</h1>
            <div class="subtitle">Table: ${this.state.tableName} | Region: ${this.state.region}</div>
        </div>

        <div class="error-message" id="errorMessage"></div>

        <form id="editItemForm">
            <div class="section">
                <div class="section-header-row">
                    <div class="section-title">Attributes</div>
                    <button type="button" id="addAttrBtn" class="btn-secondary">➕ Add Attribute</button>
                </div>
                
                <div id="attributesList"></div>
            </div>

            <div class="section">
                <div class="button-group">
                    <button type="button" id="cancelBtn" class="btn-secondary">Cancel</button>
                    <button type="submit" id="saveBtn" class="btn-primary">💾 Save Changes</button>
                </div>
            </div>
        </form>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const pkName = "${details.partitionKey?.name || ''}";
        const skName = "${details.sortKey?.name || ''}";
        
        let attributes = ${attributesJson};
        let originalAttributes = JSON.parse(JSON.stringify(attributes));
        let removedAttributes = [];

        function renderAttributes() {
            const container = document.getElementById('attributesList');
            container.innerHTML = '';
            
            attributes.forEach((attr, idx) => {
                const row = document.createElement('div');
                row.className = 'attribute-row' + (attr.isKey ? ' key-attribute' : '');
                
                const isKeyField = attr.name === pkName || attr.name === skName;
                
                row.innerHTML = \`
                    <input type="text" value="\${escapeHtml(attr.name)}" \${attr.isKey || isKeyField ? 'disabled' : ''} onchange="updateAttr(\${idx}, 'name', this.value)" style="flex: 1;" placeholder="Attribute name">
                    <select onchange="updateAttr(\${idx}, 'type', this.value)" class="field-select" style="width: 100px;" \${attr.isKey ? 'disabled' : ''}>
                        <option value="S" \${attr.type === 'S' ? 'selected' : ''}>String</option>
                        <option value="N" \${attr.type === 'N' ? 'selected' : ''}>Number</option>
                        <option value="BOOL" \${attr.type === 'BOOL' ? 'selected' : ''}>Boolean</option>
                        <option value="NULL" \${attr.type === 'NULL' ? 'selected' : ''}>Null</option>
                        <option value="SS" \${attr.type === 'SS' ? 'selected' : ''}>String Set</option>
                        <option value="NS" \${attr.type === 'NS' ? 'selected' : ''}>Number Set</option>
                        <option value="M" \${attr.type === 'M' ? 'selected' : ''}>Map (JSON)</option>
                        <option value="L" \${attr.type === 'L' ? 'selected' : ''}>List (JSON)</option>
                    </select>
                    <input type="text" value="\${escapeHtml(attr.value)}" \${attr.isKey ? 'disabled' : ''} onchange="updateAttr(\${idx}, 'value', this.value)" style="flex: 2;" placeholder="Value" \${attr.type === 'NULL' ? 'disabled' : ''}>
                    \${attr.isKey ? '<span class="key-badge-inline">🔑 Key</span>' : '<button type="button" class="btn-icon btn-remove" onclick="removeAttr(\${idx})" title="Remove">✕</button>'}
                \`;
                container.appendChild(row);
            });
        }

        function updateAttr(idx, field, value) {
            attributes[idx][field] = value;
            if (field === 'type') {
                renderAttributes();
            }
        }

        function removeAttr(idx) {
            const attr = attributes[idx];
            if (originalAttributes.find(a => a.name === attr.name)) {
                removedAttributes.push(attr.name);
            }
            attributes.splice(idx, 1);
            renderAttributes();
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        document.getElementById('addAttrBtn').addEventListener('click', () => {
            attributes.push({ name: '', type: 'S', value: '', isKey: false });
            renderAttributes();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'cancel' });
        });

        document.getElementById('editItemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            hideError();

            // Collect non-key attribute updates
            const updates = attributes
                .filter(a => !a.isKey && a.name)
                .map(a => ({ name: a.name, type: a.type, value: a.value }));

            vscode.postMessage({ 
                command: 'updateItem', 
                updates: updates,
                removals: removedAttributes
            });
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

        // Initial render
        renderAttributes();
    </script>
</body>
</html>`;
    }
}
