/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as api from '../common/API';
import * as ui from '../common/UI';

export class QueryTablePanel {
	public static currentPanel: QueryTablePanel | undefined;
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
		if (QueryTablePanel.currentPanel) {
			QueryTablePanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel
		const panel = vscode.window.createWebviewPanel(
			'queryDynamodbTable',
			`Query: ${tableName}`,
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		QueryTablePanel.currentPanel = new QueryTablePanel(panel, extensionUri, region, tableName, tableDetails);
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
					case 'query':
						await this._handleQuery(message.params);
						return;
					case 'editItem':
						await this._handleEditItem(message.item);
						return;
					case 'deleteItem':
						await this._handleDeleteItem(message.item);
						return;
					case 'addItem':
						await this._handleAddItem();
						return;
					case 'rescan':
						await this._handleQuery(message.params);
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

	private _lastQueryParams: any;

	private async _handleEditItem(item: any) {
		try {
			ui.logToOutput('QueryTablePanel: Opening edit panel for item');
			
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
					if (this._lastQueryParams) {
						this._handleQuery(this._lastQueryParams);
					}
				}
			);
		} catch (error: any) {
			ui.logToOutput('QueryTablePanel: Error opening edit panel', error);
			this._panel.webview.postMessage({
				command: 'error',
				message: error.message || 'Failed to open edit panel'
			});
		}
	}

	private async _handleDeleteItem(item: any) {
		try {
			ui.logToOutput('QueryTablePanel: Deleting item from DynamoDB');
			
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
				if (this._lastQueryParams) {
					await this._handleQuery(this._lastQueryParams);
				}
			} else {
				this._panel.webview.postMessage({
					command: 'error',
					message: result.error?.message || 'Failed to delete item'
				});
			}
		} catch (error: any) {
			ui.logToOutput('QueryTablePanel: Error deleting item', error);
			this._panel.webview.postMessage({
				command: 'error',
				message: error.message || 'An unexpected error occurred'
			});
		}
	}

	private async _handleAddItem() {
		try {
			ui.logToOutput('QueryTablePanel: Opening add item panel');
			
			// Open the AddItemPanel with a callback
			const { AddItemPanel } = await import('./AddItemPanel');
			await AddItemPanel.createOrShow(
				this._extensionUri,
				this._region,
				this._tableName,
				this._tableDetails,
				async (addedItem: any) => {
					// After item is added, query for it using the PK and SK values
					if (addedItem) {
						const pkValue = addedItem[this._tableDetails.partitionKey!.name];
						const pkType = Object.keys(pkValue)[0];
						const pkVal = pkValue[pkType];
						
						let skVal = '';
						if (this._tableDetails.sortKey) {
							const skValue = addedItem[this._tableDetails.sortKey.name];
							const skType = Object.keys(skValue)[0];
							skVal = skValue[skType];
						}
						
						// Send query command to webview to populate the form and execute query
						this._panel.webview.postMessage({
							command: 'executeQuery',
							partitionKeyValue: pkVal,
							sortKeyValue: skVal
						});
					}
				}
			);
		} catch (error: any) {
			ui.logToOutput('QueryTablePanel: Error opening add item panel', error);
			this._panel.webview.postMessage({
				command: 'error',
				message: error.message || 'Failed to open add item panel'
			});
		}
	}

	private async _handleQuery(params: any) {
		this._lastQueryParams = params;
		
		try {
			ui.logToOutput('QueryTablePanel: Querying DynamoDB table');
			ui.logToOutput('Query params: ' + JSON.stringify(params, null, 2));

			// Build key condition expression
			let keyConditionExpression = `${this._tableDetails.partitionKey!.name} = :pkval`;
			let expressionAttributeValues: any = {
				':pkval': { [this._tableDetails.partitionKey!.type]: params.partitionKeyValue }
			};

			// Add sort key condition if provided
			if (params.sortKeyValue && this._tableDetails.sortKey) {
				keyConditionExpression += ` AND ${this._tableDetails.sortKey.name} = :skval`;
				expressionAttributeValues[':skval'] = { [this._tableDetails.sortKey.type]: params.sortKeyValue };
			}

			// Execute query
			const result = await api.QueryTable(
				this._region,
				this._tableName,
				keyConditionExpression,
				expressionAttributeValues,
				undefined,
				params.limit || 100
			);

			if (result.isSuccessful) {
				const items = result.result.Items || [];
				ui.logToOutput(`Query returned ${items.length} items`);
				
				// Send results back to webview
				this._panel.webview.postMessage({
					command: 'queryResults',
					items: items,
					count: items.length
				});
			} else {
				this._panel.webview.postMessage({
					command: 'error',
					message: result.error?.message || 'Query failed'
				});
			}
		} catch (error: any) {
			ui.logToOutput('QueryTablePanel: Error querying table', error);
			this._panel.webview.postMessage({
				command: 'error',
				message: error.message || 'An unexpected error occurred'
			});
		}
	}

	public dispose() {
		QueryTablePanel.currentPanel = undefined;

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
	<title>Query ${this._tableName}</title>
	<style>
		body {
			padding: 20px;
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
		.error-message {
			padding: 12px;
			margin-bottom: 16px;
			background-color: var(--vscode-inputValidation-errorBackground);
			border: 1px solid var(--vscode-inputValidation-errorBorder);
			color: var(--vscode-foreground);
			border-radius: 4px;
			font-size: 13px;
			display: none;
		}
		.error-message.show {
			display: block;
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
		.key-badge {
			display: inline-block;
			padding: 2px 6px;
			border-radius: 3px;
			font-size: 11px;
			font-weight: 500;
			margin-left: 6px;
			background-color: var(--vscode-badge-background);
			color: var(--vscode-badge-foreground);
		}
		input[type="text"],
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
			justify-content: flex-end;
			margin-top: 20px;
		}
		button {
			padding: 6px 14px;
			border: none;
			border-radius: 2px;
			font-size: 13px;
			cursor: pointer;
			font-family: var(--vscode-font-family);
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
			font-size: 13px;
			font-weight: 500;
		}
		.grid-container {
			overflow-x: auto;
			border: 1px solid var(--vscode-panel-border);
			border-radius: 4px;
			max-height: 600px;
			overflow-y: auto;
		}
		table {
			width: 100%;
			border-collapse: collapse;
			font-size: 13px;
			min-width: 600px;
		}
		th, td {
			padding: 8px 12px;
			text-align: left;
			border-bottom: 1px solid var(--vscode-panel-border);
			white-space: nowrap;
			max-width: 300px;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		th {
			background-color: var(--vscode-editor-inactiveSelectionBackground);
			font-weight: 600;
			position: sticky;
			top: 0;
			z-index: 1;
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
			<h1>Query Table</h1>
			<div class="subtitle">Table: ${this._tableName} | Region: ${this._region}</div>
		</div>

		<div class="error-message" id="errorMessage"></div>

		<form id="queryForm">
			<div class="section">
				<div class="section-title">Query Parameters</div>
				
				<!-- Partition Key -->
				<div class="field-group">
					<div style="display: flex; align-items: center; gap: 12px;">
						<label class="field-label" style="margin-bottom: 0; min-width: 120px;">
							${this._tableDetails.partitionKey?.name || 'Partition Key'}:
							<span class="key-badge">${this._tableDetails.partitionKey?.type || 'S'}</span>
						</label>
						<input 
							type="text"
							id="partitionKeyValue" 
							style="flex: 1;"
							placeholder="Enter value"
							required>
					</div>
				</div>

				${this._tableDetails.sortKey ? `
				<!-- Sort Key (Optional) -->
				<div class="field-group">
					<div style="display: flex; align-items: center; gap: 12px;">
						<label class="field-label" style="margin-bottom: 0; min-width: 120px;">
							${this._tableDetails.sortKey.name}:
							<span class="key-badge">${this._tableDetails.sortKey.type}</span>
						</label>
						<input 
							type="text"
							id="sortKeyValue" 
							style="flex: 1;"
							placeholder="Optional - leave empty to match all">
					</div>
				</div>
				` : ''}

				<!-- Limit -->
				<div class="field-group" style="margin-bottom: 0;">
					<div style="display: flex; align-items: center; gap: 12px;">
						<label class="field-label" style="margin-bottom: 0; min-width: 120px;">
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
							Maximum number of items to return
						</div>
					</div>
				</div>

				<div class="button-group">
					<button type="button" id="cancelBtn" class="btn-secondary">Close</button>
					<button type="button" id="addItemBtn" class="btn-secondary">➕ New Item</button>
					<button type="submit" id="queryBtn" class="btn-primary">🔍 Query</button>
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
		document.getElementById('queryForm').addEventListener('submit', async (e) => {
			e.preventDefault();
			
			const errorMessage = document.getElementById('errorMessage');
			errorMessage.classList.remove('show');
			
			const partitionKeyValue = document.getElementById('partitionKeyValue').value;
			if (!partitionKeyValue) {
				showError('Partition key value is required');
				return;
			}

			const sortKeyValue = document.getElementById('sortKeyValue')?.value || '';
			const limit = parseInt(document.getElementById('limit').value) || 100;

			// Send query request
			vscode.postMessage({
				command: 'query',
				params: {
					partitionKeyValue,
					sortKeyValue,
					limit
				}
			});
		});

		// Cancel button
	document.getElementById('cancelBtn').addEventListener('click', () => {
		vscode.postMessage({ command: 'cancel' });
	});

	// Add Item button
	document.getElementById('addItemBtn').addEventListener('click', () => {
		vscode.postMessage({ command: 'addItem' });
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
			case 'queryResults':
				displayResults(message.items, message.count);
				break;
			case 'error':
				showError(message.message);
				break;
			case 'executeQuery':
				// Populate form fields and execute query
				document.getElementById('partitionKeyValue').value = message.partitionKeyValue || '';
				if (message.sortKeyValue !== undefined) {
					const sortKeyInput = document.getElementById('sortKeyValue');
					if (sortKeyInput) {
						sortKeyInput.value = message.sortKeyValue || '';
					}
				}
				// Trigger form submission
				document.getElementById('queryForm').dispatchEvent(new Event('submit'));
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

		function displayResults(items, count) {
			currentResults = items;
			
			const resultsSection = document.getElementById('resultsSection');
			const resultsCount = document.getElementById('resultsCount');
			const tableHeader = document.getElementById('tableHeader');
			const tableBody = document.getElementById('tableBody');

			resultsCount.textContent = 'Results: ' + count + ' item' + (count !== 1 ? 's' : '');
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
