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
exports.DynamoDBService = void 0;
const ServiceBase_1 = require("../tree/ServiceBase");
const vscode = __importStar(require("vscode"));
const DynamoDBTableNode_1 = require("./DynamoDBTableNode");
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const Session_1 = require("../common/Session");
class DynamoDBService extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        DynamoDBService.Current = this;
    }
    async Add(node) {
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