"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueRunsGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const GlueJobNode_1 = require("./GlueJobNode");
const GlueRunNode_1 = require("./GlueRunNode");
const api = require("./API");
const ui = require("../common/UI");
const GlueJobRunsReportView_1 = require("./GlueJobRunsReportView");
class GlueRunsGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "history";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.SetContextValue();
    }
    getParentJob() {
        let current = this.Parent;
        while (current) {
            if (current instanceof GlueJobNode_1.GlueJobNode) {
                return current;
            }
            current = current.Parent;
        }
        return undefined;
    }
    async handleNodeView() {
        // Open the runs report webview
        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }
        GlueJobRunsReportView_1.GlueJobRunsReportView.Render(job.Region, job.JobName);
    }
    async handleLoadChildren() {
        ui.logToOutput('GlueRunsGroupNode.handleLoadChildren Started');
        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }
        // Clear existing children
        this.Children.length = 0;
        this.StartWorking();
        try {
            const result = await api.GetGlueJobRuns(job.Region, job.JobName);
            if (!result.isSuccessful || !result.result) {
                ui.showWarningMessage('Failed to load job runs');
                this.StopWorking();
                return;
            }
            // Sort by start time descending
            const runs = result.result.sort((a, b) => {
                const aTime = a.StartedOn?.getTime() || 0;
                const bTime = b.StartedOn?.getTime() || 0;
                return bTime - aTime;
            });
            // Show only last 20 runs in tree, use report for more
            const displayRuns = runs.slice(0, 20);
            for (const run of displayRuns) {
                new GlueRunNode_1.GlueRunNode(run, this);
            }
            if (runs.length > 20) {
                this.description = `${displayRuns.length} of ${runs.length} runs`;
            }
            else {
                this.description = `${runs.length} runs`;
            }
        }
        catch (error) {
            ui.logToOutput('GlueRunsGroupNode.handleLoadChildren Error !!!', error);
            ui.showErrorMessage('Failed to load job runs', error);
        }
        finally {
            this.StopWorking();
        }
    }
}
exports.GlueRunsGroupNode = GlueRunsGroupNode;
//# sourceMappingURL=GlueRunsGroupNode.js.map