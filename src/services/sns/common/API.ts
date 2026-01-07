/* eslint-disable @typescript-eslint/naming-convention */
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { SNSClient, ListTopicsCommand } from "@aws-sdk/client-sns";
import * as ui from "./UI";
import { MethodResult } from './MethodResult';
import { homedir } from "os";
import { sep } from "path";
import { join, basename, extname, dirname } from "path";
import { parseKnownFiles, SourceProfileInit } from "../aws-sdk/parseKnownFiles";
import { ParsedIniData } from "@aws-sdk/types";
import * as SnsTreeView from '../sns/SnsTreeView';
import * as fs from 'fs';
import * as archiver from 'archiver';

export async function GetCredentials() {
  let credentials;

  try {
    if (SnsTreeView.SnsTreeView.Current) {
      process.env.AWS_PROFILE = SnsTreeView.SnsTreeView.Current.AwsProfile ;
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

async function GetSNSClient(region: string) {
  const credentials = await GetCredentials();
  
  const sns = new SNSClient({
    region,
    credentials,
    endpoint: SnsTreeView.SnsTreeView.Current?.AwsEndPoint,
  });
  
  return sns;
}

export async function GetSnsTopicList(
  region: string,
  TopicName?: string
): Promise<MethodResult<string[]>> {
  let result: MethodResult<string[]> = new MethodResult<string[]>();
  result.result = [];

  try {
    const snd = await GetSNSClient(region);
    
    let allTopics = [];
    let marker: string | undefined = undefined;
    
    // Continue fetching pages until no NextMarker is returned
    do {
      const command:ListTopicsCommand = new ListTopicsCommand({NextToken: marker,});
      const topicList = await snd.send(command);
      
      if (topicList.Topics) {
        allTopics.push(...topicList.Topics);
      }
      
      // Update marker to the next page (if present)
      marker = topicList.NextToken;
    } while (marker);

    let matchingTopics;
    if (TopicName) {
      matchingTopics = allTopics.filter(
        (topic) =>
          topic.TopicArn?.includes(TopicName) || TopicName.length === 0
      );
    } else {
      matchingTopics = allTopics;
    }

    // Extract the function names into the result
    if (matchingTopics && matchingTopics.length > 0) {
      matchingTopics.forEach((topic) => {
        if (topic.TopicArn) result.result.push(topic.TopicArn!);
      });
    }

    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetSnsTopicList Error !!!", error);
    ui.logToOutput("api.GetSnsTopicList Error !!!", error);
    return result;
  }
}


import {
  PublishCommand,
  PublishCommandInput,
  PublishCommandOutput,
} from "@aws-sdk/client-sns";

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

export async function PublishMessage(
  Region: string,
  TopicArn: string,
  Message: string
): Promise<MethodResult<PublishCommandOutput>> {
  let result: MethodResult<PublishCommandOutput> = new MethodResult<PublishCommandOutput>();

  try {
    const sns = await GetSNSClient(Region);
  
    const param: PublishCommandInput = {
      TopicArn: TopicArn,
      Message: Message
    };

    const command = new PublishCommand(param);
    const response = await sns.send(command);

    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.PublishMessage Error !!!", error);
    ui.logToOutput("api.PublishMessage Error !!!", error);
    return result;
  }
}

import {
  GetTopicAttributesCommand,
  GetTopicAttributesCommandInput,
  GetTopicAttributesCommandOutput,
} from "@aws-sdk/client-sns";

export async function GetTopicAttributes(
  Region: string,
  TopicArn: string
): Promise<MethodResult<GetTopicAttributesCommandOutput>> {
  let result: MethodResult<GetTopicAttributesCommandOutput> = new MethodResult<GetTopicAttributesCommandOutput>();

  try {
    const sns = await GetSNSClient(Region);

    const command = new GetTopicAttributesCommand({
      TopicArn: TopicArn,
    });

    const response = await sns.send(command);
    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetTopicAttributes Error !!!", error);
    ui.logToOutput("api.GetTopicAttributes Error !!!", error);
    return result;
  }
}

import { ListSubscriptionsByTopicCommand, ListSubscriptionsByTopicCommandOutput } from "@aws-sdk/client-sns";
export async function GetSubscriptions(
  Region: string,
  TopicArn: string
): Promise<MethodResult<ListSubscriptionsByTopicCommandOutput>> {
  let result: MethodResult<ListSubscriptionsByTopicCommandOutput> = new MethodResult<ListSubscriptionsByTopicCommandOutput>();

  try {
    const sns = await GetSNSClient(Region);
  
    const command = new ListSubscriptionsByTopicCommand({ TopicArn: TopicArn });
    const response = await sns.send(command);

    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetSubscriptions Error !!!", error);
    ui.logToOutput("api.GetSubscriptions Error !!!", error);
    return result;
  }
}

export async function ZipTextFile(inputPath: string, outputZipPath?: string): Promise<MethodResult<string>> {
  let result:MethodResult<string> = new MethodResult<string>();

  try 
  {
    if(!outputZipPath)
    {
      outputZipPath = dirname(inputPath) + "/" + basename(inputPath) + ".zip"
    }

    // Delete the output zip file if it already exists
    if (fs.existsSync(outputZipPath)) {
      fs.unlinkSync(outputZipPath);
    }

    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Set compression level
    });

    archive.pipe(output);

    if (fs.lstatSync(inputPath).isDirectory()) {
      archive.directory(inputPath, false);
    } else {
      archive.file(inputPath, { name: basename(inputPath) });
    }

    archive.finalize();

    result.result = outputZipPath;
    result.isSuccessful = true;
    return result;
  } 
  catch (error:any) 
  {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage('api.ZipTextFile Error !!!', error);
    ui.logToOutput("api.ZipTextFile Error !!!", error); 
    return result;
  }
}

import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
async function GetSTSClient(region: string) {
  const credentials = await GetCredentials();
  const iamClient = new STSClient(
    {
      region,
      credentials,
      endpoint: SnsTreeView.SnsTreeView.Current?.AwsEndPoint,
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