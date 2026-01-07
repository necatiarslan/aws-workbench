/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as api from '../common/API';
import * as ui from '../common/UI';

export class ScanTablePanel {
	public static currentPanel: ScanTablePanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];
	private readonly _region: string;
	private readonly _tableName: string;
	private readonly _tableDetails: api.TableDetails;

	public static async createOrShow(
		extensionUri: vscode.Uri,
		region: string,
		tableName: string,
		tableDetails: api.TableDetails
	) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it
		if (ScanTablePanel.currentPanel) {
			ScanTablePanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel
		const panel = vscode.window.createWebviewPanel(
			'scanDynamodbTable',
			`Scan: ${tableName}`,
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		ScanTablePanel.currentPanel = new ScanTablePanel(panel, extensionUri, region, tableName, tableDetails);
	}

	private constructor(
		panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
		region: string,
		tableName: string,
		tableDetails: api.TableDetails
	) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._region = region;
		this._tableName = tableName;
		this._tableDetails = tableDetails;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.command) {
					case 'scan':
						await this._handleScan(message.params);
						return;
					case 'editItem':
						await this._handleEditItem(message.item);
						return;
					case 'deleteItem':
						await this._handleDeleteItem(message.item);
						return;
					case 'rescan':
						await this._handleScan(message.params);
						return;
					case 'cancel':
						this._panel.dispose();
						return;
				}
			},
			null,
			this._disposables
		);
	}

	private _lastScanParams: any;

	private async _handleEditItem(item: any) {
		try {
			ui.logToOutput('ScanTablePanel: Opening edit panel for item');
			
			// Open the EditItemPanel
			const { EditItemPanel } = await import('./EditItemPanel');
			await EditItemPanel.createOrShow(
				this._extensionUri,
				this._region,
				this._tableName,
				this._tableDetails,
				item,
				() => {
					// Refresh scan results after edit
					if (this._lastScanParams) {
						this._handleScan(this._lastScanParams);
					}
				}
			);
		} catch (error: any) {
			ui.logToOutput('ScanTablePanel: Error opening edit panel', error);
			this._panel.webview.postMessage({
				command: 'error',
				message: error.message || 'Failed to open edit panel'
			});
		}
	}

	private async _handleDeleteItem(item: any) {
		try {
			ui.logToOutput('ScanTablePanel: Deleting item from DynamoDB');
			
			// Build key for the item
			const key: any = {};
			key[this._tableDetails.partitionKey!.name] = item[this._tableDetails.partitionKey!.name];
			if (this._tableDetails.sortKey) {
				key[this._tableDetails.sortKey.name] = item[this._tableDetails.sortKey.name];
			}

			// Delete the item
			const result = await api.DeleteItem(this._region, this._tableName, key);
			
			if (result.isSuccessful) {
				ui.showInfoMessage('Item deleted successfully!');
				// Refresh scan results
				if (this._lastScanParams) {
					await this._handleScan(this._lastScanParams);
				}
			} else {
				this._panel.webview.postMessage({
					command: 'error',
					message: result.error?.message || 'Failed to delete item'
				});
			}
		} catch (error: any) {
			ui.logToOutput('ScanTablePanel: Error deleting item', error);
			this._panel.webview.postMessage({
				command: 'error',
				message: error.message || 'An unexpected error occurred'
			});
		}
	}

	private async _handleScan(params: any) {
		this._lastScanParams = params;
		
		try {
			ui.logToOutput('ScanTablePanel: Scanning DynamoDB table');
			ui.logToOutput('Scan params: ' + JSON.stringify(params, null, 2));

			// Execute scan
			const result = await api.ScanTable(
				this._region,
				this._tableName,
				params.limit || 100
			);

			if (result.isSuccessful) {
				const items = result.result.Items || [];
				ui.logToOutput(`Scan returned ${items.length} items`);
				
				// Send results back to webview
				this._panel.webview.postMessage({
					command: 'scanResults',
					items: items,
					count: items.length,
					scannedCount: result.result.ScannedCount || items.length
				});
			} else {
				this._panel.webview.postMessage({
					command: 'error',
					message: result.error?.message || 'Scan failed'
				});
			}
		} catch (error: any) {
			ui.logToOutput('ScanTablePanel: Error scanning table', error);
			this._panel.webview.postMessage({
				command: 'error',
				message: error.message || 'An unexpected error occurred'
			});
		}
	}

	public dispose() {
		ScanTablePanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}

	private _update() {
		const webview = this._panel.webview;
		this._panel.webview.html = this._getHtmlForWebview(webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const nonce = getNonce();

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
	<title>Scan ${this._tableName}</title>
	<style>
		body {
			padding: 20px;
			font-family: var(--vscode-font-family);
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
		}
		.container {
			max-width: 1200px;
			margin: 0 auto;
		}
		.header {
			margin-bottom: 24px;
		}
		h1 {
			font-size: 24px;
			font-weight: 600;
			margin: 0 0 8px 0;
		}
		.subtitle {
			color: var(--vscode-descriptionForeground);
			font-size: 13px;
		}
		.warning-box {
			padding: 12px;
			margin-bottom: 16px;
			background-color: var(--vscode-inputValidation-warningBackground);
			border: 1px solid var(--vscode-inputValidation-warningBorder);
			color: var(--vscode-foreground);
			border-radius: 4px;
			font-size: 13px;
		}
		.section {
			margin-bottom: 24px;
			padding: 16px;
			background-color: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 4px;
		}
		.section-title {
			font-size: 14px;
			font-weight: 600;
			margin-bottom: 12px;
			color: var(--vscode-foreground);
		}
		.field-group {
			margin-bottom: 16px;
		}
		.field-label {
			display: block;
			margin-bottom: 6px;
			font-size: 13px;
			font-weight: 500;
		}
		input[type="number"] {
			width: 100%;
			padding: 6px 8px;
			background-color: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 2px;
			font-size: 13px;
			font-family: var(--vscode-font-family);
			box-sizing: border-box;
		}
		input:focus {
			outline: 1px solid var(--vscode-focusBorder);
			border-color: var(--vscode-focusBorder);
		}
		.button-group {
			display: flex;
			gap: 8px;
			margin-top: 16px;
		}
		button {
			padding: 6px 14px;
			font-size: 13px;
			font-family: var(--vscode-font-family);
			border: none;
			border-radius: 2px;
			cursor: pointer;
		}
		.btn-primary {
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
		}
		.btn-primary:hover {
			background-color: var(--vscode-button-hoverBackground);
		}
		.btn-secondary {
			background-color: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
		}
		.btn-secondary:hover {
			background-color: var(--vscode-button-secondaryHoverBackground);
		}
		.error-message {
			display: none;
			padding: 12px;
			margin-bottom: 16px;
			background-color: var(--vscode-inputValidation-errorBackground);
			border: 1px solid var(--vscode-inputValidation-errorBorder);
			color: var(--vscode-errorForeground);
			border-radius: 4px;
		}
		.error-message.show {
			display: block;
		}
		.results-section {
			display: none;
			margin-top: 24px;
		}
		.results-section.show {
			display: block;
		}
		.results-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 12px;
		}
		.results-count {
			font-size: 14px;
			font-weight: 600;
		}
		.grid-container {
			overflow-x: auto;
			border: 1px solid var(--vscode-input-border);
			border-radius: 4px;
			max-height: 600px;
			overflow-y: auto;
		}
		table {
			width: 100%;
			border-collapse: collapse;
			font-size: 13px;
		}
		th {
			background-color: var(--vscode-editor-inactiveSelectionBackground);
			color: var(--vscode-foreground);
			font-weight: 600;
			text-align: left;
			padding: 8px 12px;
			border-bottom: 1px solid var(--vscode-input-border);
			position: sticky;
			top: 0;
		}
		td {
			padding: 8px 12px;
			border-bottom: 1px solid var(--vscode-input-border);
		}
		tr:hover {
			background-color: var(--vscode-list-hoverBackground);
		}
		.no-results {
			text-align: center;
			padding: 40px;
			color: var(--vscode-descriptionForeground);
		}
		.json-value {
			font-family: var(--vscode-editor-font-family);
			font-size: 12px;
			color: var(--vscode-descriptionForeground);
		}
		.action-buttons {
			display: flex;
			gap: 4px;
		}
		.btn-icon {
			background-color: transparent;
			color: var(--vscode-foreground);
			padding: 4px 8px;
			font-size: 14px;
			border: 1px solid transparent;
		}
		.btn-icon:hover {
			background-color: var(--vscode-toolbar-hoverBackground);
			border-color: var(--vscode-input-border);
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Scan Table</h1>
			<div class="subtitle">Table: ${this._tableName} | Region: ${this._region}</div>
		</div>

		<div class="warning-box">
			⚠️ <strong>Warning:</strong> Scan operations read every item in the table and can be expensive for large tables. Consider using Query instead if you know the partition key.
		</div>

		<div class="error-message" id="errorMessage"></div>

		<form id="scanForm">
			<div class="section">
				<div class="section-title">Scan Parameters</div>
				
				<!-- Limit -->
				<div class="field-group" style="margin-bottom: 0;">
					<div style="display: flex; align-items: center; gap: 12px;">
						<label class="field-label" style="margin-bottom: 0; min-width: 60px;">
							Limit:
						</label>
						<input 
							type="number"
							id="limit" 
							value="100"
							min="1"
							max="1000"
							style="flex: 0 0 120px;"
							placeholder="1-1000">
						<div style="font-size: 12px; color: var(--vscode-descriptionForeground); flex: 1;">
							Maximum number of items to scan
						</div>
					</div>
				</div>

				<div class="button-group">
					<button type="button" id="cancelBtn" class="btn-secondary">Close</button>
					<button type="submit" id="scanBtn" class="btn-primary">🔍 Scan Table</button>
				</div>
			</div>
		</form>

		<!-- Results Section -->
		<div class="results-section" id="resultsSection">
			<div class="section">
				<div class="results-header">
					<div class="results-count" id="resultsCount">Results: 0 items</div>
					<button type="button" id="exportBtn" class="btn-secondary">📋 Copy JSON</button>
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
		const partitionKey = "${this._tableDetails.partitionKey?.name || ''}";
		const sortKey = "${this._tableDetails.sortKey?.name || ''}";
		let currentResults = [];

		// Form submission
		document.getElementById('scanForm').addEventListener('submit', async (e) => {
			e.preventDefault();
			
			const errorMessage = document.getElementById('errorMessage');
			errorMessage.classList.remove('show');
			
			const limit = parseInt(document.getElementById('limit').value) || 100;

			// Send scan request
			vscode.postMessage({
				command: 'scan',
				params: {
					limit
				}
			});
		});

		// Cancel button
		document.getElementById('cancelBtn').addEventListener('click', () => {
			vscode.postMessage({ command: 'cancel' });
		});

		// Export button
		document.getElementById('exportBtn').addEventListener('click', () => {
			const json = JSON.stringify(currentResults, null, 2);
			navigator.clipboard.writeText(json).then(() => {
				const msg = document.getElementById('errorMessage');
				msg.textContent = 'JSON copied to clipboard!';
				msg.style.backgroundColor = 'var(--vscode-inputValidation-infoBackground)';
				msg.style.borderColor = 'var(--vscode-inputValidation-infoBorder)';
				msg.classList.add('show');
				setTimeout(() => {
					msg.classList.remove('show');
					msg.style.backgroundColor = '';
					msg.style.borderColor = '';
				}, 2000);
			});
		});

		// Handle messages from extension
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

		// Event delegation for edit/delete buttons
		document.getElementById('tableBody').addEventListener('click', (e) => {
			const button = e.target.closest('button');
			if (!button) return;

			const action = button.getAttribute('data-action');
			const index = parseInt(button.getAttribute('data-index'));
			
			if (isNaN(index)) return;

			const item = currentResults[index];
			if (!item) return;

			if (action === 'edit') {
				vscode.postMessage({
					command: 'editItem',
					item: item
				});
			} else if (action === 'delete') {
				if (confirm('Are you sure you want to delete this item?')) {
					vscode.postMessage({
						command: 'deleteItem',
						item: item
					});
				}
			}
		});

		function displayResults(items, count, scannedCount) {
			currentResults = items;
			
			const resultsSection = document.getElementById('resultsSection');
			const resultsCount = document.getElementById('resultsCount');
			const tableHeader = document.getElementById('tableHeader');
			const tableBody = document.getElementById('tableBody');

			resultsCount.textContent = 'Results: ' + count + ' item' + (count !== 1 ? 's' : '') + 
				(scannedCount !== count ? ' (scanned ' + scannedCount + ')' : '');
			resultsSection.classList.add('show');

			if (items.length === 0) {
				tableHeader.innerHTML = '';
				tableBody.innerHTML = '<tr><td class="no-results">No items found</td></tr>';
				return;
			}

			// Get all unique attribute names
			const allAttributes = new Set();
			items.forEach(item => {
				Object.keys(item).forEach(key => allAttributes.add(key));
			});
			let attributes = Array.from(allAttributes);

			// Sort attributes: Partition Key, Sort Key, then others
			attributes.sort((a, b) => {
				if (a === partitionKey) return -1;
				if (b === partitionKey) return 1;
				if (a === sortKey) return -1;
				if (b === sortKey) return 1;
				return a.localeCompare(b);
			});

			// Create header
			tableHeader.innerHTML = '<tr>' + 
				'<th style="width: 50px;"></th>' +
				attributes.map(attr => {
					let content = attr;
					if (attr === partitionKey || attr === sortKey) {
						content += ' 🔑';
					}
					return '<th>' + content + '</th>';
				}).join('') +
				'</tr>';

			// Create rows
		tableBody.innerHTML = items.map((item, itemIndex) => {
			return '<tr>' + 
				'<td>' +
					'<button class="btn-icon" data-action="edit" data-index="' + itemIndex + '" title="Edit item">✏️</button>' +
				'</td>' +
				attributes.map(attr => {
					const value = item[attr];
					if (!value) return '<td></td>';
					
					// Extract DynamoDB value
					const type = Object.keys(value)[0];
					const val = value[type];
					
					// Format value
					let displayValue = '';
					if (type === 'NULL') {
						displayValue = 'NULL';
					} else if (type === 'S' || type === 'N' || type === 'BOOL') {
						displayValue = String(val);
					} else {
						displayValue = '<span class="json-value">' + JSON.stringify(val) + '</span>';
					}
					
					return '<td>' + displayValue + '</td>';
				}).join('') +
				'</tr>';
		}).join('');
		}

		function showError(message) {
			const errorMessage = document.getElementById('errorMessage');
			errorMessage.textContent = message;
			errorMessage.classList.add('show');
			errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	</script>
</body>
</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
