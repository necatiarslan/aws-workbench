"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddItemPanel = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const api = require("../common/API");
const ui = require("../common/UI");
class AddItemPanel {
    static currentPanel;
    _panel;
    _extensionUri;
    _disposables = [];
    _region;
    _tableName;
    _tableDetails;
    _onItemAdded;
    static async createOrShow(extensionUri, region, tableName, tableDetails, onItemAdded) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it
        if (AddItemPanel.currentPanel) {
            AddItemPanel.currentPanel._panel.reveal(column);
            return;
        }
        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel('addDynamodbItem', `Add Item to ${tableName}`, column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        AddItemPanel.currentPanel = new AddItemPanel(panel, extensionUri, region, tableName, tableDetails, onItemAdded);
    }
    constructor(panel, extensionUri, region, tableName, tableDetails, onItemAdded) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._region = region;
        this._tableName = tableName;
        this._tableDetails = tableDetails;
        this._onItemAdded = onItemAdded;
        // Set the webview's initial html content
        this._update();
        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'ready':
                    // Initialize webview with table details
                    this._panel.webview.postMessage({
                        command: 'init',
                        tableDetails: {
                            tableName: this._tableName,
                            region: this._region,
                            partitionKey: this._tableDetails.partitionKey,
                            sortKey: this._tableDetails.sortKey
                        }
                    });
                    // Scan for sample item to populate attributes
                    this._scanForSampleItem();
                    break;
                case 'addItem':
                    await this._handleAddItem(message.item);
                    return;
                case 'cancel':
                    this._panel.dispose();
                    return;
            }
        }, null, this._disposables);
    }
    async _scanForSampleItem() {
        try {
            ui.logToOutput('AddItemPanel: Scanning table for sample item');
            const result = await api.ScanTable(this._region, this._tableName, 1);
            if (result.isSuccessful && result.result.Items && result.result.Items.length > 0) {
                const sampleItem = result.result.Items[0];
                const attributes = [];
                // Extract attributes (excluding primary keys)
                for (const [attrName, attrValue] of Object.entries(sampleItem)) {
                    if (attrName === this._tableDetails.partitionKey?.name)
                        continue;
                    if (attrName === this._tableDetails.sortKey?.name)
                        continue;
                    const dynamoValue = attrValue;
                    const type = Object.keys(dynamoValue)[0];
                    attributes.push({
                        name: attrName,
                        type: type
                    });
                }
                // Send attributes to webview
                if (attributes.length > 0) {
                    this._panel.webview.postMessage({
                        command: 'populateAttributes',
                        attributes: attributes
                    });
                }
            }
        }
        catch (error) {
            ui.logToOutput('AddItemPanel: Error scanning for sample item', error);
            // Don't show error to user, this is just a helper feature
        }
    }
    async _handleAddItem(item) {
        try {
            ui.logToOutput('AddItemPanel: Adding item to DynamoDB');
            ui.logToOutput('Item data: ' + JSON.stringify(item, null, 2));
            // Convert the item to DynamoDB format
            const dynamodbItem = this._convertToDynamoDBFormat(item);
            ui.logToOutput('DynamoDB format: ' + JSON.stringify(dynamodbItem, null, 2));
            // Add the item
            const result = await api.PutItem(this._region, this._tableName, dynamodbItem);
            if (result.isSuccessful) {
                ui.showInfoMessage('Item added successfully!');
                // Call the callback if provided
                if (this._onItemAdded) {
                    this._onItemAdded(dynamodbItem);
                }
                // Close the panel on success
                this._panel.dispose();
            }
            else {
                // Send error back to webview
                this._panel.webview.postMessage({
                    command: 'error',
                    message: result.error?.message || 'Failed to add item'
                });
            }
        }
        catch (error) {
            ui.logToOutput('AddItemPanel: Error adding item', error);
            this._panel.webview.postMessage({
                command: 'error',
                message: error.message || 'An unexpected error occurred'
            });
        }
    }
    _convertToDynamoDBFormat(item) {
        const dynamodbItem = {};
        for (const [key, value] of Object.entries(item)) {
            const attr = value;
            dynamodbItem[key] = { [attr.type]: attr.value };
        }
        return dynamodbItem;
    }
    dispose() {
        AddItemPanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
    _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }
    _getHtmlForWebview(webview) {
        const nonce = getNonce();
        // Load HTML from file
        const htmlPath = path.join(__dirname, 'webview', 'addItem.html');
        let html = fs.readFileSync(htmlPath, 'utf8');
        // Replace placeholders
        html = html.replace(/\${cspSource}/g, webview.cspSource);
        html = html.replace(/\${nonce}/g, nonce);
        return html;
    }
}
exports.AddItemPanel = AddItemPanel;
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=AddItemPanel.js.map