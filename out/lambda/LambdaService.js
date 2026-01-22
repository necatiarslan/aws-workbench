"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaService = void 0;
const ServiceBase_1 = require("../tree/ServiceBase");
const vscode = require("vscode");
const LambdaFunctionNode_1 = require("./LambdaFunctionNode");
const TreeState_1 = require("../tree/TreeState");
const Telemetry_1 = require("../common/Telemetry");
const api = require("./API");
const ui = require("../common/UI");
const Session_1 = require("../common/Session");
class LambdaService extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        LambdaService.Current = this;
    }
    async Add(node) {
        Telemetry_1.Telemetry.Current?.send("LambdaService.Add");
        ui.logToOutput('LambdaService..Add Started');
        let selectedRegion = await vscode.window.showInputBox({ value: Session_1.Session.Current.AwsRegion, placeHolder: 'Region Name Exp: us-east-1' });
        if (!selectedRegion) {
            return;
        }
        var resultLambda = await api.GetLambdaList(selectedRegion);
        if (!resultLambda.isSuccessful) {
            return;
        }
        let selectedLambdaList = await vscode.window.showQuickPick(resultLambda.result, { canPickMany: true, placeHolder: 'Select Lambda Function' });
        if (!selectedLambdaList || selectedLambdaList.length === 0) {
            return;
        }
        for (var selectedLambda of selectedLambdaList) {
            new LambdaFunctionNode_1.LambdaFunctionNode(selectedLambda, node).Region = selectedRegion;
        }
        TreeState_1.TreeState.save();
    }
}
exports.LambdaService = LambdaService;
//# sourceMappingURL=LambdaService.js.map