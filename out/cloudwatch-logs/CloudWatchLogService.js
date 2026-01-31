"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudWatchLogService = void 0;
const ServiceBase_1 = require("../tree/ServiceBase");
const vscode = require("vscode");
const CloudWatchLogGroupNode_1 = require("./CloudWatchLogGroupNode");
const Telemetry_1 = require("../common/Telemetry");
const api = require("./API");
const ui = require("../common/UI");
const Session_1 = require("../common/Session");
class CloudWatchLogService extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        CloudWatchLogService.Current = this;
    }
    async Add(node) {
        Telemetry_1.Telemetry.Current?.send("CloudWatchLogService.Add");
        ui.logToOutput('CloudWatchLogService..Add Started');
        let selectedRegion = await vscode.window.showInputBox({ value: Session_1.Session.Current.AwsRegion, placeHolder: 'Region Name Exp: us-east-1' });
        if (!selectedRegion) {
            return;
        }
        var resultLogGroup = await api.GetLogGroupList(selectedRegion);
        if (!resultLogGroup.isSuccessful) {
            return;
        }
        let selectedLogGroupList = await vscode.window.showQuickPick(resultLogGroup.result, { canPickMany: true, placeHolder: 'Select Log Group' });
        if (!selectedLogGroupList || selectedLogGroupList.length === 0) {
            return;
        }
        for (var selectedLogGroup of selectedLogGroupList) {
            new CloudWatchLogGroupNode_1.CloudWatchLogGroupNode(selectedLogGroup, node).Region = selectedRegion;
        }
        this.TreeSave();
    }
}
exports.CloudWatchLogService = CloudWatchLogService;
//# sourceMappingURL=CloudWatchLogService.js.map