import { NodeBase } from "../tree/NodeBase";
import { ServiceBase } from "../tree/ServiceBase";
import * as vscode from 'vscode';
import { DynamoDBTableNode } from "./DynamoDBTableNode";
import { TreeState } from "../tree/TreeState";
import { Telemetry } from "../common/Telemetry";
import * as api from "./API";
import * as ui from "../common/UI";
import { Session } from "../common/Session";

export class DynamoDBService extends ServiceBase {   

    public static Current: DynamoDBService;

    constructor() {
        super();
        DynamoDBService.Current = this;
    }

    public async Add(node?: NodeBase): Promise<void> {
        Telemetry.Current?.send("DynamoDBService.Add");
        ui.logToOutput('DynamoDBService.Add Started');

        let selectedRegion = await vscode.window.showInputBox({
            value: Session.Current.AwsRegion, 
            placeHolder: 'Region Name e.g., us-east-1'
        });
        if(!selectedRegion){ return; }

        let tableNameFilter = await vscode.window.showInputBox({
            placeHolder: 'Enter Table Name Filter (or leave empty for all)',
            value: ''
        });
        if(tableNameFilter === undefined){ return; }

        const resultTables = await api.GetDynamoDBTableList(selectedRegion, tableNameFilter);
        if(!resultTables.isSuccessful){ return; }

        if(resultTables.result.length === 0) {
            ui.showInfoMessage('No DynamoDB tables found matching the filter');
            return;
        }

        let selectedTableList = await vscode.window.showQuickPick(resultTables.result, {
            canPickMany: true, 
            placeHolder: 'Select DynamoDB Table(s)'
        });
        if(!selectedTableList || selectedTableList.length === 0){ return; }

        for(const selectedTable of selectedTableList) {
            new DynamoDBTableNode(selectedTable, node).Region = selectedRegion;
        }

        TreeState.save();
    }
}
