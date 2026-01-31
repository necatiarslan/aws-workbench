import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { IamPolicyVersionsGroupNode } from './IamPolicyVersionsGroupNode';
import { IamPolicyAttachmentsGroupNode } from './IamPolicyAttachmentsGroupNode';
import { IamPolicyInfoGroupNode } from './IamPolicyInfoGroupNode';

export class IamPolicyNode extends NodeBase {

    constructor(PolicyName: string, parent?: NodeBase) 
    {
        super(PolicyName, parent);
        this.Icon = "lock";
        this.PolicyName = PolicyName;
        
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;

        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        
        this.LoadDefaultChildren();
        this.SetContextValue();
    }

    @Serialize()
    public PolicyName: string = "";

    @Serialize()
    public PolicyArn: string = "";

    @Serialize()
    public Region: string = "";

    @Serialize()
    public IsAwsManaged: boolean = false;

    public async LoadDefaultChildren(): Promise<void> {
        new IamPolicyVersionsGroupNode("Versions", this);
        new IamPolicyAttachmentsGroupNode("Attachments", this);
        new IamPolicyInfoGroupNode("Info", this);
    }

    private handleNodeRemove(): void {
        this.Remove();
        this.TreeSave();
    }

    private async handleNodeOpen(): Promise<void> {
        ui.logToOutput('IamPolicyNode.NodeOpen Started');

        if (!this.PolicyArn || !this.Region) {
            ui.showWarningMessage('IAM Policy ARN or region is not set.');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        try {
            const result = await api.GetPolicyDocument(this.Region, this.PolicyArn);
            if (result.isSuccessful) {
                const jsonContent = JSON.stringify(result.result, null, 2);
                const document = await vscode.workspace.openTextDocument({
                    content: jsonContent,
                    language: 'json'
                });
                await vscode.window.showTextDocument(document);
            } else {
                ui.showWarningMessage('Failed to load IAM Policy document');
            }
        } catch (error: any) {
            ui.logToOutput('IamPolicyNode.NodeOpen Error !!!', error);
            ui.showErrorMessage('Failed to open IAM Policy document', error);
        }
        this.StopWorking();
    }

    private async handleNodeInfo(): Promise<void> {
        ui.logToOutput('IamPolicyNode.NodeInfo Started');

        if (!this.PolicyArn || !this.Region) {
            ui.showWarningMessage('IAM Policy ARN or region is not set.');
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        try {
            const result = await api.GetIamPolicy(this.Region, this.PolicyArn);
            if (result.isSuccessful && result.result.Policy) {
                const jsonContent = JSON.stringify(result.result.Policy, null, 2);
                const document = await vscode.workspace.openTextDocument({
                    content: jsonContent,
                    language: 'json'
                });
                await vscode.window.showTextDocument(document);
            } else {
                ui.showWarningMessage('Failed to load IAM Policy details');
            }
        } catch (error: any) {
            ui.logToOutput('IamPolicyNode.NodeInfo Error !!!', error);
            ui.showErrorMessage('Failed to open IAM Policy details', error);
        }
        this.StopWorking();
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('IamPolicyNode', IamPolicyNode);
