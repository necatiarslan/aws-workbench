/* eslint-disable @typescript-eslint/naming-convention */
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { IAMClient } from "@aws-sdk/client-iam";
import * as ui from "./UI";
import { MethodResult } from './MethodResult';
import { homedir } from "os";
import { join, sep} from "path";
import { parseKnownFiles, SourceProfileInit } from "../aws-sdk/parseKnownFiles";
import { ParsedIniData } from "@aws-sdk/types";
import * as IamTreeView from '../iam/IamTreeView';

export async function GetCredentials() {
  let credentials;

  try {
    if (IamTreeView.IamTreeView.Current) {
      process.env.AWS_PROFILE = IamTreeView.IamTreeView.Current.AwsProfile ;
    }
    // Get credentials using the default provider chain.
    const provider = fromNodeProviderChain({ignoreCache: true});
    credentials = await provider();

    if (!credentials) {
      throw new Error("Aws credentials not found !!!");
    }

    ui.logToOutput("Aws credentials AccessKeyId=" + credentials.accessKeyId);
    return credentials;
  } catch (error: any) {
    ui.showErrorMessage("Aws Credentials Not Found !!!", error);
    ui.logToOutput("GetCredentials Error !!!", error);
    return credentials;
  }
}


export function isJsonString(jsonString: string): boolean {
  try {
    var json = ParseJson(jsonString);
    return (typeof json === 'object');
  } catch (e) {
    return false;
  }
}
export function ParseJson(jsonString: string) {
  return JSON.parse(jsonString);
}

import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

async function GetSTSClient(region: string) {
  const credentials = await GetCredentials();
  const iamClient = new STSClient(
    {
      region,
      credentials,
      endpoint: IamTreeView.IamTreeView.Current?.AwsEndPoint,
    }
  );
  return iamClient;
}

export async function TestAwsCredentials(): Promise<MethodResult<boolean>> {
  let result: MethodResult<boolean> = new MethodResult<boolean>();

  try {
    const credentials = await GetCredentials();

    result.isSuccessful = true;
    result.result = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    return result;
  }
}
export async function TestAwsConnection(Region: string="us-east-1"): Promise<MethodResult<boolean>> {
  let result: MethodResult<boolean> = new MethodResult<boolean>();

  try {
    const sts = await GetSTSClient(Region);

    const command = new GetCallerIdentityCommand({});
    const data = await sts.send(command);

    result.isSuccessful = true;
    result.result = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    return result;
  }
}


export async function GetAwsProfileList(): Promise<MethodResult<string[]>> {
  ui.logToOutput("api.GetAwsProfileList Started");

  let result:MethodResult<string[]> = new MethodResult<string[]>();

  try 
  {
    let profileData = await getIniProfileData();
    
    result.result = Object.keys(profileData);
    result.isSuccessful = true;
    return result;
  } 
  catch (error:any) 
  {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage('api.GetAwsProfileList Error !!!', error);
    ui.logToOutput("api.GetAwsProfileList Error !!!", error); 
    return result;
  }
}

export async function getIniProfileData(init: SourceProfileInit = {}):Promise<ParsedIniData>
{
    const profiles = await parseKnownFiles(init);
    return profiles;
}

export const ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";

export const getHomeDir = (): string => {
    const { HOME, USERPROFILE, HOMEPATH, HOMEDRIVE = `C:${sep}` } = process.env;
  
    if (HOME) { return HOME; }
    if (USERPROFILE) { return USERPROFILE; } 
    if (HOMEPATH) { return `${HOMEDRIVE}${HOMEPATH}`; } 
  
    return homedir();
  };

export const getCredentialsFilepath = () =>
  process.env[ENV_CREDENTIALS_PATH] || join(getHomeDir(), ".aws", "credentials");

export const getConfigFilepath = () =>
  process.env[ENV_CREDENTIALS_PATH] || join(getHomeDir(), ".aws", "config");

import {
  ListRolesCommand,
  GetRoleCommand,
  GetRoleCommandOutput,
  ListAttachedRolePoliciesCommand,
  ListAttachedRolePoliciesCommandOutput,
  ListRoleTagsCommand,
  ListRoleTagsCommandOutput,
  TagRoleCommand,
  UntagRoleCommand
} from "@aws-sdk/client-iam";

async function GetIamClient(region: string) {
  const credentials = await GetCredentials();
  
  const iamClient = new IAMClient({
    region,
    credentials,
    endpoint: IamTreeView.IamTreeView.Current?.AwsEndPoint,
  });
  
  return iamClient;
}

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
      const command:ListRolesCommand = new ListRolesCommand({ Marker: marker });
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
          role.RoleName?.includes(RoleName) || RoleName.length === 0
      );
    } else {
      matchingRoles = allRoles;
    }

    // Extract the role names into the result
    if (matchingRoles && matchingRoles.length > 0) {
      matchingRoles.forEach((role) => {
        if (role.RoleName) result.result.push(role.RoleName);
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

import { GetPolicyCommand, GetPolicyVersionCommand } from "@aws-sdk/client-iam";

export async function GetPolicyDocument(
  Region: string,
  PolicyArn: string
): Promise<MethodResult<any>> {
  let result: MethodResult<any> = new MethodResult<any>();

  try {
    const iam = await GetIamClient(Region);

    // First get the policy to find the default version
    const getPolicyCommand = new GetPolicyCommand({
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
    const getPolicyVersionCommand = new GetPolicyVersionCommand({
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
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetPolicyDocument Error !!!", error);
    ui.logToOutput("api.GetPolicyDocument Error !!!", error);
    return result;
  }
}