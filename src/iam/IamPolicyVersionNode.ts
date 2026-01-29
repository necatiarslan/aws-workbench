import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import * as fs from 'fs';

export class IamPolicyVersionNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "file-code";

        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.OnNodeView.subscribe(() => this.handleNodeView());

        this.SetContextValue();
    }

    public VersionId: string = "";
    public IsDefault: boolean = false;
    public CreateDate: string = "";
    public PolicyArn: string = "";
    public PolicyName: string = "";
    public Region: string = "";

    public async handleNodeOpen(): Promise<void> {
        ui.logToOutput('IamPolicyVersionNode.NodeOpen Started');

        if (!this.PolicyArn || !this.VersionId) { 
            ui.showWarningMessage('Policy version information not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        try {
            const result = await api.GetPolicyDocument(this.Region, this.PolicyArn, this.VersionId);
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

    public async handleNodeView(): Promise<void> {
        ui.logToOutput('IamPolicyVersionNode.NodeView (Download) Started');

        if (!this.PolicyArn || !this.VersionId) { 
            ui.showWarningMessage('Policy version information not found');
            return;
        }

        if (this.IsWorking) { return; }
        this.StartWorking();

        try {
            const result = await api.GetPolicyDocument(this.Region, this.PolicyArn, this.VersionId);
            if (!result.isSuccessful) {
                ui.logToOutput('api.GetPolicyDocument Error !!!', result.error);
                ui.showErrorMessage('Get Policy Document Error !!!', result.error);
                return;
            }

            // Ask user where to save the file
            const saveOptions: vscode.SaveDialogOptions = {
                defaultUri: vscode.Uri.file(`${this.PolicyName}-${this.VersionId}.json`),
                filters: {
                    'JSON files': ['json'],
                    'All files': ['*']
                }
            };

            const fileUri = await vscode.window.showSaveDialog(saveOptions);
            
            if (!fileUri) {
                return;
            }

            // Save the policy document to file
            const jsonString = JSON.stringify(result.result, null, 2);
            fs.writeFileSync(fileUri.fsPath, jsonString, 'utf8');
            ui.showInfoMessage(`Policy saved to ${fileUri.fsPath}`);
            ui.logToOutput(`Policy saved to ${fileUri.fsPath}`);
        } catch (error: any) {
            ui.showErrorMessage('Failed to save policy file', error);
            ui.logToOutput('Failed to save policy file', error);
        } finally {
            this.StopWorking();
        }
    }

}
