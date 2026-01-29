import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import * as fs from 'fs';

export class IamRolePolicyNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "key";

        this.OnNodeView.subscribe(() => this.handleNodeView());

        this.SetContextValue();
    }

    public PolicyName: string = "";
    public PolicyArn: string = "";
    public Region: string = "";

    public async handleNodeView(): Promise<void> {
        ui.logToOutput('IamRolePolicyNode.NodeView Started');

        if (!this.PolicyArn) { 
            ui.showWarningMessage('Policy ARN not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        try {
            const result = await api.GetPolicyDocument(this.Region, this.PolicyArn);
            if (!result.isSuccessful) {
                ui.logToOutput('api.GetPolicyDocument Error !!!', result.error);
                ui.showErrorMessage('Get Policy Document Error !!!', result.error);
                return;
            }

            // Display the policy document as formatted JSON
            const jsonString = JSON.stringify(result.result, null, 2);
            const document = await vscode.workspace.openTextDocument({
                content: jsonString,
                language: 'json'
            });
            await vscode.window.showTextDocument(document);
        } finally {
            this.StopWorking();
        }
    }

}
