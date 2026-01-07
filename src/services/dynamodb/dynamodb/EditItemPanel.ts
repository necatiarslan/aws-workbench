/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as api from '../common/API';
import * as ui from '../common/UI';

export class EditItemPanel {
	public static currentPanel: EditItemPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];
	private readonly _region: string;
	private readonly _tableName: string;
	private readonly _tableDetails: api.TableDetails;
	private readonly _item: any;
	private readonly _onUpdate: () => void;

	public static async createOrShow(
		extensionUri: vscode.Uri,
		region: string,
		tableName: string,
		tableDetails: api.TableDetails,
		item: any,
		onUpdate: () => void
	) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// Close existing panel if any
		if (EditItemPanel.currentPanel) {
			EditItemPanel.currentPanel._panel.dispose();
		}

		// Create a new panel
		const panel = vscode.window.createWebviewPanel(
			'editDynamodbItem',
			`Edit Item: ${tableName}`,
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		EditItemPanel.currentPanel = new EditItemPanel(panel, extensionUri, region, tableName, tableDetails, item, onUpdate);
	}

	private constructor(
		panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
		region: string,
		tableName: string,
		tableDetails: api.TableDetails,
		item: any,
		onUpdate: () => void
	) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._region = region;
		this._tableName = tableName;
		this._tableDetails = tableDetails;
		this._item = item;
		this._onUpdate = onUpdate;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.command) {
					case 'ready':
						// Initialize webview with table details and item
						this._panel.webview.postMessage({
							command: 'init',
							tableDetails: {
								tableName: this._tableName,
								region: this._region,
								partitionKey: this._tableDetails.partitionKey,
								sortKey: this._tableDetails.sortKey
							},
							item: this._item
						});
						break;
					case 'updateItem':
						await this._handleUpdateItem(message.item);
						return;
					case 'cancel':
						this._panel.dispose();
						return;
					case 'deleteItem':
						await this._handleDeleteItem();
						return;
					case 'confirmDelete':
						// Show confirmation dialog
						const confirmed = await vscode.window.showWarningMessage(
							'Are you sure you want to delete this item? This action cannot be undone.',
							{ modal: true },
							'Delete Item'
						);
						if (confirmed === 'Delete Item') {
							this._panel.webview.postMessage({ command: 'deleteConfirmed' });
						}
						return;
				}
			},
			null,
			this._disposables
		);
	}

	private async _handleUpdateItem(updatedItem: any) {
		try {
			ui.logToOutput('EditItemPanel: Updating item in DynamoDB');
			ui.logToOutput('Updated item data: ' + JSON.stringify(updatedItem, null, 2));

			// Convert the item to DynamoDB format
			const dynamodbItem = this._convertToDynamoDBFormat(updatedItem);
			ui.logToOutput('DynamoDB format: ' + JSON.stringify(dynamodbItem, null, 2));

			// Build key for the item
			const key: any = {};
			key[this._tableDetails.partitionKey!.name] = dynamodbItem[this._tableDetails.partitionKey!.name];
			if (this._tableDetails.sortKey) {
				key[this._tableDetails.sortKey.name] = dynamodbItem[this._tableDetails.sortKey.name];
			}

			// Build update expression for non-key attributes
		const setExpressionParts: string[] = [];
		const removeExpressionParts: string[] = [];
		const expressionAttributeValues: any = {};
		let valueCounter = 0;

		// Find attributes to SET (update or add)
		for (const [attrName, attrValue] of Object.entries(dynamodbItem)) {
			// Skip key attributes
			if (attrName === this._tableDetails.partitionKey!.name) continue;
			if (this._tableDetails.sortKey && attrName === this._tableDetails.sortKey.name) continue;

			const valuePlaceholder = `:val${valueCounter}`;
			
			expressionAttributeValues[valuePlaceholder] = attrValue;
			setExpressionParts.push(`${attrName} = ${valuePlaceholder}`);
			valueCounter++;
		}

		// Find attributes to REMOVE (existed in original but not in updated)
		for (const [attrName] of Object.entries(this._item)) {
			// Skip key attributes
			if (attrName === this._tableDetails.partitionKey!.name) continue;
			if (this._tableDetails.sortKey && attrName === this._tableDetails.sortKey.name) continue;

			// If attribute was in original item but not in updated item, remove it
			if (!dynamodbItem.hasOwnProperty(attrName)) {
				removeExpressionParts.push(attrName);
			}
		}

		if (setExpressionParts.length === 0 && removeExpressionParts.length === 0) {
			this._panel.webview.postMessage({
				command: 'error',
				message: 'No attributes to update (only key attributes present)'
			});
			return;
		}

		// Build the update expression
		let updateExpression = '';
		if (setExpressionParts.length > 0) {
			updateExpression += 'SET ' + setExpressionParts.join(', ');
		}
		if (removeExpressionParts.length > 0) {
			if (updateExpression) updateExpression += ' ';
			updateExpression += 'REMOVE ' + removeExpressionParts.join(', ');
		}

		// Update the item
		const result = await api.UpdateItem(
			this._region,
			this._tableName,
			key,
			updateExpression,
			expressionAttributeValues
		);

			if (result.isSuccessful) {
				ui.showInfoMessage('Item updated successfully!');
				// Call the update callback
				this._onUpdate();
				// Close the panel on success
				this._panel.dispose();
			} else {
				this._panel.webview.postMessage({
					command: 'error',
					message: result.error?.message || 'Failed to update item'
				});
			}
		} catch (error: any) {
			ui.logToOutput('EditItemPanel: Error updating item', error);
			this._panel.webview.postMessage({
				command: 'error',
				message: error.message || 'An unexpected error occurred'
			});
		}
	}

	private async _handleDeleteItem() {
		try {
			ui.logToOutput('EditItemPanel: Deleting item');
			
			// Build key for the item
			const key: any = {};
			// Note: this._item is already in DynamoDB format (e.g. { pk: { S: "val" } })
			key[this._tableDetails.partitionKey!.name] = this._item[this._tableDetails.partitionKey!.name];
			if (this._tableDetails.sortKey) {
				key[this._tableDetails.sortKey.name] = this._item[this._tableDetails.sortKey.name];
			}

			const result = await api.DeleteItem(this._region, this._tableName, key);

			if (result.isSuccessful) {
				ui.showInfoMessage('Item deleted successfully!');
				this._onUpdate(); // Refresh parent
				this._panel.dispose();
			} else {
				this._panel.webview.postMessage({
					command: 'error',
					message: result.error?.message || 'Failed to delete item'
				});
			}
		} catch (error: any) {
			ui.logToOutput('EditItemPanel: Error deleting item', error);
			this._panel.webview.postMessage({
				command: 'error',
				message: error.message || 'An unexpected error occurred'
			});
		}
	}

	private _convertToDynamoDBFormat(item: any): any {
		const dynamodbItem: any = {};
		
		for (const [key, value] of Object.entries(item)) {
			const attr = value as any;
			dynamodbItem[key] = { [attr.type]: attr.value };
		}
		
		return dynamodbItem;
	}

	public dispose() {
		EditItemPanel.currentPanel = undefined;

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
		
		// Load HTML from file
		const htmlPath = path.join(__dirname, 'webview', 'editItem.html');
		let html = fs.readFileSync(htmlPath, 'utf8');
		
		// Replace placeholders
		html = html.replace(/\${cspSource}/g, webview.cspSource);
		html = html.replace(/\${nonce}/g, nonce);
		
		return html;
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
