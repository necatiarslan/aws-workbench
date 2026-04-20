"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepFunctionsService = void 0;
const ServiceBase_1 = require("../tree/ServiceBase");
const vscode = __importStar(require("vscode"));
const StateMachineNode_1 = require("./StateMachineNode");
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const Session_1 = require("../common/Session");
class StepFunctionsService extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        StepFunctionsService.Current = this;
    }
    async Add(node) {
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
        this.TreeSave();
    }
}
exports.StepFunctionsService = StepFunctionsService;
//# sourceMappingURL=StepFunctionsService.js.map