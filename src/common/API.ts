/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Common AWS API utilities
 * 
 * This file contains AWS credential management and general AWS operations.
 * Service-specific operations (S3, Lambda, etc.) are in their respective service folders.
 */

import * as ui from "./UI";
import { MethodResult } from './MethodResult';
import { homedir } from "os";
import { sep } from "path";
import { join } from "path";
import { parseKnownFiles, SourceProfileInit } from "../aws-sdk/parseKnownFiles";
import { ParsedIniData } from "@aws-sdk/types";
import { AwsCredentialIdentity } from "@aws-sdk/types";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { IAMClient } from "@aws-sdk/client-iam";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

let CurrentCredentials: AwsCredentialIdentity | undefined;

/**
 * Get AWS credentials using the default provider chain
 * Caches credentials for reuse
 */
export async function GetCredentials() {
  let credentials;
  if (CurrentCredentials !== undefined) { 
    ui.logToOutput("Aws credentials From Pool AccessKeyId=" + CurrentCredentials.accessKeyId);
    return CurrentCredentials; 
  }

  try {
    // Get credentials using the default provider chain.
    const provider = fromNodeProviderChain({ignoreCache: true});
    credentials = await provider();

    if (!credentials) {
      throw new Error("Aws credentials not found !!!");
    }

    CurrentCredentials = credentials;
    ui.logToOutput("Aws credentials AccessKeyId=" + credentials.accessKeyId);
    return credentials;
  } catch (error: any) {
    ui.showErrorMessage("Aws Credentials Not Found !!!", error);
    ui.logToOutput("GetCredentials Error !!!", error);
    return credentials;
  }
}

/**
 * Start AWS connection (loads credentials)
 */
export async function StartConnection() {
  ui.logToOutput("Starting Connection");
  CurrentCredentials = await GetCredentials();
  ui.logToOutput("Connection Started");
}

/**
 * Stop AWS connection (clears cached credentials)
 */
export async function StopConnection() {
  ui.logToOutput("Stopping Connection");
  CurrentCredentials = undefined;
  ui.logToOutput("Connection Stopped");
}

/**
 * Get IAM client instance
 */
export async function GetIAMClient() {
  let credentials = await GetCredentials();
  return new IAMClient({ credentials: credentials });
}

/**
 * Get STS client instance with specific region
 */
async function GetSTSClient(region: string) {
  const credentials = await GetCredentials();
  const stsClient = new STSClient({
    region,
    credentials,
  });
  return stsClient;
}

/**
 * Test if AWS credentials are available
 */
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

/**
 * Test AWS connection by making an STS call
 */
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

/**
 * Get list of AWS profiles from credentials file
 */
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

/**
 * Get INI profile data from AWS credentials files
 */
export async function getIniProfileData(init: SourceProfileInit = {}):Promise<ParsedIniData>
{
    const profiles = await parseKnownFiles(init);
    return profiles;
}

/**
 * Environment variable for AWS credentials file path
 */
export const ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";

/**
 * Get home directory path
 */
export const getHomeDir = (): string => {
    const { HOME, USERPROFILE, HOMEPATH, HOMEDRIVE = `C:${sep}` } = process.env;
  
    if (HOME) { return HOME; }
    if (USERPROFILE) { return USERPROFILE; } 
    if (HOMEPATH) { return `${HOMEDRIVE}${HOMEPATH}`; } 
  
    return homedir();
  };

/**
 * Get AWS credentials file path
 */
export const getCredentialsFilepath = () =>
  process.env[ENV_CREDENTIALS_PATH] || join(getHomeDir(), ".aws", "credentials");

/**
 * Get AWS config file path
 */
export const getConfigFilepath = () =>
  process.env[ENV_CREDENTIALS_PATH] || join(getHomeDir(), ".aws", "config");