"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineExecutionsReportView = void 0;
const vscode = require("vscode");
const ui = require("../common/UI");
const api = require("./API");
const StateMachineExecutionView_1 = require("./StateMachineExecutionView");
const Session_1 = require("../common/Session");
class StateMachineExecutionsReportView {
    static Current;
    panel;
    extensionUri;
    region;
    stateMachineArn;
    stateMachineName;
    disposables = [];
    state = {
        isLoading: false,
        executions: [],
        selectedStatus: "All",
        nameFilter: ""
    };
    constructor(panel, region, stateMachineArn, stateMachineName) {
        this.panel = panel;
        this.extensionUri = Session_1.Session.Current.ExtensionUri;
        this.region = region;
        this.stateMachineArn = stateMachineArn;
        this.stateMachineName = stateMachineName;
        this.panel.onDidDispose(this.dispose, null, this.disposables);
        this.panel.webview.onDidReceiveMessage(this.handleMessage, this, this.disposables);
        this.loadExecutions();
        this.render();
    }
    static Render(region, stateMachineArn, stateMachineName) {
        ui.logToOutput(`StateMachineExecutionsReportView.Render ${stateMachineName} @ ${region}`);
        if (StateMachineExecutionsReportView.Current) {
            StateMachineExecutionsReportView.Current.state = {
                isLoading: false,
                executions: [],
                selectedStatus: "All",
                nameFilter: ""
            };
            StateMachineExecutionsReportView.Current.region = region;
            StateMachineExecutionsReportView.Current.stateMachineArn = stateMachineArn;
            StateMachineExecutionsReportView.Current.stateMachineName = stateMachineName;
            StateMachineExecutionsReportView.Current.panel.title = `Executions: ${stateMachineName}`;
            StateMachineExecutionsReportView.Current.panel.reveal(vscode.ViewColumn.One);
            StateMachineExecutionsReportView.Current.loadExecutions();
            return;
        }
        const panel = vscode.window.createWebviewPanel("StateMachineExecutionsReportView", `Executions: ${stateMachineName}`, vscode.ViewColumn.One, {
            enableScripts: true,
        });
        StateMachineExecutionsReportView.Current = new StateMachineExecutionsReportView(panel, region, stateMachineArn, stateMachineName);
    }
    async loadExecutions() {
        try {
            this.state.isLoading = true;
            this.state.error = undefined;
            this.sendState();
            const result = await api.ListExecutions(this.region, this.stateMachineArn);
            if (!result.isSuccessful) {
                this.state.error = result.error ? String(result.error) : "Failed to load executions";
                this.state.executions = [];
                this.state.isLoading = false;
                this.sendState();
                return;
            }
            this.state.executions = result.result || [];
            this.state.isLoading = false;
            this.sendState();
        }
        catch (err) {
            this.state.error = err?.message || String(err);
            this.state.isLoading = false;
            this.state.executions = [];
            this.sendState();
        }
    }
    mapRows() {
        const selectedDate = this.state.selectedDate;
        let selectedDateObj;
        let nextDayObj;
        if (selectedDate) {
            selectedDateObj = new Date(selectedDate);
            nextDayObj = new Date(selectedDateObj);
            nextDayObj.setDate(nextDayObj.getDate() + 1);
        }
        const selectedStatus = this.state.selectedStatus;
        const nameFilter = this.state.nameFilter.toLowerCase();
        return (this.state.executions || [])
            .filter(execution => {
            // Filter by date
            if (!execution.startDate) {
                return false;
            }
            if (selectedDateObj && nextDayObj) {
                const execDate = new Date(execution.startDate);
                if (execDate < selectedDateObj || execDate >= nextDayObj) {
                    return false;
                }
            }
            // Filter by status
            if (selectedStatus !== "All" && execution.status !== selectedStatus) {
                return false;
            }
            // Filter by name
            if (nameFilter && !execution.name?.toLowerCase().includes(nameFilter)) {
                return false;
            }
            return true;
        })
            .map(execution => {
            const startDate = execution.startDate ? new Date(execution.startDate) : undefined;
            const stopDate = execution.stopDate ? new Date(execution.stopDate) : undefined;
            const duration = startDate && stopDate
                ? `${Math.round((stopDate.getTime() - startDate.getTime()) / 1000)}s`
                : (stopDate ? "" : "Running...");
            const status = execution.status || "";
            let statusIcon = "circle-outline";
            switch (status) {
                case "SUCCEEDED":
                    statusIcon = "pass";
                    break;
                case "FAILED":
                    statusIcon = "error";
                    break;
                case "RUNNING":
                    statusIcon = "sync~spin";
                    break;
                case "TIMED_OUT":
                    statusIcon = "clock";
                    break;
                case "ABORTED":
                    statusIcon = "stop";
                    break;
            }
            // Extract state machine name from ARN
            const arnParts = execution.stateMachineArn?.split(':') || [];
            const smName = arnParts.length > 0 ? arnParts[arnParts.length - 1] : "";
            return {
                executionArn: execution.executionArn || "",
                name: execution.name || "",
                status,
                statusIcon,
                start: startDate ? startDate.toLocaleString() : "",
                stop: stopDate ? stopDate.toLocaleString() : "",
                startTime: startDate ? startDate.getTime() : 0,
                duration,
                stateMachineName: smName,
            };
        });
    }
    render() {
        this.panel.webview.html = this.getHtml(this.panel.webview);
    }
    sendState() {
        this.panel.webview.postMessage({
            type: "state",
            state: {
                region: this.region,
                stateMachineName: this.stateMachineName,
                selectedDate: this.state.selectedDate,
                selectedStatus: this.state.selectedStatus,
                nameFilter: this.state.nameFilter,
                isLoading: this.state.isLoading,
                error: this.state.error,
                rows: this.mapRows(),
            }
        });
    }
    async handleMessage(message) {
        switch (message.command) {
            case "ready":
                this.sendState();
                return;
            case "refresh":
                await this.loadExecutions();
                return;
            case "dateChanged":
                this.state.selectedDate = message.date || undefined;
                this.sendState();
                return;
            case "statusChanged":
                this.state.selectedStatus = message.status || "All";
                this.sendState();
                return;
            case "nameFilterChanged":
                this.state.nameFilter = message.nameFilter || "";
                this.sendState();
                return;
            case "viewExecution":
                await this.viewExecution(message.executionArn);
                return;
            default:
                return;
        }
    }
    async viewExecution(executionArn) {
        if (!executionArn) {
            ui.showInfoMessage("Execution ARN not found");
            return;
        }
        StateMachineExecutionView_1.StateMachineExecutionView.Render(executionArn, this.stateMachineArn, this.region);
    }
    getHtml(webview) {
        const codiconsUri = ui.getUri(webview, this.extensionUri, ["node_modules", "@vscode", "codicons", "dist", "codicon.css"]);
        const vscodeElementsUri = ui.getUri(webview, this.extensionUri, ["node_modules", "@vscode-elements", "elements", "dist", "bundled.js"]);
        const styleUri = ui.getUri(webview, this.extensionUri, ["media", "step-functions", "style.css"]);
        const nonce = this.getNonce();
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; font-src ${webview.cspSource} https:;">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script type="module" src="${vscodeElementsUri}"></script>
    <link rel="stylesheet" href="${styleUri}">
    <link href="${codiconsUri}" rel="stylesheet" />
    <style>
        :root { --layout-padding: 12px; }
        body { font-family: var(--vscode-font-family); margin: 0; padding: var(--layout-padding); color: var(--vscode-foreground); }
        .header { display: flex; align-items: center; justify-content: flex-start; gap: 8px; flex-wrap: wrap; }
        .title { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
        .badge { display: inline-flex; align-items: center; justify-content: flex-start; padding: 2px 6px; border-radius: 4px; background: var(--vscode-editor-inactiveSelectionBackground); }
        .controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-left: auto; }
        .controls-group { display: flex; gap: 8px; align-items: center; }
        .spinner { display: inline-flex; align-items: center; gap: 6px; }
        .spinner .codicon { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid var(--vscode-panel-border); }
        th { color: var(--vscode-foreground); font-weight: 600; }
        tr:nth-child(even) { background: var(--vscode-editor-inactiveSelectionBackground); }
        .muted { color: var(--vscode-descriptionForeground); }
        .no-data { padding: 12px 0; color: var(--vscode-descriptionForeground); }
        .ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px; display: block; }
        .actions { display: flex; gap: 6px; }
        select, input[type="text"] { 
            padding: 4px 6px; 
            border: 1px solid var(--vscode-input-border); 
            background: var(--vscode-input-background); 
            color: var(--vscode-input-foreground); 
            border-radius: 2px; 
            font-size: 12px; 
        }
    </style>
</head>
<body>
    <section class="header">
        <div class="title">
            <span class="codicon codicon-history"></span>
            <span id="title">State Machine Executions</span>
            <span class="badge" id="region"></span>
            <span class="badge" id="stateMachine"></span>
        </div>
        <div class="controls">
            <div class="controls-group">
                <label for="dateInput" style="margin: 0; display: flex; align-items: center; gap: 4px;">
                    <span class="codicon codicon-calendar"></span>Date:
                </label>
                <input id="dateInput" type="date" />
            </div>
            <div class="controls-group">
                <label for="statusSelect" style="margin: 0; display: flex; align-items: center; gap: 4px;">
                    <span class="codicon codicon-filter"></span>Status:
                </label>
                <select id="statusSelect">
                    <option value="All">All</option>
                    <option value="RUNNING">Running</option>
                    <option value="SUCCEEDED">Succeeded</option>
                    <option value="FAILED">Failed</option>
                    <option value="TIMED_OUT">Timed Out</option>
                    <option value="ABORTED">Aborted</option>
                </select>
            </div>
            <div class="controls-group">
                <label for="nameFilter" style="margin: 0; display: flex; align-items: center; gap: 4px;">
                    <span class="codicon codicon-search"></span>Name:
                </label>
                <input id="nameFilter" type="text" placeholder="Filter by name..." style="min-width: 150px;" />
            </div>
            <vscode-button id="refresh" appearance="secondary">
                <span class="codicon codicon-refresh"></span>Refresh
            </vscode-button>
            <span class="spinner" id="spinner" style="display:none;">
                <span class="codicon codicon-sync"></span>Loading...
            </span>
        </div>
    </section>

    <div id="error" class="muted" style="display:none;"></div>

    <table aria-label="State machine executions">
        <thead>
            <tr>
                <th>Execution Name</th>
                <th>Status</th>
                <th>Start Time</th>
                <th>Stop Time</th>
                <th>Duration</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="rows"></tbody>
    </table>

    <div id="empty" class="no-data" style="display:none;">No executions found.</div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const rowsEl = document.getElementById('rows');
        const spinnerEl = document.getElementById('spinner');
        const errorEl = document.getElementById('error');
        const emptyEl = document.getElementById('empty');
        const regionEl = document.getElementById('region');
        const stateMachineEl = document.getElementById('stateMachine');
        const dateInput = document.getElementById('dateInput');
        const statusSelect = document.getElementById('statusSelect');
        const nameFilter = document.getElementById('nameFilter');

        document.getElementById('refresh').addEventListener('click', () => {
            vscode.postMessage({ command: 'refresh' });
        });

        dateInput.addEventListener('change', () => {
            vscode.postMessage({ command: 'dateChanged', date: dateInput.value });
        });

        statusSelect.addEventListener('change', () => {
            vscode.postMessage({ command: 'statusChanged', status: statusSelect.value });
        });

        nameFilter.addEventListener('input', () => {
            vscode.postMessage({ command: 'nameFilterChanged', nameFilter: nameFilter.value });
        });

        function render(state) {
            regionEl.textContent = state.region ? 'Region: ' + state.region : '';
            stateMachineEl.textContent = state.stateMachineName ? 'State Machine: ' + state.stateMachineName : '';
            
            if (state.selectedDate && dateInput.value !== state.selectedDate) {
                dateInput.value = state.selectedDate;
            }
            if (!state.selectedDate && dateInput.value) {
                dateInput.value = '';
            }

            if (state.selectedStatus && statusSelect.value !== state.selectedStatus) {
                statusSelect.value = state.selectedStatus;
            }

            if (state.nameFilter !== undefined && nameFilter.value !== state.nameFilter) {
                nameFilter.value = state.nameFilter;
            }
            
            spinnerEl.style.display = state.isLoading ? 'inline-flex' : 'none';
            errorEl.style.display = state.error ? 'block' : 'none';
            errorEl.textContent = state.error || '';

            rowsEl.innerHTML = '';
            const rows = state.rows || [];
            emptyEl.style.display = (!state.isLoading && rows.length === 0) ? 'block' : 'none';

            rows.forEach(row => {
                const tr = document.createElement('tr');

                const nameTd = document.createElement('td');
                nameTd.textContent = row.name;
                tr.appendChild(nameTd);

                const statusTd = document.createElement('td');
                const iconSpan = document.createElement('span');
                const iconClass = 'codicon codicon-' + row.statusIcon;
                iconSpan.setAttribute('class', iconClass);
                iconSpan.style.marginRight = '6px';
                iconSpan.title = row.status;
                statusTd.appendChild(iconSpan);
                const statusSpan = document.createElement('span');
                statusSpan.textContent = row.status;
                statusTd.appendChild(statusSpan);
                tr.appendChild(statusTd);

                const startTd = document.createElement('td');
                startTd.textContent = row.start;
                tr.appendChild(startTd);

                const stopTd = document.createElement('td');
                stopTd.textContent = row.stop;
                tr.appendChild(stopTd);

                const durationTd = document.createElement('td');
                durationTd.textContent = row.duration;
                tr.appendChild(durationTd);

                const actionsTd = document.createElement('td');
                const actions = document.createElement('div');
                actions.className = 'actions';

                const detailsBtn = document.createElement('vscode-button');
                detailsBtn.textContent = 'View Details';
                detailsBtn.appearance = 'secondary';
                detailsBtn.addEventListener('click', () => {
                    vscode.postMessage({ command: 'viewExecution', executionArn: row.executionArn });
                });

                actions.appendChild(detailsBtn);
                actionsTd.appendChild(actions);
                tr.appendChild(actionsTd);

                rowsEl.appendChild(tr);
            });
        }

        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.type === 'state') {
                render(message.state);
            }
        });

        vscode.postMessage({ command: 'ready' });
    </script>
</body>
</html>`;
    }
    getNonce() {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    dispose() {
        StateMachineExecutionsReportView.Current = undefined;
        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
exports.StateMachineExecutionsReportView = StateMachineExecutionsReportView;
//# sourceMappingURL=StateMachineExecutionsReportView.js.map