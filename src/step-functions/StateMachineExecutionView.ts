import * as vscode from 'vscode';
import * as ui from '../common/UI';
import * as api from './API';
import { CloudWatchLogView } from '../cloudwatch-logs/CloudWatchLogView';
import { DescribeExecutionCommandOutput } from '@aws-sdk/client-sfn';
import { Session } from '../common/Session';

interface ExecutionState {
	name: string;
	type: string;
	status: string;
	duration: number;
	startDateTime: string;
    id: number;
    input?: string;
    output?: string;
}

export class StateMachineExecutionView {
	public static Current: StateMachineExecutionView;

	private _panel: vscode.WebviewPanel | undefined;
	private _extensionUri: vscode.Uri;
	private _executionArn: string;
	private _stepFuncArn: string;
	private _region: string;
	private _executionDetails: DescribeExecutionCommandOutput | undefined;
	private _executionInput: string = '';
	private _executionOutput: string = '';
	private _stateHistory: ExecutionState[] = [];
	private _isLoading: boolean = false;

	public static Render(executionArn: string, stepFuncArn: string, region: string) {
		ui.logToOutput('StateMachineExecutionView.Render Started');
		StateMachineExecutionView.Current = new StateMachineExecutionView(executionArn, stepFuncArn, region);
		StateMachineExecutionView.Current.Initialize();
	}

	constructor(executionArn: string, stepFuncArn: string, region: string) {
		this._extensionUri = Session.Current.ExtensionUri;
		this._executionArn = executionArn;
		this._stepFuncArn = stepFuncArn;
		this._region = region;
	}

	private _getExecutionName(): string {
		// Extract execution name from ARN: arn:aws:states:region:account-id:execution:state-machine-name:execution-name
		const parts = this._executionArn.split(':');
		return parts.length > 0 ? parts[parts.length - 1] : 'Unknown';
	}

	public async Initialize() {
		const executionName = this._getExecutionName();
		this._panel = vscode.window.createWebviewPanel(
			'stepFuncExecutionView',
			`Execution ${executionName}`,
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [
					vscode.Uri.joinPath(this._extensionUri, 'media', 'step-functions'),
					vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode-elements', 'elements', 'dist', 'bundled.js'),
				],
			}
		);

		this._panel.onDidDispose(() => {
			ui.logToOutput('StepFuncExecutionView disposed');
			this._panel = undefined;
		});

		this._setWebviewMessageListener(this._panel.webview);

		// Load execution data
		await this.LoadExecutionDetails();
		await this.LoadExecutionHistory();

		this.RenderHtml();
	}

	private async LoadExecutionDetails() {
		try {
			const result = await api.GetExecutionDetails(this._region, this._executionArn);
			if (result.isSuccessful && result.result) {
				this._executionDetails = result.result as DescribeExecutionCommandOutput;
				this._executionInput = result.result.input || '{}';
				this._executionOutput = result.result.output || '';
				ui.logToOutput('Execution details loaded successfully');
			}
		} catch (error: any) {
			ui.logToOutput('Error loading execution details', error);
		}
	}

	private async LoadExecutionHistory() {
		if (this._isLoading) return;
		this._isLoading = true;

		try {
			let allEvents: any[] = [];
			let nextToken: string | undefined;

			const result = await api.GetExecutionHistory(
				this._region,
				this._executionArn,
			);

			// Parse all state history from events
			this._parseStateHistory(result.result.events || []);
			ui.logToOutput(`Loaded ${allEvents.length} execution history events`);
		} catch (error: any) {
			ui.logToOutput('Error loading execution history', error);
		} finally {
			this._isLoading = false;
		}
	}

	private _parseStateHistory(events: any[]) {
		const stateMap: Map<string, ExecutionState> = new Map();
		const stateNameByResource: Map<string, string> = new Map(); // Map resource ARNs/names to state names
        const sortedEvents = events.sort((a, b) => (a.id || 0) - (b.id || 0));
        
		for (const event of sortedEvents) {
			const type = event.type;
			const timestamp = event.timestamp ? new Date(event.timestamp).toISOString() : '';

			if (type === 'TaskStateEntered' || type === 'PassStateEntered' || type === 'ChoiceStateEntered' || 
				type === 'WaitStateEntered' || type === 'SucceedStateEntered' || type === 'FailStateEntered' || 
				type === 'ParallelStateEntered' || type === 'MapStateEntered') {
				
				const details = (event as any).stateEnteredEventDetails || {};
				const stateName = details.name || 'Unknown';
				const stateType = this._extractStateType(type);

				if (!stateMap.has(stateName)) {
					const details = (event as any).stateEnteredEventDetails || {};
					stateMap.set(stateName, {
						name: stateName,
						type: stateType,
						status: 'Running',
						duration: 0,
						startDateTime: timestamp,
                        id: event.id || 0,
                        input: details.input || '{}'
					});
				}
			} else if (type === 'TaskStateExited' || type === 'PassStateExited' || type === 'ChoiceStateExited' || 
					   type === 'WaitStateExited' || type === 'SucceedStateExited' || type === 'FailStateExited' || 
					   type === 'ParallelStateExited' || type === 'MapStateExited') {
				
				const details = (event as any).stateExitedEventDetails || {};
				const stateName = details.name || 'Unknown';

				if (stateMap.has(stateName)) {
					const state = stateMap.get(stateName)!;
					state.status = 'Completed';
					const startTime = new Date(state.startDateTime).getTime();
					const endTime = new Date(timestamp).getTime();
					state.duration = Math.max(0, endTime - startTime);
					const details = (event as any).stateExitedEventDetails || {};
					state.output = details.output || '';
				}
			} else if (type === 'TaskFailed') {
				const details = (event as any).taskFailedEventDetails || {};
				const resource = details.resource || '';
				
				// Try to find the state by resource or use previous task state
				// Look for the most recently entered task state
				let matchedStateName: string | undefined;
				for (const [name, state] of stateMap) {
					if (state.status === 'Running' && (state.type === 'Task' || state.type === 'Task')) {
						matchedStateName = name;
						break;
					}
				}
				
				if (matchedStateName && stateMap.has(matchedStateName)) {
					const state = stateMap.get(matchedStateName)!;
					state.status = 'Failed';
					const startTime = new Date(state.startDateTime).getTime();
					const endTime = new Date(timestamp).getTime();
					state.duration = Math.max(0, endTime - startTime);
				}
			} else if (type === 'ActivityFailed') {
				const details = (event as any).activityFailedEventDetails || {};
				
				// Find the most recently entered task state
				let matchedStateName: string | undefined;
				for (const [name, state] of stateMap) {
					if (state.status === 'Running' && state.type === 'Task') {
						matchedStateName = name;
						break;
					}
				}
				
				if (matchedStateName && stateMap.has(matchedStateName)) {
					const state = stateMap.get(matchedStateName)!;
					state.status = 'Failed';
					const startTime = new Date(state.startDateTime).getTime();
					const endTime = new Date(timestamp).getTime();
					state.duration = Math.max(0, endTime - startTime);
				}
			} else if (type === 'LambdaFunctionFailed') {
				const details = (event as any).lambdaFunctionFailedEventDetails || {};
				
				// Find the most recently entered task state
				let matchedStateName: string | undefined;
				for (const [name, state] of stateMap) {
					if (state.status === 'Running' && state.type === 'Task') {
						matchedStateName = name;
						break;
					}
				}
				
				if (matchedStateName && stateMap.has(matchedStateName)) {
					const state = stateMap.get(matchedStateName)!;
					state.status = 'Failed';
					const startTime = new Date(state.startDateTime).getTime();
					const endTime = new Date(timestamp).getTime();
					state.duration = Math.max(0, endTime - startTime);
				}
			} else if (type === 'MapStateFailed' || type === 'ParallelStateFailed') {
				const details = (event as any).stateFailedEventDetails || {};
				const stateName = details.name || 'Unknown';

				if (stateMap.has(stateName)) {
					const state = stateMap.get(stateName)!;
					state.status = 'Failed';
					const startTime = new Date(state.startDateTime).getTime();
					const endTime = new Date(timestamp).getTime();
					state.duration = Math.max(0, endTime - startTime);
				}
			}
		}

		// Convert map to array and set as state history
		const newStates = Array.from(stateMap.values()).sort((a, b) => (a.id || 0) - (b.id || 0));
		this._stateHistory = newStates;
	}

	private _extractStateType(eventType: string): string {
		return eventType
			.replace('State', '')
			.replace('Entered', '')
			.replace('Exited', '');
	}

	private RenderHtml() {
		if (!this._panel) return;

		this._panel.webview.html = this._getHtmlContent();
	}

	private _getHtmlContent(): string {
		const styleUri = this._panel!.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'step-functions', 'style.css'));
		const mainUri = ui.getUri(this._panel!.webview, this._extensionUri, ['media', 'step-functions', 'main.js']);

		const executionStatus = this._executionDetails?.status || 'Unknown';
		const executionType = this._executionDetails?.stateMachineArn ? 'Standard' : 'Express';
		const error = (this._executionDetails as any)?.cause ? JSON.parse((this._executionDetails as any).cause).error || 'N/A' : 'N/A';
		const cause = (this._executionDetails as any)?.cause || 'N/A';
		const startTime = this._executionDetails?.startDate ? this._formatDateTime(this._executionDetails.startDate) : 'N/A';
		const stopTime = this._executionDetails?.stopDate ? this._formatDateTime(this._executionDetails.stopDate) : 'N/A';
		const duration = this._calculateDuration();

		// Format JSON for Monaco Editor
		const formattedInput = this._formatJson(this._executionInput);
		const formattedOutput = this._formatJson(this._executionOutput || '(No output)');

		const stateTableRows = this._stateHistory.map((state, index) => `
			<tr class="state-row" data-state-index="${index}">
				<td>
					${this._escapeHtml(state.name)}
					<div class="state-links">
						${state.input && state.input !== '{}' ? `<a class="state-link" data-type="input" data-state-index="${index}">input</a>` : '<span class="state-link disabled">input</span>'}
						<span class="link-separator">|</span>
						${state.output ? `<a class="state-link" data-type="output" data-state-index="${index}">output</a>` : '<span class="state-link disabled">output</span>'}
					</div>
				</td>
				<td>${this._escapeHtml(state.type)}</td>
				<td>${this._escapeHtml(state.status)}</td>
				<td>${this._formatDuration(state.duration)}</td>
				<td>${this._formatDateTime(state.startDateTime)}</td>
			</tr>
			<tr class="state-data-row" data-state-index="${index}" style="display: none;">
				<td colspan="5">
					<div class="state-data-editor" id="state-editor-${index}" style="height: 300px; border: 1px solid var(--vscode-panel-border); border-radius: 3px;"></div>
				</td>
			</tr>
		`).join('');

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this._panel!.webview.cspSource} 'unsafe-inline' https://cdn.jsdelivr.net; script-src ${this._panel!.webview.cspSource} 'unsafe-inline' https://cdn.jsdelivr.net; font-src ${this._panel!.webview.cspSource}; worker-src blob:;">
				<title>Execution ${this._escapeHtml(this._getExecutionName())}</title>
				<link rel="stylesheet" href="${styleUri}">
				<link rel="stylesheet" data-name="vs/editor/editor.main" href="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.main.css">
				<style>
					body {
						padding: 20px;
						font-family: var(--vscode-font-family);
						color: var(--vscode-foreground);
					}

					.header-section {
						margin-bottom: 30px;
					}

					.tabs {
						display: flex;
						gap: 10px;
						border-bottom: 1px solid var(--vscode-panel-border);
						margin-bottom: 20px;
					}

					.tab-button {
						padding: 10px 15px;
						background: transparent;
						border: none;
						color: var(--vscode-foreground);
						cursor: pointer;
						border-bottom: 2px solid transparent;
					}

					.tab-button.active {
						border-bottom-color: var(--vscode-focusBorder);
						color: var(--vscode-focusBorder);
					}

					.tab-content {
						display: none;
					}

					.tab-content.active {
						display: block;
					}

					.detail-grid {
						display: grid;
						grid-template-columns: 1fr 1fr;
						gap: 20px;
						margin-bottom: 20px;
					}

					.detail-item {
						display: flex;
						flex-direction: column;
						gap: 5px;
					}

					.detail-label {
						font-weight: bold;
						color: var(--vscode-foreground);
					}

					.detail-value {
						color: var(--vscode-foreground);
						word-break: break-all;
						font-family: 'Courier New', monospace;
						font-size: 12px;
					}

					.detail-value-wrap {
						white-space: normal;
						word-wrap: break-word;
					}

					.editor-container {
						width: 100%;
						height: 500px;
						border: 1px solid var(--vscode-panel-border);
						margin-bottom: 10px;
					}

					textarea {
						width: 100%;
						height: 400px;
						background: var(--vscode-input-background);
						color: var(--vscode-input-foreground);
						border: 1px solid var(--vscode-input-border);
						font-family: 'Courier New', monospace;
						font-size: 12px;
						padding: 10px;
						resize: vertical;
					}

					table {
						width: 100%;
						border-collapse: collapse;
						margin-bottom: 20px;
					}

					th {
						background: var(--vscode-list-hoverBackground);
						padding: 10px;
						text-align: left;
						font-weight: bold;
						border-bottom: 1px solid var(--vscode-panel-border);
					}

					td {
						padding: 10px;
						border-bottom: 1px solid var(--vscode-panel-border);
					}

					tr:hover {
						background: var(--vscode-list-hoverBackground);
					}

					.button-group {
						display: flex;
						gap: 10px;
						margin-top: 20px;
					}

					button {
						padding: 8px 16px;
						background: var(--vscode-button-background);
						color: var(--vscode-button-foreground);
						border: none;
						cursor: pointer;
						border-radius: 3px;
					}

					button:hover {
						background: var(--vscode-button-hoverBackground);
					}

					button:disabled {
						opacity: 0.5;
						cursor: not-allowed;
					}

					.loading {
						color: var(--vscode-descriptionForeground);
						font-style: italic;
					}

					.state-links {
						display: flex;
						gap: 5px;
						align-items: center;
						margin-top: 5px;
						font-size: 12px;
					}

					.state-link {
						color: var(--vscode-textLink-foreground);
						cursor: pointer;
						text-decoration: none;
					}

					.state-link:hover {
						text-decoration: underline;
					}

				.state-link.active {
					font-weight: bold;
				}


					.state-link.disabled:hover {
						text-decoration: none;
					}

					.link-separator {
						color: var(--vscode-descriptionForeground);
					}

					.state-data-container {
						padding: 10px;
						background: var(--vscode-editor-background);
						border: 1px solid var(--vscode-panel-border);
						border-radius: 3px;
						max-height: 400px;
						overflow: auto;
					}

					.state-data-header {
						font-weight: bold;
						margin-bottom: 8px;
						color: var(--vscode-foreground);
					}

					.state-data-content {
						font-family: 'Courier New', monospace;
						font-size: 12px;
						color: var(--vscode-foreground);
						white-space: pre-wrap;
						word-break: break-word;
					}
				</style>
			</head>
			<body>
				<div class="header-section">
					<h2>Execution ${this._escapeHtml(this._getExecutionName())}</h2>

					<div class="tabs">
						<button class="tab-button active" data-tab="status">Status</button>
						<button class="tab-button" data-tab="input">Input</button>
						<button class="tab-button" data-tab="output">Output</button>
						<button class="tab-button" data-tab="stateHistory">States</button>
					</div>

					<!-- Status Tab -->
					<div id="status" class="tab-content active">
						<div class="detail-grid">
							<div class="detail-item">
								<span class="detail-label">Status</span>
								<span class="detail-value">${this._escapeHtml(executionStatus)}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Execution Type</span>
								<span class="detail-value">${executionType}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Execution ARN</span>
								<span class="detail-value">${this._escapeHtml(this._executionArn)}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Error</span>
								<span class="detail-value">${this._escapeHtml(error)}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Start Time</span>
								<span class="detail-value">${startTime}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Cause</span>
								<span class="detail-value detail-value-wrap">${this._escapeHtml(cause)}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Stop Time</span>
								<span class="detail-value">${stopTime}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Duration</span>
								<span class="detail-value">${this._formatDuration(parseInt(duration))}</span>
							</div>
						</div>
						<button id="viewLogsBtn">View Execution Logs</button>
					</div>

					<!-- Input Tab -->
					<div id="input" class="tab-content">
						<div id="inputEditor" class="editor-container"></div>
					</div>

					<!-- Output Tab -->
					<div id="output" class="tab-content">
						<div id="outputEditor" class="editor-container"></div>
					</div>

					<!-- State History Tab -->
					<div id="stateHistory" class="tab-content">
						<table>
							<thead>
								<tr>
									<th>State Name</th>
									<th>Type</th>
									<th>Status</th>
									<th>Duration</th>
									<th>Start Time</th>
								</tr>
							</thead>
							<tbody>
								${stateTableRows}
							</tbody>
						</table>

						<div class="button-group">
							<button id="refreshBtn">Refresh</button>
						</div>
						${this._isLoading ? '<div class="loading">Loading...</div>' : ''}
					</div>
				</div>

				<script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"></script>
				<script>
					const vscode = acquireVsCodeApi();
					
					// Input and output data
					const inputData = ${JSON.stringify(formattedInput)};
					const outputData = ${JSON.stringify(formattedOutput)};
					
					// State history data for expandable rows
					const stateHistoryData = ${JSON.stringify(this._stateHistory)};
					
					let inputEditor, outputEditor;
					const stateEditors = {}; // Store state editors by index
					let theme = 'vs'; // Default theme

					// Configure Monaco Editor
					require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});
					
					require(['vs/editor/editor.main'], function () {
						// Detect VS Code theme
						const isDark = document.body.classList.contains('vscode-dark') || 
									   document.body.classList.contains('vscode-high-contrast');
						theme = isDark ? 'vs-dark' : 'vs';

						// Create Input Editor
						inputEditor = monaco.editor.create(document.getElementById('inputEditor'), {
							value: inputData,
							language: 'json',
							theme: theme,
							readOnly: true,
							minimap: { enabled: false },
							scrollBeyondLastLine: false,
							automaticLayout: true,
							fontSize: 13,
							wordWrap: 'on',
							lineNumbers: 'on',
							folding: true,
							renderWhitespace: 'selection',
							bracketPairColorization: { enabled: true }
						});

						// Create Output Editor
						outputEditor = monaco.editor.create(document.getElementById('outputEditor'), {
							value: outputData,
							language: 'json',
							theme: theme,
							readOnly: true,
							minimap: { enabled: false },
							scrollBeyondLastLine: false,
							automaticLayout: true,
							fontSize: 13,
							wordWrap: 'on',
							lineNumbers: 'on',
							folding: true,
							renderWhitespace: 'selection',
							bracketPairColorization: { enabled: true }
						});
					});

					// Tab switching
					document.querySelectorAll('.tab-button').forEach(btn => {
						btn.addEventListener('click', (e) => {
							const tabName = e.target.dataset.tab;
							
							// Deactivate all tabs
							document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
							document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
							
							// Activate selected tab
							e.target.classList.add('active');
							document.getElementById(tabName).classList.add('active');
							
							// Trigger layout update for Monaco editors when switching tabs
							setTimeout(() => {
								if (tabName === 'input' && inputEditor) {
									inputEditor.layout();
								} else if (tabName === 'output' && outputEditor) {
									outputEditor.layout();
								}
							}, 0);
						});
					});

					// Buttons
					document.getElementById('viewLogsBtn')?.addEventListener('click', () => {
						vscode.postMessage({ command: 'viewLogs' });
					});

					document.getElementById('refreshBtn')?.addEventListener('click', () => {
						vscode.postMessage({ command: 'refresh' });
					});

					// State input/output links
					document.querySelectorAll('.state-link:not(.disabled)').forEach(link => {
						link.addEventListener('click', (e) => {
							e.preventDefault();
							const stateIndex = parseInt(link.dataset.stateIndex);
							const dataType = link.dataset.type; // 'input' or 'output'
							const state = stateHistoryData[stateIndex];
							
							if (!state) return;
							
							const dataRow = document.querySelector(\`.state-data-row[data-state-index="\${stateIndex}"]\`);
							const editorContainer = document.getElementById(\`state-editor-\${stateIndex}\`);
							
							if (!editorContainer) return;
							
							// Toggle display
							if (dataRow.style.display === 'none') {
								const data = dataType === 'input' ? state.input : state.output;
								
								// Format JSON if possible
								let formattedData = data;
								try {
									formattedData = JSON.stringify(JSON.parse(data), null, 2);
								} catch (e) {
									// If not valid JSON, display as is
								}

								// Get or create editor for this state
								let editorKey = \`state-\${stateIndex}\`;
								if (!stateEditors[editorKey]) {
									stateEditors[editorKey] = monaco.editor.create(editorContainer, {
										value: formattedData,
										language: 'json',
										theme: theme,
										readOnly: true,
										minimap: { enabled: false },
										scrollBeyondLastLine: false,
										automaticLayout: true,
										fontSize: 12,
										wordWrap: 'on',
										lineNumbers: 'on',
										folding: true,
										renderWhitespace: 'selection',
										bracketPairColorization: { enabled: true }
									});
								} else {
									// Update content if switching between input/output
									stateEditors[editorKey].setValue(formattedData);
									stateEditors[editorKey].layout();
								}
								
								dataRow.style.display = 'table-row';
								link.classList.add('active');
							} else {
								dataRow.style.display = 'none';
								link.classList.remove('active');
							}
						});
					});
				</script>
			</body>
			</html>
		`;
	}

	private _setWebviewMessageListener(webview: vscode.Webview) {
		webview.onDidReceiveMessage(
			async (message: any) => {
				switch (message.command) {
					case 'viewLogs':
						await this._handleViewLogs();
						break;
					case 'refresh':
						await this._handleRefresh();
						break;
				}
			},
			null
		);
	}

	private async _handleViewLogs() {
		ui.logToOutput('StepFuncExecutionView: View Logs clicked');
		try {
			const logGroupName = await api.GetLogGroupNameFromArn(this._stepFuncArn);
			if (!logGroupName) {
				ui.showWarningMessage('Log Group not found for this Step Function');
				return;
			}

			const logStreamResult = await api.GetLatestLogStreamForExecution(this._region, logGroupName, this._executionArn);
			if (!logStreamResult.isSuccessful) {
				ui.showWarningMessage('Log Stream not found for this Step Function');
				return;
			}

			CloudWatchLogView.Render(this._region, logGroupName, logStreamResult.result);
		} catch (error: any) {
			ui.showErrorMessage('Error viewing logs', error);
		}
	}

	private async _handleRefresh() {
		ui.logToOutput('StepFuncExecutionView: Refresh clicked');
		this._stateHistory = [];
		await this.LoadExecutionDetails();
		await this.LoadExecutionHistory();
		this.RenderHtml();
	}

	private _calculateDuration(): string {
		if (!this._executionDetails?.startDate) return '0';
		
		const startTime = new Date(this._executionDetails.startDate).getTime();
		const endTime = this._executionDetails.stopDate 
			? new Date(this._executionDetails.stopDate).getTime()
			: new Date().getTime();
		
		return (endTime - startTime).toString();
	}

	private _formatDuration(milliseconds: number): string {
		if (!milliseconds || milliseconds === 0) return '0ms';

		const seconds = Math.floor(milliseconds / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		const parts: string[] = [];

		if (days > 0) {
			parts.push(`${days}d`);
		}
		if (hours % 24 > 0) {
			parts.push(`${hours % 24}h`);
		}
		if (minutes % 60 > 0) {
			parts.push(`${minutes % 60}m`);
		}
		if (seconds % 60 > 0) {
			parts.push(`${seconds % 60}s`);
		}
		if (parts.length === 0 && milliseconds < 1000) {
			parts.push(`${milliseconds}ms`);
		}

		return parts.join(' ');
	}

	private _formatDateTime(dateInput: Date | string): string {
		if (!dateInput) return 'N/A';
		
		const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
		
		if (isNaN(date.getTime())) return 'Invalid Date';

		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: true
		};

		return date.toLocaleString('en-US', options);
	}

	private _escapeHtml(text: string): string {
		if (!text) return '';
		const map: {[key: string]: string} = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};
		return text.replace(/[&<>"']/g, m => map[m]);
	}

	private _formatJson(jsonString: string): string {
		if (!jsonString) return '';
		try {
			const parsed = JSON.parse(jsonString);
			return JSON.stringify(parsed, null, 2);
		} catch (error) {
			// If not valid JSON, return as-is
			return jsonString;
		}
	}
}
