"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepFunctionsService = void 0;
const ServiceBase_1 = require("../tree/ServiceBase");
const vscode = require("vscode");
const StateMachineNode_1 = require("./StateMachineNode");
const TreeState_1 = require("../tree/TreeState");
const Telemetry_1 = require("../common/Telemetry");
const api = require("./API");
const ui = require("../common/UI");
const Session_1 = require("../common/Session");
class StepFunctionsService extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        StepFunctionsService.Current = this;
    }
    async Add(node) {
        Telemetry_1.Telemetry.Current?.send("StepFunctionsService.Add");
        ui.logToOutput('StepFunctionsService.Add Started');
        let selectedRegion = await vscode.window.showInputBox({
            value: Session_1.Session.Current.AwsRegion,
            placeHolder: 'Region Name e.g., us-east-1'
        });
        if (!selectedRegion) {
            return;
        }
        let stateMachineNameFilter = await vscode.window.showInputBox({
            placeHolder: 'Enter State Machine Name (or leave empty for all)',
            value: ''
        });
        if (stateMachineNameFilter === undefined) {
            return;
        }
        const resultStateMachines = await api.GetStateMachineList(selectedRegion, stateMachineNameFilter);
        if (!resultStateMachines.isSuccessful || !resultStateMachines.result) {
            return;
        }
        if (resultStateMachines.result.length === 0) {
            ui.showInfoMessage('No state machines found');
            return;
        }
        const stepFuncList = resultStateMachines.result.map(sm => sm.name || 'UnnamedStateMachine');
        let selectedStateMachineList = await vscode.window.showQuickPick(stepFuncList, { canPickMany: true, placeHolder: 'Select State Machine(s)' });
        if (!selectedStateMachineList || selectedStateMachineList.length === 0) {
            return;
        }
        for (const selectedStateMachine of selectedStateMachineList) {
            new StateMachineNode_1.StateMachineNode(selectedStateMachine, node).Region = selectedRegion;
        }
        TreeState_1.TreeState.save();
    }
}
exports.StepFunctionsService = StepFunctionsService;
//# sourceMappingURL=StepFunctionsService.js.map