import { NodeBase } from "../tree/NodeBase";
import { ServiceBase } from "../tree/ServiceBase";
import * as vscode from 'vscode';
import { CloudWatchLogGroupNode } from "./CloudWatchLogGroupNode";
import { Telemetry } from "../common/Telemetry";
import * as api from "./API";
import * as ui from "../common/UI";
import { Session } from "../common/Session";

export class CloudWatchLogService extends ServiceBase {   

    public static Current: CloudWatchLogService;

    constructor() {
        super();
        CloudWatchLogService.Current = this;
    }

    public async Add(node?: NodeBase): Promise<void> {
		Telemetry.Current?.send("CloudWatchLogService.Add");
		ui.logToOutput('CloudWatchLogService..Add Started');

		let selectedRegion = await vscode.window.showInputBox({value: Session.Current.AwsRegion, placeHolder: 'Region Name Exp: us-east-1'});
		if(!selectedRegion){ return; }

		var resultLogGroup = await api.GetLogGroupList(selectedRegion);
		if(!resultLogGroup.isSuccessful){ return; }

		let selectedLogGroupList = await vscode.window.showQuickPick(resultLogGroup.result, {canPickMany:true, placeHolder: 'Select Log Group'});
		if(!selectedLogGroupList || selectedLogGroupList.length===0){ return; }

		for(var selectedLogGroup of selectedLogGroupList)
		{
			new CloudWatchLogGroupNode(selectedLogGroup, node).Region = selectedRegion;
		}

        this.TreeSave();
    }
}