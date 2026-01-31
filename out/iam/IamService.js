"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamService = void 0;
const ServiceBase_1 = require("../tree/ServiceBase");
const vscode = require("vscode");
const IamRoleNode_1 = require("./IamRoleNode");
const IamPolicyNode_1 = require("./IamPolicyNode");
const Telemetry_1 = require("../common/Telemetry");
const api = require("./API");
const ui = require("../common/UI");
const Session_1 = require("../common/Session");
class IamService extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        IamService.Current = this;
    }
    async Add(node) {
        Telemetry_1.Telemetry.Current?.send("IamService.Add");
        ui.logToOutput('IamService.Add Started');
        // Ask what type of IAM resource to add
        const resourceType = await vscode.window.showQuickPick(['IAM Role', 'IAM Policy'], { placeHolder: 'Select IAM Resource Type' });
        if (!resourceType) {
            return;
        }
        switch (resourceType) {
            case 'IAM Role':
                await this.AddRole(node);
                break;
            case 'IAM Policy':
                await this.AddPolicy(node);
                break;
        }
    }
    async AddRole(node) {
        Telemetry_1.Telemetry.Current?.send("IamService.AddRole");
        ui.logToOutput('IamService.AddRole Started');
        const selectedRegion = await vscode.window.showInputBox({
            value: Session_1.Session.Current.AwsRegion,
            placeHolder: 'Region Name Exp: us-east-1'
        });
        if (!selectedRegion) {
            return;
        }
        const roleName = await vscode.window.showInputBox({
            placeHolder: 'Enter IAM Role Name / Search Text (leave empty for all)'
        });
        if (roleName === undefined) {
            return;
        }
        const resultRoles = await api.GetIamRoleList(selectedRegion, roleName);
        if (!resultRoles.isSuccessful) {
            return;
        }
        if (resultRoles.result.length === 0) {
            ui.showInfoMessage('No IAM Roles found matching the criteria');
            return;
        }
        const selectedRoleList = await vscode.window.showQuickPick(resultRoles.result, {
            canPickMany: true,
            placeHolder: 'Select IAM Role(s)'
        });
        if (!selectedRoleList || selectedRoleList.length === 0) {
            return;
        }
        for (const selectedRole of selectedRoleList) {
            const roleNode = new IamRoleNode_1.IamRoleNode(selectedRole, node);
            roleNode.Region = selectedRegion;
        }
        this.TreeSave();
    }
    async AddPolicy(node) {
        Telemetry_1.Telemetry.Current?.send("IamService.AddPolicy");
        ui.logToOutput('IamService.AddPolicy Started');
        const selectedRegion = await vscode.window.showInputBox({
            value: Session_1.Session.Current.AwsRegion,
            placeHolder: 'Region Name Exp: us-east-1'
        });
        if (!selectedRegion) {
            return;
        }
        // Ask for policy scope
        const scopeChoice = await vscode.window.showQuickPick(['Customer Managed', 'AWS Managed', 'All'], { placeHolder: 'Select Policy Scope' });
        if (!scopeChoice) {
            return;
        }
        let scope;
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
        if (policyName === undefined) {
            return;
        }
        const resultPolicies = await api.GetIamPolicyList(selectedRegion, policyName, scope);
        if (!resultPolicies.isSuccessful) {
            return;
        }
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
        if (!selectedPolicyList || selectedPolicyList.length === 0) {
            return;
        }
        for (const selectedPolicy of selectedPolicyList) {
            const policyNode = new IamPolicyNode_1.IamPolicyNode(selectedPolicy.label, node);
            policyNode.PolicyArn = selectedPolicy.policyArn;
            policyNode.Region = selectedRegion;
            policyNode.IsAwsManaged = selectedPolicy.isAwsManaged;
        }
        this.TreeSave();
    }
}
exports.IamService = IamService;
//# sourceMappingURL=IamService.js.map