"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFilepath = exports.getCredentialsFilepath = exports.getHomeDir = exports.ENV_CREDENTIALS_PATH = void 0;
exports.GetCredentials = GetCredentials;
exports.isJsonString = isJsonString;
exports.ParseJson = ParseJson;
exports.TestAwsCredentials = TestAwsCredentials;
exports.TestAwsConnection = TestAwsConnection;
exports.GetAwsProfileList = GetAwsProfileList;
exports.getIniProfileData = getIniProfileData;
exports.GetIamRoleList = GetIamRoleList;
exports.GetIamRole = GetIamRole;
exports.GetIamRolePolicies = GetIamRolePolicies;
exports.GetIamRoleTrustPolicy = GetIamRoleTrustPolicy;
exports.GetIamRoleTags = GetIamRoleTags;
exports.AddIamRoleTag = AddIamRoleTag;
exports.UpdateIamRoleTag = UpdateIamRoleTag;
exports.RemoveIamRoleTag = RemoveIamRoleTag;
exports.GetPolicyDocument = GetPolicyDocument;
/* eslint-disable @typescript-eslint/naming-convention */
const credential_providers_1 = require("@aws-sdk/credential-providers");
const client_iam_1 = require("@aws-sdk/client-iam");
const ui = require("../../common/UI");
const MethodResult_1 = require("../../common/MethodResult");
const os_1 = require("os");
const path_1 = require("path");
const parseKnownFiles_1 = require("../../common/aws-sdk/parseKnownFiles");
const IamService_1 = require("./IamService");
async function GetCredentials() {
    let credentials;
    try {
        if (IamService_1.IamService.Instance) {
            process.env.AWS_PROFILE = IamService_1.IamService.Instance.AwsProfile;
        }
        // Get credentials using the default provider chain.
        const provider = (0, credential_providers_1.fromNodeProviderChain)({ ignoreCache: true });
        credentials = await provider();
        if (!credentials) {
            throw new Error("Aws credentials not found !!!");
        }
        ui.logToOutput("Aws credentials AccessKeyId=" + credentials.accessKeyId);
        return credentials;
    }
    catch (error) {
        ui.showErrorMessage("Aws Credentials Not Found !!!", error);
        ui.logToOutput("GetCredentials Error !!!", error);
        return credentials;
    }
}
function isJsonString(jsonString) {
    try {
        var json = ParseJson(jsonString);
        return (typeof json === 'object');
    }
    catch (e) {
        return false;
    }
}
function ParseJson(jsonString) {
    return JSON.parse(jsonString);
}
const client_sts_1 = require("@aws-sdk/client-sts");
async function GetSTSClient(region) {
    const credentials = await GetCredentials();
    const iamClient = new client_sts_1.STSClient({
        region,
        credentials,
        endpoint: IamService_1.IamService.Instance?.AwsEndPoint,
    });
    return iamClient;
}
async function TestAwsCredentials() {
    let result = new MethodResult_1.MethodResult();
    try {
        const credentials = await GetCredentials();
        result.isSuccessful = true;
        result.result = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        return result;
    }
}
async function TestAwsConnection(Region = "us-east-1") {
    let result = new MethodResult_1.MethodResult();
    try {
        const sts = await GetSTSClient(Region);
        const command = new client_sts_1.GetCallerIdentityCommand({});
        const data = await sts.send(command);
        result.isSuccessful = true;
        result.result = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        return result;
    }
}
async function GetAwsProfileList() {
    ui.logToOutput("api.GetAwsProfileList Started");
    let result = new MethodResult_1.MethodResult();
    try {
        let profileData = await getIniProfileData();
        result.result = Object.keys(profileData);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage('api.GetAwsProfileList Error !!!', error);
        ui.logToOutput("api.GetAwsProfileList Error !!!", error);
        return result;
    }
}
async function getIniProfileData(init = {}) {
    const profiles = await (0, parseKnownFiles_1.parseKnownFiles)(init);
    return profiles;
}
exports.ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";
const getHomeDir = () => {
    const { HOME, USERPROFILE, HOMEPATH, HOMEDRIVE = `C:${path_1.sep}` } = process.env;
    if (HOME) {
        return HOME;
    }
    if (USERPROFILE) {
        return USERPROFILE;
    }
    if (HOMEPATH) {
        return `${HOMEDRIVE}${HOMEPATH}`;
    }
    return (0, os_1.homedir)();
};
exports.getHomeDir = getHomeDir;
const getCredentialsFilepath = () => process.env[exports.ENV_CREDENTIALS_PATH] || (0, path_1.join)((0, exports.getHomeDir)(), ".aws", "credentials");
exports.getCredentialsFilepath = getCredentialsFilepath;
const getConfigFilepath = () => process.env[exports.ENV_CREDENTIALS_PATH] || (0, path_1.join)((0, exports.getHomeDir)(), ".aws", "config");
exports.getConfigFilepath = getConfigFilepath;
const client_iam_2 = require("@aws-sdk/client-iam");
async function GetIamClient(region) {
    const credentials = await GetCredentials();
    const iamClient = new client_iam_1.IAMClient({
        region,
        credentials,
        endpoint: IamService_1.IamService.Instance?.AwsEndPoint,
    });
    return iamClient;
}
async function GetIamRoleList(region, RoleName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const iam = await GetIamClient(region);
        let allRoles = [];
        let marker = undefined;
        // Continue fetching pages until no Marker is returned
        do {
            const command = new client_iam_2.ListRolesCommand({ Marker: marker });
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
            matchingRoles = allRoles.filter((role) => role.RoleName?.includes(RoleName) || RoleName.length === 0);
        }
        else {
            matchingRoles = allRoles;
        }
        // Extract the role names into the result
        if (matchingRoles && matchingRoles.length > 0) {
            matchingRoles.forEach((role) => {
                if (role.RoleName)
                    result.result.push(role.RoleName);
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
        const command = new client_iam_2.GetRoleCommand({
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
        const command = new client_iam_2.ListAttachedRolePoliciesCommand({
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
        const command = new client_iam_2.GetRoleCommand({
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
        const command = new client_iam_2.ListRoleTagsCommand({
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
        const command = new client_iam_2.TagRoleCommand({
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
        const command = new client_iam_2.UntagRoleCommand({
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
const client_iam_3 = require("@aws-sdk/client-iam");
async function GetPolicyDocument(Region, PolicyArn) {
    let result = new MethodResult_1.MethodResult();
    try {
        const iam = await GetIamClient(Region);
        // First get the policy to find the default version
        const getPolicyCommand = new client_iam_3.GetPolicyCommand({
            PolicyArn: PolicyArn,
        });
        const policyResponse = await iam.send(getPolicyCommand);
        const defaultVersionId = policyResponse.Policy?.DefaultVersionId;
        if (!defaultVersionId) {
            result.isSuccessful = false;
            result.error = new Error("No default version found for this policy");
            return result;
        }
        // Now get the policy document for the default version
        const getPolicyVersionCommand = new client_iam_3.GetPolicyVersionCommand({
            PolicyArn: PolicyArn,
            VersionId: defaultVersionId,
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
//# sourceMappingURL=API.js.map