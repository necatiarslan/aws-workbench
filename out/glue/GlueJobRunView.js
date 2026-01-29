"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueJobRunView = void 0;
const vscode = require("vscode");
const ui = require("../common/UI");
const api = require("./API");
const CloudWatchLogView_1 = require("../cloudwatch-logs/CloudWatchLogView");
class GlueJobRunView {
    static Current;
    panel;
    disposables = [];
    extensionUri;
    state;
    triggerFilePath;
    constructor(panel, extensionUri, region, jobName, triggerFilePath) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.triggerFilePath = triggerFilePath;
        this.state = {
            region,
            jobName,
            args: [],
            isRunning: false,
            triggerFilePath,
        };
        this.panel.onDidDispose(this.dispose, null, this.disposables);
        this.panel.webview.onDidReceiveMessage(this.handleMessage, this, this.disposables);
        this.loadDefaultArgs();
        this.render();
    }
    static Render(extensionUri, region, jobName, triggerFilePath) {
        ui.logToOutput(`GlueJobRunView.Render ${jobName} @ ${region}` + (triggerFilePath ? ` with file: ${triggerFilePath}` : ''));
        if (GlueJobRunView.Current) {
            GlueJobRunView.Current.state.region = region;
            GlueJobRunView.Current.state.jobName = jobName;
            GlueJobRunView.Current.triggerFilePath = triggerFilePath;
            GlueJobRunView.Current.state.triggerFilePath = triggerFilePath;
            GlueJobRunView.Current.panel.title = `Glue Job: ${jobName}`;
            GlueJobRunView.Current.panel.reveal(vscode.ViewColumn.One);
            GlueJobRunView.Current.loadDefaultArgs();
            GlueJobRunView.Current.render();
            return;
        }
        const panel = vscode.window.createWebviewPanel("GlueJobRunView", `Glue Job: ${jobName}`, vscode.ViewColumn.One, {
            enableScripts: true,
        });
        GlueJobRunView.Current = new GlueJobRunView(panel, extensionUri, region, jobName, triggerFilePath);
    }
    async loadDefaultArgs() {
        try {
            const res = await api.GetGlueJob(this.state.region, this.state.jobName);
            if (!res.isSuccessful || !res.result) {
                this.state.args = [];
                if (this.triggerFilePath) {
                    await this.loadTriggerFileArgs();
                }
                this.render();
                return;
            }
            const defaults = res.result.DefaultArguments || {};
            let args = Object.keys(defaults).map(k => ({
                key: k,
                value: String(defaults[k]),
                enabled: false,
                isDefault: true
            }));
            // If trigger file is provided, load args from file
            if (this.triggerFilePath) {
                args = await this.loadArgsFromTriggerFile(this.triggerFilePath) || args;
            }
            this.state.args = args;
            this.render();
        }
        catch (err) {
            ui.logToOutput("GlueJobRunView.loadDefaultArgs error", err);
            this.state.args = [];
            this.render();
        }
    }
    async loadTriggerFileArgs() {
        if (!this.triggerFilePath) {
            return;
        }
        this.state.args = await this.loadArgsFromTriggerFile(this.triggerFilePath) || [];
    }
    async loadArgsFromTriggerFile(filePath) {
        try {
            const fileUri = vscode.Uri.file(filePath);
            const content = await vscode.workspace.fs.readFile(fileUri);
            const text = new TextDecoder().decode(content);
            const json = JSON.parse(text);
            if (typeof json === 'object' && json !== null) {
                return Object.keys(json).map(k => ({ key: k, value: String(json[k]), enabled: true }));
            }
        }
        catch (err) {
            ui.logToOutput("GlueJobRunView.loadArgsFromTriggerFile error", err);
        }
        return undefined;
    }
    render() {
        this.panel.webview.html = this.getHtml(this.panel.webview, this.extensionUri);
    }
    sendState() {
        this.state.triggerFilePath = this.triggerFilePath;
        this.panel.webview.postMessage({ type: "state", state: this.state });
    }
    async handleMessage(message) {
        switch (message.command) {
            case "ready":
                this.sendState();
                return;
            case "start":
                await this.startRun(message.args);
                return;
            case "stop":
                await this.stopRun();
                return;
            case "openLogs":
                await this.openLogs(message.kind);
                return;
            default:
                return;
        }
    }
    async startRun(argsInput) {
        const argsList = argsInput ?? this.state.args;
        const activeArgs = (argsList || []).filter(a => a.enabled).reduce((acc, cur) => {
            if (cur.key) {
                acc[cur.key] = cur.value;
            }
            return acc;
        }, {});
        try {
            ui.logToOutput(`Starting Glue job ${this.state.jobName}`);
            const res = await api.StartGlueJob(this.state.region, this.state.jobName, Object.keys(activeArgs).length ? activeArgs : undefined);
            if (!res.isSuccessful) {
                ui.showErrorMessage("Start job run failed", res.error);
                return;
            }
            const runId = res.result;
            this.state.isRunning = true;
            this.state.currentRunId = runId;
            await this.updateRunDetails();
            this.sendState();
            ui.showInfoMessage(`Job run started. Run id: ${runId}`);
        }
        catch (err) {
            ui.showErrorMessage("Start job run error", err);
        }
    }
    async stopRun() {
        if (!this.state.currentRunId) {
            ui.showInfoMessage("No active run to stop");
            return;
        }
        try {
            const res = await api.StopGlueJob(this.state.region, this.state.jobName, this.state.currentRunId);
            if (!res.isSuccessful) {
                ui.showErrorMessage("Stop job run failed", res.error);
                return;
            }
            this.state.isRunning = false;
            this.sendState();
            ui.showInfoMessage(`Stop requested for run ${this.state.currentRunId}`);
        }
        catch (err) {
            ui.showErrorMessage("Stop job run error", err);
        }
    }
    async updateRunDetails() {
        if (!this.state.currentRunId) {
            return;
        }
        try {
            const res = await api.GetGlueJobRun(this.state.region, this.state.jobName, this.state.currentRunId);
            if (res.isSuccessful && res.result) {
                const run = res.result;
                // Glue logs go to standard log groups
                this.state.outputLogGroup = api.GetGlueJobLogGroupName(this.state.jobName);
                this.state.errorLogGroup = api.GetGlueJobErrorLogGroupName(this.state.jobName);
            }
        }
        catch (err) {
            ui.logToOutput("GlueJobRunView.updateRunDetails error", err);
        }
    }
    async openLogs(kind) {
        const group = kind === "output" ? this.state.outputLogGroup : this.state.errorLogGroup;
        if (!group) {
            ui.showInfoMessage("Log group not available yet. Start a run first.");
            return;
        }
        const stream = this.state.currentRunId;
        if (!stream) {
            ui.showInfoMessage("Run id not set yet.");
            return;
        }
        CloudWatchLogView_1.CloudWatchLogView.Render(this.extensionUri, this.state.region, group, stream);
    }
    getHtml(webview, extensionUri) {
        const codiconsUri = ui.getUri(webview, extensionUri, ["node_modules", "@vscode", "codicons", "dist", "codicon.css"]);
        const vscodeElementsUri = ui.getUri(webview, extensionUri, ["node_modules", "@vscode-elements", "elements", "dist", "bundled.js"]);
        const styleUri = ui.getUri(webview, extensionUri, ["media", "glue", "style.css"]);
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
        :root {
            --layout-padding: 12px;
        }
        body { font-family: var(--vscode-font-family); margin: 0; padding: var(--layout-padding); color: var(--vscode-foreground); }
        .layout { display: flex; flex-direction: column; gap: 12px; }
        .headline { display: flex; flex-direction: column; gap: 6px; }
        .headline-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .badge { padding: 2px 6px; border-radius: 4px; background: var(--vscode-editor-inactiveSelectionBackground); }
        .spinner { display: inline-flex; align-items: center; gap: 6px; }
        .spinner .codicon { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .section-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
        .section-title { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }
        .arg-list { display: flex; flex-direction: column; gap: 6px; }
        .arg-row { display: grid; grid-template-columns: 28px 1fr 1fr 110px; gap: 8px; align-items: center; padding: 6px 8px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; background: var(--vscode-editor-background); }
        .arg-row[data-default="true"] { opacity: 0.85; }
        .arg-row .default-label { color: var(--vscode-descriptionForeground); font-size: 11px; }
        .arg-value { display: flex; flex-direction: column; gap: 4px; }
        .btn-row { display: flex; gap: 8px; flex-wrap: wrap; }
    </style>
</head>
<body>
    <section class="layout">
        <div class="headline">
            <div class="headline-row">
                <h2 id="title" style="margin: 0;">Glue Job</h2>
                <span class="badge" id="triggerFile" title="Trigger file path"></span>
            </div>
            <div class="headline-row">
                <span class="badge" id="region"></span>
                <span class="badge" id="runId"></span>
                <span class="spinner" id="spinner" style="display:none;"><span class="codicon codicon-sync"></span>Running...</span>
            </div>
        </div>

        <vscode-divider></vscode-divider>

        <div class="section-header">
            <div class="section-title">
                <span class="codicon codicon-gear"></span>
                <span>Arguments</span>
            </div>
            <vscode-button id="addArg" appearance="secondary">
                <span class="codicon codicon-add"></span>
                Add Argument
            </vscode-button>
        </div>

        <div id="args" class="arg-list"></div>

        <vscode-divider></vscode-divider>

        <div class="btn-row">
            <vscode-button id="start" appearance="primary">Trigger</vscode-button>
            <vscode-button id="stop" appearance="secondary">Stop</vscode-button>
            <vscode-button id="logsOut" appearance="secondary">Output Logs</vscode-button>
            <vscode-button id="logsErr" appearance="secondary">Error Logs</vscode-button>
        </div>
    </section>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();

        const stateEl = {
            title: document.getElementById('title'),
            region: document.getElementById('region'),
            runId: document.getElementById('runId'),
            triggerFile: document.getElementById('triggerFile'),
            spinner: document.getElementById('spinner'),
            args: document.getElementById('args'),
            addArg: document.getElementById('addArg'),
            start: document.getElementById('start'),
            stop: document.getElementById('stop'),
            logsOut: document.getElementById('logsOut'),
            logsErr: document.getElementById('logsErr'),
        };

        let currentState = undefined;

        function toggleArgInputs(arg, elements) {
            const enabled = !!arg.enabled;
            elements.key.disabled = !enabled;
            elements.value.disabled = !enabled;
            elements.remove.disabled = !enabled;
        }

        function renderArgs(args) {
            stateEl.args.innerHTML = '';
            (args || []).forEach((arg, idx) => {
                const row = document.createElement('div');
                row.className = 'arg-row';
                row.dataset.default = arg.isDefault ? 'true' : 'false';

                const enable = document.createElement('vscode-checkbox');
                enable.checked = !!arg.enabled;
                enable.setAttribute('aria-label', 'Enable argument');

                const keyInput = document.createElement('vscode-textfield');
                keyInput.placeholder = 'Key';
                keyInput.value = arg.key || '';
                keyInput.setAttribute('size', 'small');

                const valInput = document.createElement('vscode-textfield');
                valInput.placeholder = 'Value';
                valInput.value = arg.value || '';
                valInput.setAttribute('size', 'small');

                const valueCell = document.createElement('div');
                valueCell.className = 'arg-value';
                valueCell.appendChild(valInput);

                const removeBtn = document.createElement('vscode-button');
                removeBtn.textContent = 'Remove';
                removeBtn.appearance = 'secondary';

                if (arg.isDefault) {
                    const label = document.createElement('span');
                    label.className = 'default-label';
                    label.textContent = 'Default';
                    valueCell.appendChild(label);
                }

                enable.addEventListener('change', () => {
                    arg.enabled = !!enable.checked;
                    toggleArgInputs(arg, { key: keyInput, value: valInput, remove: removeBtn });
                });

                keyInput.addEventListener('input', () => { arg.key = keyInput.value; });
                valInput.addEventListener('input', () => { arg.value = valInput.value; });

                removeBtn.addEventListener('click', () => {
                    args.splice(idx, 1);
                    renderArgs(args);
                });

                toggleArgInputs(arg, { key: keyInput, value: valInput, remove: removeBtn });

                row.appendChild(enable);
                row.appendChild(keyInput);
                row.appendChild(valueCell);
                row.appendChild(removeBtn);
                stateEl.args.appendChild(row);
            });
        }

        function render(state) {
            stateEl.title.textContent = 'Glue Job: ' + state.jobName;
            stateEl.region.textContent = 'Region: ' + state.region;
            stateEl.runId.textContent = state.currentRunId ? ('Run: ' + state.currentRunId) : '';
            stateEl.triggerFile.textContent = state.triggerFilePath ? ('Trigger: ' + state.triggerFilePath) : '';
            stateEl.triggerFile.style.display = state.triggerFilePath ? 'inline-block' : 'none';
            stateEl.spinner.style.display = state.isRunning ? 'inline-flex' : 'none';
            renderArgs(state.args || []);
        }

        stateEl.addArg.addEventListener('click', () => {
            const st = currentState || { args: [] };
            st.args.push({ key: '', value: '', enabled: true });
            renderArgs(st.args);
        });

        stateEl.start.addEventListener('click', () => {
            vscode.postMessage({ command: 'start', args: (currentState?.args || []) });
        });

        stateEl.stop.addEventListener('click', () => {
            vscode.postMessage({ command: 'stop' });
        });

        stateEl.logsOut.addEventListener('click', () => {
            vscode.postMessage({ command: 'openLogs', kind: 'output' });
        });

        stateEl.logsErr.addEventListener('click', () => {
            vscode.postMessage({ command: 'openLogs', kind: 'error' });
        });

        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.type === 'state') {
                currentState = message.state;
                render(currentState);
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
        GlueJobRunView.Current = undefined;
        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
exports.GlueJobRunView = GlueJobRunView;
//# sourceMappingURL=GlueJobRunView.js.map