"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBService = void 0;
const ServiceBase_1 = require("../tree/ServiceBase");
const vscode = require("vscode");
const DynamoDBTableNode_1 = require("./DynamoDBTableNode");
const Telemetry_1 = require("../common/Telemetry");
const api = require("./API");
const ui = require("../common/UI");
const Session_1 = require("../common/Session");
class DynamoDBService extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        DynamoDBService.Current = this;
    }
    async Add(node) {
        Telemetry_1.Telemetry.Current?.send("DynamoDBService.Add");
        ui.logToOutput('DynamoDBService.Add Started');
        let selectedRegion = await vscode.window.showInputBox({
            value: Session_1.Session.Current.AwsRegion,
            placeHolder: 'Region Name e.g., us-east-1'
        });
        if (!selectedRegion) {
            return;
        }
        let tableNameFilter = await vscode.window.showInputBox({
            placeHolder: 'Enter Table Name Filter (or leave empty for all)',
            value: ''
        });
        if (tableNameFilter === undefined) {
            return;
        }
        const resultTables = await api.GetDynamoDBTableList(selectedRegion, tableNameFilter);
        if (!resultTables.isSuccessful) {
            return;
        }
        if (resultTables.result.length === 0) {
            ui.showInfoMessage('No DynamoDB tables found matching the filter');
            return;
        }
        let selectedTableList = await vscode.window.showQuickPick(resultTables.result, {
            canPickMany: true,
            placeHolder: 'Select DynamoDB Table(s)'
        });
        if (!selectedTableList || selectedTableList.length === 0) {
            return;
        }
        for (const selectedTable of selectedTableList) {
            new DynamoDBTableNode_1.DynamoDBTableNode(selectedTable, node).Region = selectedRegion;
        }
        this.TreeSave();
    }
}
exports.DynamoDBService = DynamoDBService;
//# sourceMappingURL=DynamoDBService.js.map