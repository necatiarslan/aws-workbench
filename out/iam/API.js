"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetIamClient = GetIamClient;
exports.GetIamRoleList = GetIamRoleList;
exports.GetIamRole = GetIamRole;
exports.GetIamRolePolicies = GetIamRolePolicies;
exports.GetIamRoleTrustPolicy = GetIamRoleTrustPolicy;
exports.GetIamRoleTags = GetIamRoleTags;
exports.AddIamRoleTag = AddIamRoleTag;
exports.UpdateIamRoleTag = UpdateIamRoleTag;
exports.RemoveIamRoleTag = RemoveIamRoleTag;
exports.GetIamPolicyList = GetIamPolicyList;
exports.GetIamPolicy = GetIamPolicy;
exports.GetPolicyDocument = GetPolicyDocument;
exports.GetPolicyVersions = GetPolicyVersions;
exports.GetPolicyEntities = GetPolicyEntities;
/* eslint-disable @typescript-eslint/naming-convention */
const client_iam_1 = require("@aws-sdk/client-iam");
const ui = require("../common/UI");
const MethodResult_1 = require("../common/MethodResult");
const Session_1 = require("../common/Session");
async function GetIamClient(region) {
    const credentials = await Session_1.Session.Current.GetCredentials();
    const iamClient = new client_iam_1.IAMClient({
        region,
        credentials,
        endpoint: Session_1.Session.Current.AwsEndPoint,
    });
    return iamClient;
}
// ==================== IAM ROLES ====================
async function GetIamRoleList(region, RoleName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const iam = await GetIamClient(region);
        let allRoles = [];
        let marker = undefined;
        // Continue fetching pages until no Marker is returned
        do {
            const command = new client_iam_1.ListRolesCommand({ Marker: marker });
            const rolesList = await iam.send(command);
            if (rolesList.Roles) {
                allRoles.push(...rolesList.Roles);
            }
            // Update marker to the next page (if present)
            marker = rolesList.Marker;
        } while (marker);
        // Filter roles if a RoleName filter is provided
        let matchingRoles;
        if (RoleName) {
            matchingRoles = allRoles.filter((role) => role.RoleName?.toLowerCase().includes(RoleName.toLowerCase()) || RoleName.length === 0);
        }
        else {
            matchingRoles = allRoles;
        }
        // Extract the role names into the result
        if (matchingRoles && matchingRoles.length > 0) {
            matchingRoles.forEach((role) => {
                if (role.RoleName) {
                    result.result.push(role.RoleName);
                }
            });
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetIamRoleList Error !!!", error);
        ui.logToOutput("api.GetIamRoleList Error !!!", error);
        return result;
    }
}
async function GetIamRole(Region, RoleName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const iam = await GetIamClient(Region);
        const command = new client_iam_1.GetRoleCommand({
            RoleName: RoleName,
        });
        const response = await iam.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetIamRole Error !!!", error);
        ui.logToOutput("api.GetIamRole Error !!!", error);
        return result;
    }
}
async function GetIamRolePolicies(Region, RoleName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const iam = await GetIamClient(Region);
        const command = new client_iam_1.ListAttachedRolePoliciesCommand({
            RoleName: RoleName,
        });
        const response = await iam.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetIamRolePolicies Error !!!", error);
        ui.logToOutput("api.GetIamRolePolicies Error !!!", error);
        return result;
    }
}
async function GetIamRoleTrustPolicy(Region, RoleName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const iam = await GetIamClient(Region);
        const command = new client_iam_1.GetRoleCommand({
            RoleName: RoleName,
        });
        const response = await iam.send(command);
        if (response.Role?.AssumeRolePolicyDocument) {
            // The trust policy is URL-encoded, so we need to decode it
            const decodedPolicy = decodeURIComponent(response.Role.AssumeRolePolicyDocument);
            result.result = JSON.parse(decodedPolicy);
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetIamRoleTrustPolicy Error !!!", error);
        ui.logToOutput("api.GetIamRoleTrustPolicy Error !!!", error);
        return result;
    }
}
async function GetIamRoleTags(Region, RoleName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const iam = await GetIamClient(Region);
        const command = new client_iam_1.ListRoleTagsCommand({
            RoleName: RoleName,
        });
        const response = await iam.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetIamRoleTags Error !!!", error);
        ui.logToOutput("api.GetIamRoleTags Error !!!", error);
        return result;
    }
}
async function AddIamRoleTag(Region, RoleName, TagKey, TagValue) {
    let result = new MethodResult_1.MethodResult();
    try {
        const iam = await GetIamClient(Region);
        const command = new client_iam_1.TagRoleCommand({
            RoleName: RoleName,
            Tags: [
                {
                    Key: TagKey,
                    Value: TagValue
                }
            ]
        });
        const response = await iam.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.AddIamRoleTag Error !!!", error);
        ui.logToOutput("api.AddIamRoleTag Error !!!", error);
        return result;
    }
}
async function UpdateIamRoleTag(Region, RoleName, TagKey, TagValue) {
    // In IAM, updating a tag is the same as adding it (it overwrites if exists)
    return await AddIamRoleTag(Region, RoleName, TagKey, TagValue);
}
async function RemoveIamRoleTag(Region, RoleName, TagKey) {
    let result = new MethodResult_1.MethodResult();
    try {
        const iam = await GetIamClient(Region);
        const command = new client_iam_1.UntagRoleCommand({
            RoleName: RoleName,
            TagKeys: [TagKey]
        });
        const response = await iam.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.RemoveIamRoleTag Error !!!", error);
        ui.logToOutput("api.RemoveIamRoleTag Error !!!", error);
        return result;
    }
}
// ==================== IAM POLICIES ====================
async function GetIamPolicyList(region, PolicyName, Scope = "Local") {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const iam = await GetIamClient(region);
        let allPolicies = [];
        let marker = undefined;
        // Continue fetching pages until no Marker is returned
        do {
            const command = new client_iam_1.ListPoliciesCommand({
                Marker: marker,
                Scope: Scope,
                OnlyAttached: false
            });
            const policiesList = await iam.send(command);
            if (policiesList.Policies) {
                for (const policy of policiesList.Policies) {
                    if (policy.PolicyName && policy.Arn) {
                        allPolicies.push({
                            PolicyName: policy.PolicyName,
                            PolicyArn: policy.Arn,
                            IsAwsManaged: policy.Arn.startsWith("arn:aws:iam::aws:")
                        });
                    }
                }
            }
            // Update marker to the next page (if present)
            marker = policiesList.Marker;
        } while (marker);
        // Filter policies if a PolicyName filter is provided
        let matchingPolicies;
        if (PolicyName) {
            matchingPolicies = allPolicies.filter((policy) => policy.PolicyName.toLowerCase().includes(PolicyName.toLowerCase()) || PolicyName.length === 0);
        }
        else {
            matchingPolicies = allPolicies;
        }
        result.result = matchingPolicies;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetIamPolicyList Error !!!", error);
        ui.logToOutput("api.GetIamPolicyList Error !!!", error);
        return result;
    }
}
async function GetIamPolicy(Region, PolicyArn) {
    let result = new MethodResult_1.MethodResult();
    try {
        const iam = await GetIamClient(Region);
        const command = new client_iam_1.GetPolicyCommand({
            PolicyArn: PolicyArn,
        });
        const response = await iam.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetIamPolicy Error !!!", error);
        ui.logToOutput("api.GetIamPolicy Error !!!", error);
        return result;
    }
}
async function GetPolicyDocument(Region, PolicyArn, VersionId) {
    let result = new MethodResult_1.MethodResult();
    try {
        const iam = await GetIamClient(Region);
        let versionToFetch = VersionId;
        // If no version specified, get the default version
        if (!versionToFetch) {
            const getPolicyCommand = new client_iam_1.GetPolicyCommand({
                PolicyArn: PolicyArn,
            });
            const policyResponse = await iam.send(getPolicyCommand);
            versionToFetch = policyResponse.Policy?.DefaultVersionId;
            if (!versionToFetch) {
                result.isSuccessful = false;
                result.error = new Error("No default version found for this policy");
                return result;
            }
        }
        // Now get the policy document for the version
        const getPolicyVersionCommand = new client_iam_1.GetPolicyVersionCommand({
            PolicyArn: PolicyArn,
            VersionId: versionToFetch,
        });
        const versionResponse = await iam.send(getPolicyVersionCommand);
        if (versionResponse.PolicyVersion?.Document) {
            // The policy document is URL-encoded, so we need to decode it
            const decodedDocument = decodeURIComponent(versionResponse.PolicyVersion.Document);
            result.result = JSON.parse(decodedDocument);
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetPolicyDocument Error !!!", error);
        ui.logToOutput("api.GetPolicyDocument Error !!!", error);
        return result;
    }
}
async function GetPolicyVersions(Region, PolicyArn) {
    let result = new MethodResult_1.MethodResult();
    try {
        const iam = await GetIamClient(Region);
        const command = new client_iam_1.ListPolicyVersionsCommand({
            PolicyArn: PolicyArn,
        });
        const response = await iam.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetPolicyVersions Error !!!", error);
        ui.logToOutput("api.GetPolicyVersions Error !!!", error);
        return result;
    }
}
async function GetPolicyEntities(Region, PolicyArn) {
    let result = new MethodResult_1.MethodResult();
    try {
        const iam = await GetIamClient(Region);
        const command = new client_iam_1.ListEntitiesForPolicyCommand({
            PolicyArn: PolicyArn,
        });
        const response = await iam.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetPolicyEntities Error !!!", error);
        ui.logToOutput("api.GetPolicyEntities Error !!!", error);
        return result;
    }
}
//# sourceMappingURL=API.js.map