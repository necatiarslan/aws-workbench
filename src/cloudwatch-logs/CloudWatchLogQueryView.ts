import * as vscode from "vscode";
import { ResultField } from "@aws-sdk/client-cloudwatch-logs";
import * as api from "./API";
import * as ui from "../common/UI";
import { Session } from "../common/Session";

interface QueryLogRow {
    row: number;
    messageHtml: string;
    timeText: string;
}

type DatePreset = "15m" | "1h" | "6h" | "24h" | "7d";

interface QueryViewState {
    region: string;
    logGroup: string;
    queryText: string;
    datePreset: DatePreset;
    isRunning: boolean;
    rows: QueryLogRow[];
    statusText?: string;
    errorText?: string;
}

export class CloudWatchLogQueryView {
    public static Current: CloudWatchLogQueryView | undefined;

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private readonly disposables: vscode.Disposable[] = [];
    private state: QueryViewState;

    private constructor(panel: vscode.WebviewPanel, region: string, logGroup: string) {
        this.panel = panel;
        this.extensionUri = Session.Current.ExtensionUri;

        this.state = {
            region,
            logGroup,
            queryText: "fields @timestamp, @message | sort @timestamp desc | limit 100",
            datePreset: "1h",
            isRunning: false,
            rows: [],
            statusText: "Ready",
        };

        this.panel.onDidDispose(this.dispose, null, this.disposables);
        this.panel.webview.onDidReceiveMessage(this.handleMessage, this, this.disposables);
        this.render();
    }

    public static Render(region: string, logGroup: string): void {
        ui.logToOutput(`CloudWatchLogQueryView.Render Started - ${logGroup} @ ${region}`);

        if (CloudWatchLogQueryView.Current) {
            CloudWatchLogQueryView.Current.state.region = region;
            CloudWatchLogQueryView.Current.state.logGroup = logGroup;
            CloudWatchLogQueryView.Current.state.rows = [];
            CloudWatchLogQueryView.Current.state.statusText = "Ready";
            CloudWatchLogQueryView.Current.state.errorText = undefined;
            CloudWatchLogQueryView.Current.panel.title = `CloudWatch Query: ${logGroup}`;
            CloudWatchLogQueryView.Current.panel.reveal(vscode.ViewColumn.One);
            CloudWatchLogQueryView.Current.render();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            "CloudWatchLogQueryView",
            `CloudWatch Query: ${logGroup}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
            }
        );

        CloudWatchLogQueryView.Current = new CloudWatchLogQueryView(panel, region, logGroup);
    }

    private render(): void {
        this.panel.webview.html = this.getHtml(this.panel.webview);
    }

    private sendState(): void {
        this.panel.webview.postMessage({ type: "state", state: this.state });
    }

    private async handleMessage(message: any): Promise<void> {
        switch (message.command) {
            case "ready":
                this.sendState();
                return;
            case "run":
                await this.handleRun(message.queryText as string, message.datePreset as DatePreset);
                return;
            default:
                return;
        }
    }

    private getPresetMs(preset: DatePreset): number {
        switch (preset) {
            case "15m":
                return 15 * 60 * 1000;
            case "1h":
                return 60 * 60 * 1000;
            case "6h":
                return 6 * 60 * 60 * 1000;
            case "24h":
                return 24 * 60 * 60 * 1000;
            case "7d":
                return 7 * 24 * 60 * 60 * 1000;
            default:
                return 60 * 60 * 1000;
        }
    }

    private escapeHtml(input: string): string {
        return input
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    private setCustomColorCoding(message: string): string {
        let result = this.escapeHtml(message);
        result = result.replace(/(error)/ig, "<span class=\"color_code_red\">$1</span>");
        result = result.replace(/(exception)/ig, "<span class=\"color_code_red\">$1</span>");
        return result;
    }

    private formatLocalDateTime(timestampValue: string): string {
        if (!timestampValue) {
            return "";
        }

        const numeric = Number(timestampValue);
        if (!isNaN(numeric)) {
            // Treat 10-digit numeric timestamps as epoch seconds, otherwise epoch milliseconds.
            const epochMs = numeric < 1e12 ? numeric * 1000 : numeric;
            const epochDate = new Date(epochMs);
            if (!isNaN(epochDate.getTime())) {
                return epochDate.toLocaleString();
            }
        }

        const parsed = new Date(timestampValue);
        if (!isNaN(parsed.getTime())) {
            return parsed.toLocaleString();
        }

        return timestampValue;
    }

    private mapResultFields(fields: ResultField[] | undefined, rowNumber: number): QueryLogRow {
        const timestampValue = api.GetInsightsFieldValue(fields, "@timestamp");
        const messageValue = api.GetInsightsFieldValue(fields, "@message");

        const timeText = this.formatLocalDateTime(timestampValue);

        let message = messageValue;
        if (!message) {
            const normalized = (fields ?? [])
                .filter((f) => (f.field ?? "") !== "@ptr")
                .map((f) => `${f.field ?? "field"}: ${f.value ?? ""}`)
                .join(" | ");
            message = normalized || "(no message)";
        }

        return {
            row: rowNumber,
            messageHtml: this.setCustomColorCoding(message),
            timeText,
        };
    }

    private async handleRun(queryTextInput: string, datePresetInput: DatePreset): Promise<void> {
        const queryText = (queryTextInput || "").trim();
        if (!queryText) {
            ui.showInfoMessage("Please enter a query.");
            return;
        }

        this.state.queryText = queryText;
        this.state.datePreset = datePresetInput;
        this.state.isRunning = true;
        this.state.errorText = undefined;
        this.state.statusText = "Running query...";
        this.sendState();

        try {
            const endTimeMs = Date.now();
            const startTimeMs = endTimeMs - this.getPresetMs(this.state.datePreset);
            const startTimeSec = Math.floor(startTimeMs / 1000);
            const endTimeSec = Math.floor(endTimeMs / 1000);

            const startResult = await api.StartCloudWatchInsightsQuery(
                this.state.region,
                this.state.logGroup,
                this.state.queryText,
                startTimeSec,
                endTimeSec
            );
            if (!startResult.isSuccessful || !startResult.result) {
                this.state.errorText = (startResult.error as Error | undefined)?.message || "Failed to start query.";
                this.state.statusText = "Start failed";
                this.state.rows = [];
                return;
            }

            this.state.statusText = `Query started: ${startResult.result}`;
            this.sendState();

            const queryResult = await api.PollCloudWatchInsightsQuery(this.state.region, startResult.result, 30000, 1000);
            if (!queryResult.isSuccessful || !queryResult.result) {
                this.state.errorText = (queryResult.error as Error | undefined)?.message || "Query did not complete successfully.";
                this.state.statusText = "Query failed";
                this.state.rows = [];
                return;
            }

            const rawRows = queryResult.result.results ?? [];
            this.state.rows = rawRows.map((fields, index) => this.mapResultFields(fields, index + 1));
            this.state.statusText = `Complete - ${this.state.rows.length} rows`;
            this.state.errorText = undefined;
        } catch (error: any) {
            this.state.errorText = error?.message || "Unexpected error while running query.";
            this.state.statusText = "Query failed";
            this.state.rows = [];
            ui.showErrorMessage("CloudWatchLogQueryView Query Error !!!", error);
            ui.logToOutput("CloudWatchLogQueryView Query Error !!!", error);
        } finally {
            this.state.isRunning = false;
            this.sendState();
        }
    }

    private getHtml(webview: vscode.Webview): string {
        const vscodeElementsUri = ui.getUri(webview, this.extensionUri, ["node_modules", "@vscode-elements", "elements", "dist", "bundled.js"]);
        const styleUri = ui.getUri(webview, this.extensionUri, ["media", "cloudwatch-logs", "style.css"]);
        const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "node_modules", "@vscode/codicons", "dist", "codicon.css"));
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; font-src ${webview.cspSource};">
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <script type="module" src="${vscodeElementsUri}"></script>
    <link rel="stylesheet" href="${styleUri}">
    <link href="${codiconsUri}" rel="stylesheet" id="vscode-codicon-stylesheet"/>
    <title>CloudWatch Query</title>
    <style>
      .toolbar { display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px; }
      .toolbar-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
            .preset-btn {
                opacity: 0.82;
                --button-foreground: var(--vscode-button-secondaryForeground);
                --button-background: var(--vscode-button-secondaryBackground);
                --button-hover-background: var(--vscode-button-secondaryHoverBackground);
            }
            .preset-btn[aria-pressed="true"] {
                opacity: 1;
                outline: 1px solid var(--vscode-focusBorder);
            }
      .status { color: var(--vscode-descriptionForeground); }
      .error { color: var(--vscode-editorError-foreground); }
      .message-cell { word-wrap: break-word; overflow-wrap: break-word; white-space: normal; vertical-align: top; }
            .query-textarea {
                width: 100%;
                min-height: 92px;
                resize: vertical;
                box-sizing: border-box;
                padding: 8px;
                font-family: var(--vscode-editor-font-family);
                font-size: var(--vscode-editor-font-size);
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
            }
            .query-textarea:focus {
                outline: 1px solid var(--vscode-focusBorder);
                outline-offset: 0;
            }
    </style>
</head>
<body>
    <div class="toolbar">
      <div class="toolbar-row">
        <h2 id="title" style="margin:0;">CloudWatch Query</h2>
        <span id="progress" style="display:none;"><vscode-progress-ring></vscode-progress-ring></span>
      </div>
      <div class="toolbar-row">
                <textarea id="queryText" class="query-textarea" placeholder="Enter CloudWatch Logs Insights query"></textarea>
      </div>
      <div class="toolbar-row">
        Date Range:
        <vscode-button class="preset-btn" secondary data-preset="15m">15m</vscode-button>
        <vscode-button class="preset-btn" secondary data-preset="1h">1h</vscode-button>
        <vscode-button class="preset-btn" secondary data-preset="6h">6h</vscode-button>
        <vscode-button class="preset-btn" secondary data-preset="24h">24h</vscode-button>
        <vscode-button class="preset-btn" secondary data-preset="7d">7d</vscode-button>
        |
        <vscode-button id="runBtn" primary>Run</vscode-button>
      </div>
      <div class="toolbar-row">
        <span id="statusText" class="status"></span>
      </div>
      <div class="toolbar-row">
        <span id="errorText" class="error"></span>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
      <tr>
        <th style="width: 10px;">#</th>
        <th>Message</th>
        <th style="width: 210px;">Time</th>
      </tr>
      <tbody id="resultRows"></tbody>
    </table>

    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      let currentState = undefined;

      const el = {
        title: document.getElementById('title'),
        queryText: document.getElementById('queryText'),
        runBtn: document.getElementById('runBtn'),
        statusText: document.getElementById('statusText'),
        errorText: document.getElementById('errorText'),
        progress: document.getElementById('progress'),
        resultRows: document.getElementById('resultRows'),
      };

      const presetButtons = Array.from(document.querySelectorAll('.preset-btn'));

      function setSelectedPreset(preset) {
        presetButtons.forEach((btn) => {
          btn.setAttribute('aria-pressed', btn.dataset.preset === preset ? 'true' : 'false');
        });
      }

      function renderRows(rows) {
        if (!rows || rows.length === 0) {
          el.resultRows.innerHTML = '<tr><td colspan="3">no log</td></tr>';
          return;
        }

        el.resultRows.innerHTML = rows
          .map((row) => '<tr>' +
            '<td>' + row.row + '</td>' +
            '<td class="message-cell">' + row.messageHtml + '</td>' +
            '<td style="white-space:nowrap;">' + (row.timeText || '') + '</td>' +
          '</tr>')
          .join('');
      }

      function render(state) {
        if (!state) { return; }
        el.title.textContent = 'CloudWatch Query: ' + state.logGroup;
        el.queryText.value = state.queryText || '';
        el.statusText.textContent = state.statusText || '';
        el.errorText.textContent = state.errorText || '';
        el.progress.style.display = state.isRunning ? 'inline-flex' : 'none';
        setSelectedPreset(state.datePreset || '1h');
        renderRows(state.rows || []);
      }

      presetButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          if (!currentState) { return; }
          currentState.datePreset = btn.dataset.preset;
          setSelectedPreset(currentState.datePreset);
        });
      });

      el.runBtn.addEventListener('click', () => {
        if (!currentState) { return; }
        const payload = {
          command: 'run',
          queryText: el.queryText.value,
          datePreset: currentState.datePreset || '1h',
        };
        vscode.postMessage(payload);
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

    private getNonce(): string {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    public dispose(): void {
        CloudWatchLogQueryView.Current = undefined;
        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
