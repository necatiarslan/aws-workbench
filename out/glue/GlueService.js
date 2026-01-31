"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueService = void 0;
const ServiceBase_1 = require("../tree/ServiceBase");
const vscode = require("vscode");
const GlueJobNode_1 = require("./GlueJobNode");
const Telemetry_1 = require("../common/Telemetry");
const api = require("./API");
const ui = require("../common/UI");
const Session_1 = require("../common/Session");
class GlueService extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        GlueService.Current = this;
    }
    async Add(node) {
        Telemetry_1.Telemetry.Current?.send("GlueService.Add");
        ui.logToOutput('GlueService.Add Started');
        let selectedRegion = await vscode.window.showInputBox({
            value: Session_1.Session.Current.AwsRegion,
            placeHolder: 'Region Name e.g., us-east-1'
        });
        if (!selectedRegion) {
            return;
        }
        let jobNameFilter = await vscode.window.showInputBox({
            placeHolder: 'Enter Job Name Filter (or leave empty for all)',
            value: ''
        });
        if (jobNameFilter === undefined) {
            return;
        }
        const resultJobs = await api.GetGlueJobList(selectedRegion, jobNameFilter || undefined);
        if (!resultJobs.isSuccessful) {
            return;
        }
        if (!resultJobs.result || resultJobs.result.length === 0) {
            ui.showInfoMessage('No Glue jobs found matching the filter');
            return;
        }
        let selectedJobList = await vscode.window.showQuickPick(resultJobs.result, {
            canPickMany: true,
            placeHolder: 'Select Glue Job(s)'
        });
        if (!selectedJobList || selectedJobList.length === 0) {
            return;
        }
        for (const selectedJob of selectedJobList) {
            new GlueJobNode_1.GlueJobNode(selectedJob, node).Region = selectedRegion;
        }
        this.TreeSave();
    }
}
exports.GlueService = GlueService;
//# sourceMappingURL=GlueService.js.map