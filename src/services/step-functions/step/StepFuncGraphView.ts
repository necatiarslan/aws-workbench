/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import * as ui from '../common/UI';
import * as fs from 'fs';
import { StepFuncStudioView } from './StepFuncStudioView';

export class StepFuncGraphView {
    public static Current: StepFuncGraphView | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private extensionUri: vscode.Uri;
    private aslDefinition: any;
    private stepFuncName: string;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, stepFuncName: string, aslDefinition: any) {
        ui.logToOutput('StepFuncGraphView.constructor Started');

        this.stepFuncName = stepFuncName;
        this.aslDefinition = aslDefinition;
        this.extensionUri = extensionUri;

        this._panel = panel;
        this._panel.onDidDispose(this.dispose, null, this._disposables);
        this.RenderHtml();
        ui.logToOutput('StepFuncGraphView.constructor Completed');
    }

    public async RenderHtml() {
        ui.logToOutput('StepFuncGraphView.RenderHtml Started');
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, this.extensionUri);
        ui.logToOutput('StepFuncGraphView.RenderHtml Completed');
    }

    public static async Render(extensionUri: vscode.Uri, stepFuncName: string, codePath: string) {
        ui.logToOutput('StepFuncGraphView.Render Started');
        
        try {
            // Read the ASL JSON file
            const fileContent = fs.readFileSync(codePath, 'utf8');
            const aslDefinition = JSON.parse(fileContent);

            if (StepFuncGraphView.Current) {
                StepFuncGraphView.Current.stepFuncName = stepFuncName;
                StepFuncGraphView.Current.aslDefinition = aslDefinition;
                StepFuncGraphView.Current.RenderHtml();
                StepFuncGraphView.Current._panel.reveal(vscode.ViewColumn.One);
            } else {
                const panel = vscode.window.createWebviewPanel(
                    "StepFuncGraphView", 
                    `Step Function Graph: ${stepFuncName}`, 
                    vscode.ViewColumn.One, 
                    {
                        enableScripts: true,
                        localResourceRoots: [
                            vscode.Uri.joinPath(extensionUri, 'node_modules'),
                            vscode.Uri.joinPath(extensionUri, 'media')
                        ]
                    }
                );

                StepFuncGraphView.Current = new StepFuncGraphView(panel, extensionUri, stepFuncName, aslDefinition);
            }
        } catch (error: any) {
            ui.logToOutput("StepFuncGraphView.Render Error !!!", error);
            ui.showErrorMessage('Failed to load Step Function definition', error);
        }
    }

    public static async RenderWorkflowStudio(extensionUri: vscode.Uri, stepFuncName: string, codePath: string) {
        ui.logToOutput('StepFuncGraphView.RenderWorkflowStudio Started');
        
        try {
            // Read the ASL JSON file
            const fileContent = fs.readFileSync(codePath, 'utf8');
            const aslDefinition = JSON.parse(fileContent);

            await StepFuncStudioView.Render(extensionUri, stepFuncName, aslDefinition);
        } catch (error: any) {
            ui.logToOutput("StepFuncGraphView.RenderWorkflowStudio Error !!!", error);
            ui.showErrorMessage('Failed to open Workflow Studio', error);
        }
    }

    private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
        ui.logToOutput('StepFuncGraphView._getWebviewContent Started');

        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "style.css"));
        const aslDataJson = JSON.stringify(this.aslDefinition);

        let result = /*html*/ `
	<!DOCTYPE html>
	<html lang="en">
	  <head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width,initial-scale=1.0">
		<link rel="stylesheet" href="${styleUri}">
		<title>Step Function Graph</title>
		<style>
			body {
				padding: 0;
				margin: 0;
				overflow: hidden;
				background-color: var(--vscode-editor-background);
				color: var(--vscode-editor-foreground);
				font-family: var(--vscode-font-family);
			}
			#header {
				padding: 15px 20px;
				background-color: var(--vscode-editor-background);
				border-bottom: 1px solid var(--vscode-panel-border);
				display: flex;
				justify-content: space-between;
				align-items: center;
			}
			h2 {
				margin: 0;
				color: var(--vscode-foreground);
				font-size: 16px;
			}
			.zoom-controls {
				display: flex;
				gap: 5px;
			}
			.zoom-btn {
				background-color: var(--vscode-button-background);
				color: var(--vscode-button-foreground);
				border: none;
				padding: 5px 12px;
				border-radius: 3px;
				cursor: pointer;
				font-size: 14px;
				transition: background-color 0.2s;
			}
			.zoom-btn:hover {
				background-color: var(--vscode-button-hoverBackground);
			}
			#graph-wrapper {
				width: 100%;
				height: calc(100vh - 120px);
				overflow: auto;
				position: relative;
			}
			#graph-container {
				width: 100%;
				height: 100%;
				display: flex;
				justify-content: center;
				align-items: flex-start;
				padding: 20px;
				transform-origin: top left;
			}
			.state-box {
				border: 2px solid var(--vscode-button-background);
				border-radius: 6px;
				padding: 8px 12px;
				margin: 5px;
				min-width: 100px;
				text-align: center;
				background-color: var(--vscode-editor-background);
				box-shadow: 0 1px 3px rgba(0,0,0,0.2);
				cursor: pointer;
				transition: all 0.2s;
			}
			.state-box:hover {
				transform: translateY(-2px);
				box-shadow: 0 3px 6px rgba(0,0,0,0.3);
				border-color: var(--vscode-button-hoverBackground);
			}
			.state-box.task {
				border-color: #4A90E2;
				background-color: rgba(74, 144, 226, 0.1);
			}
			.state-box.choice {
				border-color: #F5A623;
				background-color: rgba(245, 166, 35, 0.1);
			}
			.state-box.parallel {
				border-color: #7B68EE;
				background-color: rgba(123, 104, 238, 0.1);
			}
			.state-box.map {
				border-color: #9B59B6;
				background-color: rgba(155, 89, 182, 0.1);
			}
			.state-box.pass {
				border-color: #50C878;
				background-color: rgba(80, 200, 120, 0.1);
			}
			.state-box.wait {
				border-color: #FF6B6B;
				background-color: rgba(255, 107, 107, 0.1);
			}
			.state-box.succeed {
				border-color: #2ECC71;
				background-color: rgba(46, 204, 113, 0.1);
			}
			.state-box.fail {
				border-color: #E74C3C;
				background-color: rgba(231, 76, 60, 0.1);
			}
			.state-name {
				font-weight: bold;
				font-size: 12px;
				margin-bottom: 3px;
			}
			.state-type {
				font-size: 9px;
				opacity: 0.8;
				text-transform: uppercase;
			}
			.state-details {
				font-size: 8px;
				margin-top: 3px;
				opacity: 0.7;
			}
			svg {
				display: block;
			}
			.arrow {
				fill: none;
				stroke: var(--vscode-button-background);
				stroke-width: 2;
				marker-end: url(#arrowhead);
			}
			.arrow.error {
				stroke: #E74C3C;
				stroke-dasharray: 5,5;
			}
			.legend {
				margin-top: 20px;
				padding: 15px;
				border: 1px solid var(--vscode-panel-border);
				border-radius: 5px;
				background-color: var(--vscode-editor-background);
			}
			.legend-title {
				font-weight: bold;
				margin-bottom: 10px;
			}
			.legend-items {
				display: flex;
				flex-wrap: wrap;
				gap: 15px;
			}
			.legend-item {
				display: flex;
				align-items: center;
				gap: 8px;
			}
			.legend-color {
				width: 20px;
				height: 20px;
				border-radius: 3px;
				border: 2px solid;
			}
			.error-message {
				color: var(--vscode-errorForeground);
				padding: 15px;
				border: 1px solid var(--vscode-errorForeground);
				border-radius: 5px;
				margin: 20px 0;
			}
		</style>
	  </head>
	  <body>  
		<div id="header">
			<h2>Step Function: ${this.stepFuncName}</h2>
			<div class="zoom-controls">
				<button class="zoom-btn" onclick="zoomIn()">+</button>
				<button class="zoom-btn" onclick="zoomOut()">−</button>
				<button class="zoom-btn" onclick="resetZoom()">Reset</button>
			</div>
		</div>
		<div id="graph-wrapper">
			<div id="graph-container"></div>
		</div>
		<div id="legend" class="legend" style="display:none;">
			<div class="legend-title">State Types</div>
			<div class="legend-items">
				<div class="legend-item">
					<div class="legend-color" style="border-color: #4A90E2; background-color: rgba(74, 144, 226, 0.1);"></div>
					<span>Task</span>
				</div>
				<div class="legend-item">
					<div class="legend-color" style="border-color: #F5A623; background-color: rgba(245, 166, 35, 0.1);"></div>
					<span>Choice</span>
				</div>
				<div class="legend-item">
					<div class="legend-color" style="border-color: #7B68EE; background-color: rgba(123, 104, 238, 0.1);"></div>
					<span>Parallel</span>
				</div>
				<div class="legend-item">
					<div class="legend-color" style="border-color: #9B59B6; background-color: rgba(155, 89, 182, 0.1);"></div>
					<span>Map</span>
				</div>
				<div class="legend-item">
					<div class="legend-color" style="border-color: #50C878; background-color: rgba(80, 200, 120, 0.1);"></div>
					<span>Pass</span>
				</div>
				<div class="legend-item">
					<div class="legend-color" style="border-color: #FF6B6B; background-color: rgba(255, 107, 107, 0.1);"></div>
					<span>Wait</span>
				</div>
				<div class="legend-item">
					<div class="legend-color" style="border-color: #2ECC71; background-color: rgba(46, 204, 113, 0.1);"></div>
					<span>Succeed</span>
				</div>
				<div class="legend-item">
					<div class="legend-color" style="border-color: #E74C3C; background-color: rgba(231, 76, 60, 0.1);"></div>
					<span>Fail</span>
				</div>
			</div>
		</div>

		<script>
			const aslData = ${aslDataJson};
			let currentZoom = 1;

			function zoomIn() {
				currentZoom = Math.min(currentZoom + 0.2, 3);
				applyZoom();
			}

			function zoomOut() {
				currentZoom = Math.max(currentZoom - 0.2, 0.3);
				applyZoom();
			}

			function resetZoom() {
				currentZoom = 1;
				applyZoom();
			}

			function applyZoom() {
				const container = document.getElementById('graph-container');
				container.style.transform = 'scale(' + currentZoom + ')';
			}

			class StepFunctionGraph {
				constructor(definition, containerId) {
					this.definition = definition;
					this.container = document.getElementById(containerId);
					this.states = definition.States || {};
					this.startAt = definition.StartAt;
					this.nodePositions = new Map();
					this.nodeWidth = 120;
					this.nodeHeight = 60;
					this.horizontalGap = 60;
					this.verticalGap = 120; // Increased gap to fit arrows
					this.layers = [];
					this.allStates = {}; // Will include branch states
					this.branchParents = new Map(); // Track which parallel state owns which branch states
					this.nodeSizes = new Map(); // Track custom sizes for nodes (Parallel, Map)
				}

				render() {
					try {
						if (!this.startAt || Object.keys(this.states).length === 0) {
							this.showError('Invalid Step Function definition: Missing StartAt or States');
							return;
						}

						this.flattenBranchStates();
						this.calculateLayout();
						this.drawGraph();
						document.getElementById('legend').style.display = 'block';
					} catch (error) {
						this.showError('Error rendering graph: ' + error.message);
						console.error(error);
					}
				}

				showError(message) {
					this.container.innerHTML = '<div class="error-message">' + message + '</div>';
				}

				flattenBranchStates() {
					// Start with main states - do NOT flatten branches, we'll show them in the parent box
					this.allStates = { ...this.states };
				}

				calculateLayout() {
					const visited = new Set();
					const layers = [];
					const queue = [[this.startAt, 0]];

					while (queue.length > 0) {
						const [stateName, layer] = queue.shift();
						
						if (visited.has(stateName) || !this.allStates[stateName]) {
							continue;
						}

						visited.add(stateName);

						if (!layers[layer]) {
							layers[layer] = [];
						}
						layers[layer].push(stateName);

						const state = this.allStates[stateName];
						const nextStates = this.getNextStates(state, stateName);
						
						for (const next of nextStates) {
							if (!visited.has(next)) {
								queue.push([next, layer + 1]);
							}
						}
					}

					this.layers = layers;

					// Calculate positions (top to bottom layout)
					layers.forEach((layerStates, layerIndex) => {
						layerStates.forEach((stateName, indexInLayer) => {
							const totalInLayer = layerStates.length;
							const centerOffset = (totalInLayer - 1) * (this.nodeWidth + this.horizontalGap) / 2;
							const x = indexInLayer * (this.nodeWidth + this.horizontalGap) - centerOffset;
							const y = layerIndex * (this.nodeHeight + this.verticalGap) + this.nodeHeight / 2;
							
							this.nodePositions.set(stateName, { x, y });
						});
					});
				}

				getNextStates(state, stateName) {
					const nexts = [];
					
					if (state.Next) {
						nexts.push(state.Next);
					}
					
					if (state.Type === 'Choice' && state.Choices) {
						state.Choices.forEach(choice => {
							if (choice.Next) {
								nexts.push(choice.Next);
							}
						});
						if (state.Default) {
							nexts.push(state.Default);
						}
					}
					
					if (state.Catch) {
						state.Catch.forEach(catchBlock => {
							if (catchBlock.Next) {
								nexts.push(catchBlock.Next);
							}
						});
					}

					// For Parallel and Map states, just skip to the Next state after them
					// Don't add branch states as separate nodes
					
					return nexts;
				}

				drawGraph() {
					const padding = 50;
					let minX = Infinity, maxX = -Infinity;
					let minY = Infinity, maxY = -Infinity;

					this.nodePositions.forEach((pos) => {
						minX = Math.min(minX, pos.x - this.nodeWidth / 2);
						maxX = Math.max(maxX, pos.x + this.nodeWidth / 2);
						minY = Math.min(minY, pos.y - this.nodeHeight / 2);
						maxY = Math.max(maxY, pos.y + this.nodeHeight / 2);
					});

					const width = maxX - minX + 2 * padding;
					const height = maxY - minY + 2 * padding;
					const offsetX = -minX + padding;
					const offsetY = -minY + padding;

					const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
					svg.setAttribute('width', width);
					svg.setAttribute('height', height);

					// Add arrow marker
					const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
					const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
					marker.setAttribute('id', 'arrowhead');
					marker.setAttribute('markerWidth', '10');
					marker.setAttribute('markerHeight', '10');
					marker.setAttribute('refX', '9');
					marker.setAttribute('refY', '3');
					marker.setAttribute('orient', 'auto');
					const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
					polygon.setAttribute('points', '0 0, 10 3, 0 6');
					polygon.setAttribute('fill', 'var(--vscode-button-background)');
					marker.appendChild(polygon);
					defs.appendChild(marker);
					svg.appendChild(defs);

					// Draw arrows first (so they appear behind boxes)
					this.nodePositions.forEach((fromPos, fromState) => {
						const state = this.allStates[fromState];
						const nexts = this.getNextStates(state, fromState);
						
						nexts.forEach(toState => {
							const toPos = this.nodePositions.get(toState);
							if (toPos) {
								this.drawArrow(svg, fromPos, toPos, offsetX, offsetY, fromState, toState);
							}
						});
					});

					// Draw state boxes
					const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
					foreignObject.setAttribute('width', width);
					foreignObject.setAttribute('height', height);
					
					const div = document.createElement('div');
					div.style.width = width + 'px';
					div.style.height = height + 'px';
					div.style.position = 'relative';

					this.nodePositions.forEach((pos, stateName) => {
						const stateBox = this.createStateBox(stateName, pos, offsetX, offsetY);
						div.appendChild(stateBox);
					});

					foreignObject.appendChild(div);
					svg.appendChild(foreignObject);

					this.container.innerHTML = '';
					this.container.appendChild(svg);
				}

				drawArrow(svg, fromPos, toPos, offsetX, offsetY, fromState, toState) {
					// Get custom sizes if they exist
					const fromSize = this.nodeSizes.get(fromState) || { width: this.nodeWidth, height: this.nodeHeight };
					const toSize = this.nodeSizes.get(toState) || { width: this.nodeWidth, height: this.nodeHeight };
					
					// Start from bottom middle of source box
					const x1 = fromPos.x + offsetX;
					const y1 = fromPos.y + offsetY + fromSize.height / 2;
					
					// End at top middle of target box
					const x2 = toPos.x + offsetX;
					const y2 = toPos.y + offsetY - toSize.height / 2;

					const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
					
					const midY = (y1 + y2) / 2;
					const pathData = 'M ' + x1 + ' ' + y1 + ' Q ' + x1 + ' ' + midY + ' ' + ((x1 + x2) / 2) + ' ' + midY + 
									 ' T ' + x2 + ' ' + y2;
					
					path.setAttribute('d', pathData);
					path.setAttribute('class', 'arrow');
					svg.appendChild(path);
				}

				createStateBox(stateName, pos, offsetX, offsetY) {
					const state = this.allStates[stateName];
					const div = document.createElement('div');
					
					// Calculate box size based on content
					let boxWidth = this.nodeWidth;
					let boxHeight = this.nodeHeight;
					
					// For Parallel states, calculate size to fit all branches
					if (state.Type === 'Parallel' && state.Branches) {
						// Calculate height needed for branches
						const branchCount = state.Branches.length;
						const branchHeight = 60; // Approximate height per branch
						boxHeight = Math.max(this.nodeHeight, 40 + (branchCount * branchHeight));
						boxWidth = Math.max(this.nodeWidth, 160);
					}
					
					// For Map states, calculate size to fit iterator
					if (state.Type === 'Map' && state.Iterator && state.Iterator.States) {
						boxHeight = Math.max(this.nodeHeight, 120);
						boxWidth = Math.max(this.nodeWidth, 160);
					}
					
					// Store custom size for arrow calculations
					this.nodeSizes.set(stateName, { width: boxWidth, height: boxHeight });
					
					const x = pos.x + offsetX - boxWidth / 2;
					const y = pos.y + offsetY - boxHeight / 2;
					
					div.className = 'state-box ' + (state.Type || 'task').toLowerCase();
					div.style.position = 'absolute';
					div.style.left = x + 'px';
					div.style.top = y + 'px';
					div.style.width = boxWidth + 'px';
					div.style.height = boxHeight + 'px';
					div.style.minHeight = 'auto';
					
					const nameDiv = document.createElement('div');
					nameDiv.className = 'state-name';
					nameDiv.textContent = stateName;
					if (stateName === this.startAt) {
						nameDiv.textContent = '▶ ' + stateName;
					}
					div.appendChild(nameDiv);
					
					const typeDiv = document.createElement('div');
					typeDiv.className = 'state-type';
					typeDiv.textContent = state.Type || 'Task';
					div.appendChild(typeDiv);

					// Show branches for Parallel states
					if (state.Type === 'Parallel' && state.Branches) {
						const branchesDiv = document.createElement('div');
						branchesDiv.style.marginTop = '8px';
						branchesDiv.style.fontSize = '9px';
						branchesDiv.style.borderTop = '1px solid var(--vscode-panel-border)';
						branchesDiv.style.paddingTop = '5px';
						
						state.Branches.forEach((branch, index) => {
							const branchDiv = document.createElement('div');
							branchDiv.style.marginBottom = '4px';
							branchDiv.style.padding = '3px';
							branchDiv.style.background = 'rgba(123, 104, 238, 0.1)';
							branchDiv.style.borderRadius = '3px';
							branchDiv.style.borderLeft = '2px solid #7B68EE';
							
							const branchTitle = document.createElement('div');
							branchTitle.style.fontWeight = 'bold';
							branchTitle.style.marginBottom = '2px';
							branchTitle.textContent = '⎇ Branch ' + index;
							branchDiv.appendChild(branchTitle);
							
							if (branch.States) {
								const stateNames = Object.keys(branch.States);
								const statesText = document.createElement('div');
								statesText.style.fontSize = '8px';
								statesText.style.opacity = '0.8';
								statesText.textContent = stateNames.join(' → ');
								if (statesText.textContent.length > 25) {
									statesText.textContent = statesText.textContent.substring(0, 25) + '...';
								}
								statesText.title = stateNames.join(' → ');
								branchDiv.appendChild(statesText);
								
								const countDiv = document.createElement('div');
								countDiv.style.fontSize = '8px';
								countDiv.style.marginTop = '2px';
								countDiv.textContent = stateNames.length + ' state(s)';
								branchDiv.appendChild(countDiv);
							}
							
							branchesDiv.appendChild(branchDiv);
						});
						
						div.appendChild(branchesDiv);
					}

					// Show iterator for Map states
					if (state.Type === 'Map' && state.Iterator && state.Iterator.States) {
						const iteratorDiv = document.createElement('div');
						iteratorDiv.style.marginTop = '8px';
						iteratorDiv.style.fontSize = '9px';
						iteratorDiv.style.borderTop = '1px solid var(--vscode-panel-border)';
						iteratorDiv.style.paddingTop = '5px';
						
						const iterDiv = document.createElement('div');
						iterDiv.style.padding = '3px';
						iterDiv.style.background = 'rgba(155, 89, 182, 0.1)';
						iterDiv.style.borderRadius = '3px';
						iterDiv.style.borderLeft = '2px solid #9B59B6';
						
						const iterTitle = document.createElement('div');
						iterTitle.style.fontWeight = 'bold';
						iterTitle.style.marginBottom = '2px';
						iterTitle.textContent = '↻ Iterator';
						iterDiv.appendChild(iterTitle);
						
						const stateNames = Object.keys(state.Iterator.States);
						const statesText = document.createElement('div');
						statesText.style.fontSize = '8px';
						statesText.style.opacity = '0.8';
						statesText.textContent = stateNames.join(' → ');
						if (statesText.textContent.length > 25) {
							statesText.textContent = statesText.textContent.substring(0, 25) + '...';
						}
						statesText.title = stateNames.join(' → ');
						iterDiv.appendChild(statesText);
						
						const countDiv = document.createElement('div');
						countDiv.style.fontSize = '8px';
						countDiv.style.marginTop = '2px';
						countDiv.textContent = stateNames.length + ' state(s)';
						iterDiv.appendChild(countDiv);
						
						iteratorDiv.appendChild(iterDiv);
						div.appendChild(iteratorDiv);
					}

					if (state.Resource) {
						const resourceDiv = document.createElement('div');
						resourceDiv.className = 'state-details';
						const shortResource = state.Resource.split(':').pop() || state.Resource;
						resourceDiv.textContent = shortResource.substring(0, 15) + (shortResource.length > 15 ? '...' : '');
						resourceDiv.title = state.Resource;
						div.appendChild(resourceDiv);
					}

					if (state.End) {
						const endDiv = document.createElement('div');
						endDiv.className = 'state-details';
						endDiv.textContent = '■ End';
						div.appendChild(endDiv);
					}

					div.onclick = () => {
						console.log('State:', stateName, state);
						alert('State: ' + stateName + '\\nType: ' + state.Type + '\\n\\n' + JSON.stringify(state, null, 2));
					};
					
					return div;
				}
			}

			// Render the graph
			const graph = new StepFunctionGraph(aslData, 'graph-container');
			graph.render();
		</script>

		<br>
		<br>
		<table>
			<tr>
				<td>
					<a href="https://github.com/necatiarslan/aws-step-functions-vscode-extension/issues/new">Bug Report & Feature Request</a>
				</td>
			</tr>
		</table>
	  </body>
	</html>
	`;
        ui.logToOutput('StepFuncGraphView._getWebviewContent Completed');
        return result;
    }

    public dispose() {
        ui.logToOutput('StepFuncGraphView.dispose Started');
        StepFuncGraphView.Current = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
