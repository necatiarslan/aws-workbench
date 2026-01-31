import { NodeBase } from "../tree/NodeBase";
import { ServiceBase } from "../tree/ServiceBase";
import * as vscode from 'vscode';
import { LambdaFunctionNode } from "./LambdaFunctionNode";
import { TreeState } from "../tree/TreeState";
import { Telemetry } from "../common/Telemetry";
import * as api from "./API";
import * as ui from "../common/UI";
import { Session } from "../common/Session";

export class LambdaService extends ServiceBase {   

    public static Current: LambdaService;

    constructor() {
        super();
        LambdaService.Current = this;
    }

    public async Add(node?: NodeBase): Promise<void> {
        Telemetry.Current?.send("LambdaService.Add");
        ui.logToOutput('LambdaService..Add Started');

        let selectedRegion = await vscode.window.showInputBox({value: Session.Current.AwsRegion, placeHolder: 'Region Name Exp: us-east-1'});
        if(!selectedRegion){ return; }

        const lambdaName = await vscode.window.showInputBox({placeHolder: 'Lambda Function Name Filter (Optional)'});
        if(lambdaName===undefined){ return; }

        var resultLambda = await api.GetLambdaList(selectedRegion, lambdaName);
        if(!resultLambda.isSuccessful){ return; }

        let selectedLambdaList = await vscode.window.showQuickPick(resultLambda.result, {canPickMany:true, placeHolder: 'Select Lambda Function'});
        if(!selectedLambdaList || selectedLambdaList.length===0){ return; }
        for(var selectedLambda of selectedLambdaList)
        {
            new LambdaFunctionNode(selectedLambda, node).Region = selectedRegion;
        }

        this.TreeSave();
    }
}