import { NodeBase } from "../tree/NodeBase";
import { ServiceBase } from "../tree/ServiceBase";
import * as vscode from 'vscode';
import { StateMachineNode } from "./StateMachineNode";
import { TreeState } from "../tree/TreeState";
import { Telemetry } from "../common/Telemetry";
import * as api from "./API";
import * as ui from "../common/UI";
import { Session } from "../common/Session";

export class StepFunctionsService extends ServiceBase {   

    public static Current: StepFunctionsService;

    constructor() {
        super();
        StepFunctionsService.Current = this;
    }

    public async Add(node?: NodeBase): Promise<void> {
        Telemetry.Current?.send("StepFunctionsService.Add");
        ui.logToOutput('StepFunctionsService.Add Started');

        let selectedRegion = await vscode.window.showInputBox({
            value: Session.Current.AwsRegion, 
            placeHolder: 'Region Name e.g., us-east-1'
        });
        if(!selectedRegion){ return; }

        let stateMachineNameFilter = await vscode.window.showInputBox({
            placeHolder: 'Enter State Machine Name (or leave empty for all)',
            value: ''
        });
        if(stateMachineNameFilter === undefined){ return; }

        const resultStateMachines = await api.GetStateMachineList(selectedRegion, stateMachineNameFilter);
        if(!resultStateMachines.isSuccessful || !resultStateMachines.result){ return; }

        if(resultStateMachines.result.length === 0) {
            ui.showInfoMessage('No state machines found');
            return;
        }
        const stepFuncList = resultStateMachines.result.map(sm => sm.name || 'UnnamedStateMachine');
        let selectedStateMachineList = await vscode.window.showQuickPick(
            stepFuncList, 
            {canPickMany: true, placeHolder: 'Select State Machine(s)'}
        );
        if(!selectedStateMachineList || selectedStateMachineList.length === 0){ return; }

        for(const selectedStateMachine of selectedStateMachineList) {
            new StateMachineNode(selectedStateMachine, node).Region = selectedRegion;
        }

        TreeState.save();
    }
}
