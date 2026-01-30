"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueJobRunsReportView = void 0;
const vscode = require("vscode");
const ui = require("../common/UI");
const api = require("./API");
const CloudWatchLogView_1 = require("../cloudwatch-logs/CloudWatchLogView");
const Session_1 = require("../common/Session");
class GlueJobRunsReportView {
    static Current;
    panel;
    extensionUri;
    region;
    jobName;
    disposables = [];
    state = { isLoading: false, runs: [] };
    constructor(panel, region, jobName) {
        this.panel = panel;
        this.extensionUri = Session_1.Session.Current.ExtensionUri;
        this.region = region;
        this.jobName = jobName;
        this.panel.onDidDispose(this.dispose, null, this.disposables);
        this.panel.webview.onDidReceiveMessage(this.handleMessage, this, this.disposables);
        this.loadRuns();
        this.render();
    }
    static Render(region, jobName) {
        ui.logToOutput(`GlueJobRunsReportView.Render ${jobName} @ ${region}`);
        if (GlueJobRunsReportView.Current) {
            GlueJobRunsReportView.Current.state = { isLoading: false, runs: [] };
            GlueJobRunsReportView.Current.region = region;
            GlueJobRunsReportView.Current.jobName = jobName;
            GlueJobRunsReportView.Current.panel.title = `Glue Job Runs: ${jobName}`;
            GlueJobRunsReportView.Current.panel.reveal(vscode.ViewColumn.One);
            GlueJobRunsReportView.Current.loadRuns();
            return;
        }
        const panel = vscode.window.createWebviewPanel("GlueJobRunsReportView", `Glue Job Runs: ${jobName}`, vscode.ViewColumn.One, {
            enableScripts: true,
        });
        GlueJobRunsReportView.Current = new GlueJobRunsReportView(panel, region, jobName);
    }
    async loadRuns() {
        try {
            this.state.isLoading = true;
            this.state.error = undefined;
            this.sendState();
            const result = await api.GetGlueJobRuns(this.region, this.jobName);
            if (!result.isSuccessful) {
                this.state.error = result.error ? String(result.error) : "Failed to load job runs";
                this.state.runs = [];
                this.state.isLoading = false;
                this.sendState();
                return;
            }
            this.state.runs = result.result || [];
            this.state.isLoading = false;
            this.sendState();
        }
        catch (err) {
            this.state.error = err?.message || String(err);
            this.state.isLoading = false;
            this.state.runs = [];
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
        return (this.state.runs || [])
            .filter(run => {
            if (!run.StartedOn) {
                return false;
            }
            if (selectedDateObj && nextDayObj) {
                const runDate = new Date(run.StartedOn);
                return runDate >= selectedDateObj && runDate < nextDayObj;
            }
            return true;
        })
            .map(run => {
            const startDate = run.StartedOn ? new Date(run.StartedOn) : undefined;
            const endDate = run.CompletedOn ? new Date(run.CompletedOn) : undefined;
            const duration = run.ExecutionTime
                ? `${run.ExecutionTime}s`
                : (startDate && endDate ? `${Math.round((endDate.getTime() - startDate.getTime()) / 1000)}s` : "");
            const args = run.Arguments ? JSON.stringify(run.Arguments) : "";
            const preview = args.length > 140 ? `${args.substring(0, 140)}…` : args;
            const id = run.Id || "";
            const status = run.JobRunState || "";
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
                case "STOPPED":
                case "STOPPING":
                    statusIcon = "stop";
                    break;
                case "TIMEOUT":
                    statusIcon = "clock";
                    break;
                case "STARTING":
                case "WAITING":
                    statusIcon = "loading~spin";
                    break;
            }
            return {
                id,
                displayId: id ? id.substring(0, 10) : "",
                status,
                statusIcon,
                start: startDate ? startDate.toLocaleString() : "",
                end: endDate ? endDate.toLocaleString() : "",
                startTime: startDate ? startDate.getTime() : 0,
                duration,
                error: run.ErrorMessage || "",
                args: preview,
                hasOutput: true, // Glue always has standard log groups
                hasError: true,
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
                jobName: this.jobName,
                selectedDate: this.state.selectedDate,
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
                await this.loadRuns();
                return;
            case "dateChanged":
                this.state.selectedDate = message.date || undefined;
                this.sendState();
                return;
            case "openLogs":
                await this.openLogs(message.kind, message.runId);
                return;
            default:
                return;
        }
    }
    async openLogs(kind, runId) {
        const run = (this.state.runs || []).find(r => r.Id === runId);
        if (!run) {
            ui.showInfoMessage("Run not found");
            return;
        }
        const outputGroup = api.GetGlueJobLogGroupName(this.jobName);
        const errorGroup = api.GetGlueJobErrorLogGroupName(this.jobName);
        const group = kind === "output" ? outputGroup : errorGroup;
        if (!group) {
            ui.showInfoMessage("Log group not available for this run");
            return;
        }
        // Use run ID as stream filter
        CloudWatchLogView_1.CloudWatchLogView.Render(this.region, group, run.Id || "");
    }
    getHtml(webview) {
        const codiconsUri = ui.getUri(webview, this.extensionUri, ["node_modules", "@vscode", "codicons", "dist", "codicon.css"]);
        const vscodeElementsUri = ui.getUri(webview, this.extensionUri, ["node_modules", "@vscode-elements", "elements", "dist", "bundled.js"]);
        const styleUri = ui.getUri(webview, this.extensionUri, ["media", "glue", "style.css"]);
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
    </style>
</head>
<body>
    <section class="header">
        <div class="title">
            <span class="codicon codicon-history"></span>
            <span id="title">Glue Job Runs</span>
            <span class="badge" id="region"></span>
            <span class="badge" id="job"></span>
        </div>
        <div class="controls">
            <div class="controls-group">
                <label for="dateInput" style="margin: 0; display: flex; align-items: center; gap: 4px;"><span class="codicon codicon-calendar"></span>Date:</label>
                <input id="dateInput" type="date" style="padding: 4px 6px; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 2px; font-size: 12px;" />
            </div>
            <vscode-button id="refresh" appearance="secondary"><span class="codicon codicon-refresh"></span>Refresh</vscode-button>
            <span class="spinner" id="spinner" style="display:none;"><span class="codicon codicon-sync"></span>Loading...</span>
        </div>
    </section>

    <div id="error" class="muted" style="display:none;"></div>

    <table aria-label="Job runs">
        <thead>
            <tr>
                <th>Run Id</th>
                <th>Start</th>
                <th>End</th>
                <th>Duration</th>
                <th>Error</th>
                <th>Arguments</th>
                <th>Logs</th>
            </tr>
        </thead>
        <tbody id="rows"></tbody>
    </table>

    <div id="empty" class="no-data" style="display:none;">No runs found.</div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const rowsEl = document.getElementById('rows');
        const spinnerEl = document.getElementById('spinner');
        const errorEl = document.getElementById('error');
        const emptyEl = document.getElementById('empty');
        const regionEl = document.getElementById('region');
        const jobEl = document.getElementById('job');
        const dateInput = document.getElementById('dateInput');

        document.getElementById('refresh').addEventListener('click', () => {
            vscode.postMessage({ command: 'refresh' });
        });

        dateInput.addEventListener('change', () => {
            vscode.postMessage({ command: 'dateChanged', date: dateInput.value });
        });

        function render(state) {
            regionEl.textContent = state.region ? 'Region: ' + state.region : '';
            jobEl.textContent = state.jobName ? 'Job: ' + state.jobName : '';
            if (state.selectedDate && dateInput.value !== state.selectedDate) {
                dateInput.value = state.selectedDate;
            }
            if (!state.selectedDate && dateInput.value) {
                dateInput.value = '';
            }
            spinnerEl.style.display = state.isLoading ? 'inline-flex' : 'none';
            errorEl.style.display = state.error ? 'block' : 'none';
            errorEl.textContent = state.error || '';

            rowsEl.innerHTML = '';
            const rows = state.rows || [];
            emptyEl.style.display = (!state.isLoading && rows.length === 0) ? 'block' : 'none';

            rows.forEach(row => {
                const tr = document.createElement('tr');

                const idTd = document.createElement('td');
                const iconSpan = document.createElement('span');
                const iconClass = 'codicon codicon-' + row.statusIcon;
                iconSpan.setAttribute('class', iconClass);
                iconSpan.style.marginRight = '6px';
                iconSpan.title = row.status;
                idTd.appendChild(iconSpan);
                const idSpan = document.createElement('span');
                idSpan.textContent = row.displayId || row.id;
                idTd.appendChild(idSpan);
                tr.appendChild(idTd);

                const startTd = document.createElement('td');
                startTd.textContent = row.start;
                tr.appendChild(startTd);

                const endTd = document.createElement('td');
                endTd.textContent = row.end;
                tr.appendChild(endTd);

                const durationTd = document.createElement('td');
                durationTd.textContent = row.duration;
                tr.appendChild(durationTd);

                const errorTd = document.createElement('td');
                errorTd.textContent = row.error;
                tr.appendChild(errorTd);

                const argsTd = document.createElement('td');
                const argsSpan = document.createElement('span');
                argsSpan.className = 'ellipsis';
                argsSpan.textContent = row.args;
                argsTd.appendChild(argsSpan);
                tr.appendChild(argsTd);

                const logsTd = document.createElement('td');
                const actions = document.createElement('div');
                actions.className = 'actions';

                const outBtn = document.createElement('vscode-button');
                outBtn.textContent = 'Output';
                outBtn.appearance = 'secondary';
                outBtn.disabled = !row.hasOutput;
                outBtn.addEventListener('click', () => {
                    vscode.postMessage({ command: 'openLogs', kind: 'output', runId: row.id });
                });

                const errBtn = document.createElement('vscode-button');
                errBtn.textContent = 'Error';
                errBtn.appearance = 'secondary';
                errBtn.disabled = !row.hasError;
                errBtn.addEventListener('click', () => {
                    vscode.postMessage({ command: 'openLogs', kind: 'error', runId: row.id });
                });

                actions.appendChild(outBtn);
                actions.appendChild(errBtn);
                logsTd.appendChild(actions);
                tr.appendChild(logsTd);

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
        GlueJobRunsReportView.Current = undefined;
        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
exports.GlueJobRunsReportView = GlueJobRunsReportView;
//# sourceMappingURL=GlueJobRunsReportView.js.map