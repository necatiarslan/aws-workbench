import { NodeBase } from "../tree/NodeBase";
import { ServiceBase } from "../tree/ServiceBase";
import * as vscode from 'vscode';
import { GlueJobNode } from "./GlueJobNode";
import { TreeState } from "../tree/TreeState";
import { Telemetry } from "../common/Telemetry";
import * as api from "./API";
import * as ui from "../common/UI";
import { Session } from "../common/Session";

export class GlueService extends ServiceBase {   

    public static Current: GlueService;

    constructor() {
        super();
        GlueService.Current = this;
    }

    public async Add(node?: NodeBase): Promise<void> {
        Telemetry.Current?.send("GlueService.Add");
        ui.logToOutput('GlueService.Add Started');

        let selectedRegion = await vscode.window.showInputBox({
            value: Session.Current.AwsRegion, 
            placeHolder: 'Region Name e.g., us-east-1'
        });
        if(!selectedRegion){ return; }

        let jobNameFilter = await vscode.window.showInputBox({
            placeHolder: 'Enter Job Name Filter (or leave empty for all)',
            value: ''
        });
        if(jobNameFilter === undefined){ return; }

        const resultJobs = await api.GetGlueJobList(selectedRegion, jobNameFilter || undefined);
        if(!resultJobs.isSuccessful){ return; }

        if(!resultJobs.result || resultJobs.result.length === 0) {
            ui.showInfoMessage('No Glue jobs found matching the filter');
            return;
        }

        let selectedJobList = await vscode.window.showQuickPick(resultJobs.result, {
            canPickMany: true, 
            placeHolder: 'Select Glue Job(s)'
        });
        if(!selectedJobList || selectedJobList.length === 0){ return; }

        for(const selectedJob of selectedJobList) {
            new GlueJobNode(selectedJob, node).Region = selectedRegion;
        }

        this.TreeSave();
    }
}
