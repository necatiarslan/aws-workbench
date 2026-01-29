/* eslint-disable @typescript-eslint/naming-convention */
import { 
    IAMClient,
    ListRolesCommand,
    GetRoleCommand,
    GetRoleCommandOutput,
    ListAttachedRolePoliciesCommand,
    ListAttachedRolePoliciesCommandOutput,
    ListRoleTagsCommand,
    ListRoleTagsCommandOutput,
    TagRoleCommand,
    UntagRoleCommand,
    ListPoliciesCommand,
    ListPoliciesCommandOutput,
    GetPolicyCommand,
    GetPolicyCommandOutput,
    GetPolicyVersionCommand,
    GetPolicyVersionCommandOutput,
    ListPolicyVersionsCommand,
    ListPolicyVersionsCommandOutput,
    ListEntitiesForPolicyCommand,
    ListEntitiesForPolicyCommandOutput,
    PolicyScopeType
} from "@aws-sdk/client-iam";
import * as ui from "../common/UI";
import { MethodResult } from '../common/MethodResult';
import { Session } from '../common/Session';

export async function GetIamClient(region: string) {
    const credentials = await Session.Current.GetCredentials();
    
    const iamClient = new IAMClient({
        region,
        credentials,
        endpoint: Session.Current.AwsEndPoint,
    });
    
    return iamClient;
}

// ==================== IAM ROLES ====================

export async function GetIamRoleList(
    region: string,
    RoleName?: string
): Promise<MethodResult<string[]>> {
    let result: MethodResult<string[]> = new MethodResult<string[]>();
    result.result = [];

    try {
        const iam = await GetIamClient(region);
        
        let allRoles = [];
        let marker: string | undefined = undefined;
        
        // Continue fetching pages until no Marker is returned
        do {
            const command: ListRolesCommand = new ListRolesCommand({ Marker: marker });
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
            matchingRoles = allRoles.filter(
                (role) =>
                    role.RoleName?.toLowerCase().includes(RoleName.toLowerCase()) || RoleName.length === 0
            );
        } else {
            matchingRoles = allRoles;
        }

        // Extract the role names into the result
        if (matchingRoles && matchingRoles.length > 0) {
            matchingRoles.forEach((role) => {
                if (role.RoleName) { result.result.push(role.RoleName); }
            });
        }

        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetIamRoleList Error !!!", error);
        ui.logToOutput("api.GetIamRoleList Error !!!", error);
        return result;
    }
}

export async function GetIamRole(
    Region: string,
    RoleName: string
): Promise<MethodResult<GetRoleCommandOutput>> {
    let result: MethodResult<GetRoleCommandOutput> = new MethodResult<GetRoleCommandOutput>();

    try {
        const iam = await GetIamClient(Region);

        const command = new GetRoleCommand({
            RoleName: RoleName,
        });

        const response = await iam.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetIamRole Error !!!", error);
        ui.logToOutput("api.GetIamRole Error !!!", error);
        return result;
    }
}

export async function GetIamRolePolicies(
    Region: string,
    RoleName: string
): Promise<MethodResult<ListAttachedRolePoliciesCommandOutput>> {
    let result: MethodResult<ListAttachedRolePoliciesCommandOutput> = 
        new MethodResult<ListAttachedRolePoliciesCommandOutput>();

    try {
        const iam = await GetIamClient(Region);

        const command = new ListAttachedRolePoliciesCommand({
            RoleName: RoleName,
        });

        const response = await iam.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetIamRolePolicies Error !!!", error);
        ui.logToOutput("api.GetIamRolePolicies Error !!!", error);
        return result;
    }
}

export async function GetIamRoleTrustPolicy(
    Region: string,
    RoleName: string
): Promise<MethodResult<any>> {
    let result: MethodResult<any> = new MethodResult<any>();

    try {
        const iam = await GetIamClient(Region);

        const command = new GetRoleCommand({
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
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetIamRoleTrustPolicy Error !!!", error);
        ui.logToOutput("api.GetIamRoleTrustPolicy Error !!!", error);
        return result;
    }
}

export async function GetIamRoleTags(
    Region: string,
    RoleName: string
): Promise<MethodResult<ListRoleTagsCommandOutput>> {
    let result: MethodResult<ListRoleTagsCommandOutput> = 
        new MethodResult<ListRoleTagsCommandOutput>();

    try {
        const iam = await GetIamClient(Region);

        const command = new ListRoleTagsCommand({
            RoleName: RoleName,
        });

        const response = await iam.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetIamRoleTags Error !!!", error);
        ui.logToOutput("api.GetIamRoleTags Error !!!", error);
        return result;
    }
}

export async function AddIamRoleTag(
    Region: string,
    RoleName: string,
    TagKey: string,
    TagValue: string
): Promise<MethodResult<any>> {
    let result: MethodResult<any> = new MethodResult<any>();

    try {
        const iam = await GetIamClient(Region);

        const command = new TagRoleCommand({
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
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.AddIamRoleTag Error !!!", error);
        ui.logToOutput("api.AddIamRoleTag Error !!!", error);
        return result;
    }
}

export async function UpdateIamRoleTag(
    Region: string,
    RoleName: string,
    TagKey: string,
    TagValue: string
): Promise<MethodResult<any>> {
    // In IAM, updating a tag is the same as adding it (it overwrites if exists)
    return await AddIamRoleTag(Region, RoleName, TagKey, TagValue);
}

export async function RemoveIamRoleTag(
    Region: string,
    RoleName: string,
    TagKey: string
): Promise<MethodResult<any>> {
    let result: MethodResult<any> = new MethodResult<any>();

    try {
        const iam = await GetIamClient(Region);

        const command = new UntagRoleCommand({
            RoleName: RoleName,
            TagKeys: [TagKey]
        });

        const response = await iam.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.RemoveIamRoleTag Error !!!", error);
        ui.logToOutput("api.RemoveIamRoleTag Error !!!", error);
        return result;
    }
}

// ==================== IAM POLICIES ====================

export async function GetIamPolicyList(
    region: string,
    PolicyName?: string,
    Scope: PolicyScopeType = "Local"
): Promise<MethodResult<{ PolicyName: string; PolicyArn: string; IsAwsManaged: boolean }[]>> {
    let result: MethodResult<{ PolicyName: string; PolicyArn: string; IsAwsManaged: boolean }[]> = 
        new MethodResult<{ PolicyName: string; PolicyArn: string; IsAwsManaged: boolean }[]>();
    result.result = [];

    try {
        const iam = await GetIamClient(region);
        
        let allPolicies: { PolicyName: string; PolicyArn: string; IsAwsManaged: boolean }[] = [];
        let marker: string | undefined = undefined;
        
        // Continue fetching pages until no Marker is returned
        do {
            const command: ListPoliciesCommand = new ListPoliciesCommand({ 
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
            matchingPolicies = allPolicies.filter(
                (policy) =>
                    policy.PolicyName.toLowerCase().includes(PolicyName.toLowerCase()) || PolicyName.length === 0
            );
        } else {
            matchingPolicies = allPolicies;
        }

        result.result = matchingPolicies;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetIamPolicyList Error !!!", error);
        ui.logToOutput("api.GetIamPolicyList Error !!!", error);
        return result;
    }
}

export async function GetIamPolicy(
    Region: string,
    PolicyArn: string
): Promise<MethodResult<GetPolicyCommandOutput>> {
    let result: MethodResult<GetPolicyCommandOutput> = new MethodResult<GetPolicyCommandOutput>();

    try {
        const iam = await GetIamClient(Region);

        const command = new GetPolicyCommand({
            PolicyArn: PolicyArn,
        });

        const response = await iam.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetIamPolicy Error !!!", error);
        ui.logToOutput("api.GetIamPolicy Error !!!", error);
        return result;
    }
}

export async function GetPolicyDocument(
    Region: string,
    PolicyArn: string,
    VersionId?: string
): Promise<MethodResult<any>> {
    let result: MethodResult<any> = new MethodResult<any>();

    try {
        const iam = await GetIamClient(Region);

        let versionToFetch = VersionId;

        // If no version specified, get the default version
        if (!versionToFetch) {
            const getPolicyCommand = new GetPolicyCommand({
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
        const getPolicyVersionCommand = new GetPolicyVersionCommand({
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
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetPolicyDocument Error !!!", error);
        ui.logToOutput("api.GetPolicyDocument Error !!!", error);
        return result;
    }
}

export async function GetPolicyVersions(
    Region: string,
    PolicyArn: string
): Promise<MethodResult<ListPolicyVersionsCommandOutput>> {
    let result: MethodResult<ListPolicyVersionsCommandOutput> = 
        new MethodResult<ListPolicyVersionsCommandOutput>();

    try {
        const iam = await GetIamClient(Region);

        const command = new ListPolicyVersionsCommand({
            PolicyArn: PolicyArn,
        });

        const response = await iam.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetPolicyVersions Error !!!", error);
        ui.logToOutput("api.GetPolicyVersions Error !!!", error);
        return result;
    }
}

export async function GetPolicyEntities(
    Region: string,
    PolicyArn: string
): Promise<MethodResult<ListEntitiesForPolicyCommandOutput>> {
    let result: MethodResult<ListEntitiesForPolicyCommandOutput> = 
        new MethodResult<ListEntitiesForPolicyCommandOutput>();

    try {
        const iam = await GetIamClient(Region);

        const command = new ListEntitiesForPolicyCommand({
            PolicyArn: PolicyArn,
        });

        const response = await iam.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetPolicyEntities Error !!!", error);
        ui.logToOutput("api.GetPolicyEntities Error !!!", error);
        return result;
    }
}
