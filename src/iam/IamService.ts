import { NodeBase } from "../tree/NodeBase";
import { ServiceBase } from "../tree/ServiceBase";
import * as vscode from 'vscode';
import { IamRoleNode } from "./IamRoleNode";
import { IamPolicyNode } from "./IamPolicyNode";
import { TreeState } from "../tree/TreeState";
import { Telemetry } from "../common/Telemetry";
import * as api from "./API";
import * as ui from "../common/UI";
import { Session } from "../common/Session";
import { PolicyScopeType } from "@aws-sdk/client-iam";

export class IamService extends ServiceBase {   

    public static Current: IamService;

    constructor() {
        super();
        IamService.Current = this;
    }

    public async Add(node?: NodeBase): Promise<void> {
        Telemetry.Current?.send("IamService.Add");
        ui.logToOutput('IamService.Add Started');

        // Ask what type of IAM resource to add
        const resourceType = await vscode.window.showQuickPick(
            ['IAM Role', 'IAM Policy'],
            { placeHolder: 'Select IAM Resource Type' }
        );
        if (!resourceType) { return; }

        switch (resourceType) {
            case 'IAM Role':
                await this.AddRole(node);
                break;
            case 'IAM Policy':
                await this.AddPolicy(node);
                break;
        }
    }

    public async AddRole(node?: NodeBase): Promise<void> {
        Telemetry.Current?.send("IamService.AddRole");
        ui.logToOutput('IamService.AddRole Started');

        const selectedRegion = await vscode.window.showInputBox({
            value: Session.Current.AwsRegion, 
            placeHolder: 'Region Name Exp: us-east-1'
        });
        if (!selectedRegion) { return; }

        const roleName = await vscode.window.showInputBox({
            placeHolder: 'Enter IAM Role Name / Search Text (leave empty for all)'
        });
        if (roleName === undefined) { return; }

        const resultRoles = await api.GetIamRoleList(selectedRegion, roleName);
        if (!resultRoles.isSuccessful) { return; }

        if (resultRoles.result.length === 0) {
            ui.showInfoMessage('No IAM Roles found matching the criteria');
            return;
        }

        const selectedRoleList = await vscode.window.showQuickPick(resultRoles.result, {
            canPickMany: true, 
            placeHolder: 'Select IAM Role(s)'
        });
        if (!selectedRoleList || selectedRoleList.length === 0) { return; }

        for (const selectedRole of selectedRoleList) {
            const roleNode = new IamRoleNode(selectedRole, node);
            roleNode.Region = selectedRegion;
        }

        TreeState.save();
    }

    public async AddPolicy(node?: NodeBase): Promise<void> {
        Telemetry.Current?.send("IamService.AddPolicy");
        ui.logToOutput('IamService.AddPolicy Started');

        const selectedRegion = await vscode.window.showInputBox({
            value: Session.Current.AwsRegion, 
            placeHolder: 'Region Name Exp: us-east-1'
        });
        if (!selectedRegion) { return; }

        // Ask for policy scope
        const scopeChoice = await vscode.window.showQuickPick(
            ['Customer Managed', 'AWS Managed', 'All'],
            { placeHolder: 'Select Policy Scope' }
        );
        if (!scopeChoice) { return; }

        let scope: PolicyScopeType;
        switch (scopeChoice) {
            case 'Customer Managed':
                scope = 'Local';
                break;
            case 'AWS Managed':
                scope = 'AWS';
                break;
            case 'All':
                scope = 'All';
                break;
            default:
                scope = 'Local';
        }

        const policyName = await vscode.window.showInputBox({
            placeHolder: 'Enter IAM Policy Name / Search Text (leave empty for all)'
        });
        if (policyName === undefined) { return; }

        const resultPolicies = await api.GetIamPolicyList(selectedRegion, policyName, scope);
        if (!resultPolicies.isSuccessful) { return; }

        if (resultPolicies.result.length === 0) {
            ui.showInfoMessage('No IAM Policies found matching the criteria');
            return;
        }

        // Create QuickPick items with labels showing if AWS managed
        const quickPickItems = resultPolicies.result.map(p => ({
            label: p.PolicyName,
            description: p.IsAwsManaged ? '(AWS Managed)' : '(Customer Managed)',
            policyArn: p.PolicyArn,
            isAwsManaged: p.IsAwsManaged
        }));

        const selectedPolicyList = await vscode.window.showQuickPick(quickPickItems, {
            canPickMany: true, 
            placeHolder: 'Select IAM Policy(s)'
        });
        if (!selectedPolicyList || selectedPolicyList.length === 0) { return; }

        for (const selectedPolicy of selectedPolicyList) {
            const policyNode = new IamPolicyNode(selectedPolicy.label, node);
            policyNode.PolicyArn = selectedPolicy.policyArn;
            policyNode.Region = selectedRegion;
            policyNode.IsAwsManaged = selectedPolicy.isAwsManaged;
        }

        TreeState.save();
    }
}
