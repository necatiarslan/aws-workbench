import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import * as fs from 'fs';

export class IamRoleTrustNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "person";

        this.OnNodeView.subscribe(() => this.handleNodeView());

        this.SetContextValue();
    }

    public TrustEntity: string = "";
    public TrustType: string = "";
    public Region: string = "";
    public RoleName: string = "";

    public async handleNodeView(): Promise<void> {
        ui.logToOutput('IamRoleTrustNode.NodeView Started');

        if (!this.RoleName) { 
            ui.showWarningMessage('IAM Role information not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        try {
            const result = await api.GetIamRoleTrustPolicy(this.Region, this.RoleName);
            if (!result.isSuccessful) {
                ui.logToOutput('api.GetIamRoleTrustPolicy Error !!!', result.error);
                ui.showErrorMessage('Get Trust Policy Error !!!', result.error);
                return;
            }

            // Display the trust policy document as formatted JSON
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
