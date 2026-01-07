/* eslint-disable @typescript-eslint/naming-convention */
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import { GlueClient, GetJobsCommand, StartJobRunCommand, GetJobRunCommand, GetJobRunsCommand } from "@aws-sdk/client-glue";
import { CloudWatchLogsClient, OutputLogEvent, DescribeLogStreamsCommand, GetLogEventsCommand, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import * as ui from "./UI";
import { MethodResult } from './MethodResult';
import { homedir } from "os";
import { sep } from "path";
import { join, basename, extname, dirname } from "path";
import { parseKnownFiles, SourceProfileInit } from "../aws-sdk/parseKnownFiles";
import { ParsedIniData } from "@aws-sdk/types";
import * as GlueTreeView from '../glue/GlueTreeView';
import * as fs from 'fs';

export async function GetCredentials() {
  let credentials;

  try {
    if (GlueTreeView.GlueTreeView.Current) {
      process.env.AWS_PROFILE = GlueTreeView.GlueTreeView.Current.AwsProfile ;
    }
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

async function GetGlueClient(region: string) {
  const credentials = await GetCredentials();
  const glueClient = new GlueClient({
    region,
    credentials,
    endpoint: GlueTreeView.GlueTreeView.Current?.AwsEndPoint,
  });
  return glueClient;
}

async function GetCloudWatchClient(region: string) {
  const credentials = await GetCredentials();
  const cloudwatchLogsClient = new CloudWatchLogsClient({
    region,
    credentials,
    endpoint: GlueTreeView.GlueTreeView.Current?.AwsEndPoint,
  });
  return cloudwatchLogsClient;
}

async function GetSTSClient(region: string) {
  const credentials = await GetCredentials();
  const stsClient = new STSClient({
    region,
    credentials,
    endpoint: GlueTreeView.GlueTreeView.Current?.AwsEndPoint,
  });
  return stsClient;
}

export async function GetGlueJobList(region: string, filter?: string): Promise<MethodResult<string[]>> {
  let result: MethodResult<string[]> = new MethodResult<string[]>();
  result.result = [];
  try {
    const glue = await GetGlueClient(region);
    let nextToken: string | undefined = undefined;
    do {
      const cmd: GetJobsCommand = new GetJobsCommand({ MaxResults: 100, NextToken: nextToken });
      const res = await glue.send(cmd);
      if (res.Jobs) {
        for (const job of res.Jobs) {
          if (!filter || job.Name?.includes(filter)) {
            result.result.push(job.Name ?? "");
          }
        }
      }
      nextToken = res.NextToken;
    } while (nextToken);
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.logToOutput("api.GetGlueJobList Error !!!", error);
    return result;
  }
}

export async function StartGlueJobRun(region: string, jobName: string, parameters?: any): Promise<MethodResult<string>> {
  let result: MethodResult<string> = new MethodResult<string>();
  try {
    const glue = await GetGlueClient(region);
    const cmd = new StartJobRunCommand({ JobName: jobName, Arguments: parameters });
    const res = await glue.send(cmd);
    result.result = res.JobRunId ?? "";
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.logToOutput("api.StartGlueJobRun Error !!!", error);
    return result;
  }
}


export async function GetLatestLogGroupLogStreamList(Region: string, LogGroupName: string): Promise<MethodResult<string[]>> {
  let result: MethodResult<string[]> = new MethodResult<string[]>();
  result.result = [];
  try {
    const cloudwatchlogs = await GetCloudWatchClient(Region);
    const describeLogStreamsCommand = new DescribeLogStreamsCommand({
      logGroupName: LogGroupName,
      orderBy: "LastEventTime",
      descending: true,
      limit: 30,
    });
    const streamsResponse = await cloudwatchlogs.send(describeLogStreamsCommand);
    if (streamsResponse.logStreams) {
      result.result = streamsResponse.logStreams.map(stream => stream.logStreamName || 'invalid log stream');
    }
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    return result;
  }
}

export async function GetLogEvents(Region: string, LogGroupName: string, LogStreamName: string): Promise<MethodResult<OutputLogEvent[]>> {
  let result: MethodResult<OutputLogEvent[]> = new MethodResult<OutputLogEvent[]>();
  result.result = [];
  try {
    const cloudwatchlogs = await GetCloudWatchClient(Region);
    const getLogEventsCommand = new GetLogEventsCommand({
      logGroupName: LogGroupName,
      logStreamName: LogStreamName,
      limit: 50,
      startFromHead: true,
    });
    const eventsResponse = await cloudwatchlogs.send(getLogEventsCommand);
    if (eventsResponse.events) {
      result.result = eventsResponse.events;
    }
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    return result;
  }
}

export async function TestAwsCredentials(): Promise<MethodResult<boolean>> {
  let result: MethodResult<boolean> = new MethodResult<boolean>();
  try {
    await GetCredentials();
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
    await sts.send(command);
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
  let result:MethodResult<string[]> = new MethodResult<string[]>();
  try {
    let profileData = await getIniProfileData();
    result.result = Object.keys(profileData);
    result.isSuccessful = true;
    return result;
  } catch (error:any) {
    result.isSuccessful = false;
    result.error = error;
    return result;
  }
}

export async function getIniProfileData(init: SourceProfileInit = {}):Promise<ParsedIniData> {
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
export const getCredentialsFilepath = () => process.env[ENV_CREDENTIALS_PATH] || join(getHomeDir(), ".aws", "credentials");
export const getConfigFilepath = () => process.env[ENV_CREDENTIALS_PATH] || join(getHomeDir(), ".aws", "config");

export function isJsonString(jsonString: string): boolean {
  try {
    var json = JSON.parse(jsonString);
    return (typeof json === 'object');
  } catch (e) {
    return false;
  }
}

export async function GetGlueJobRuns(region: string, jobName: string): Promise<MethodResult<any[]>> {
  let result: MethodResult<any[]> = new MethodResult<any[]>();
  result.result = [];
  try {
    const glue = await GetGlueClient(region);
    const cmd = new GetJobRunsCommand({ JobName: jobName, MaxResults: 20 });
    const res = await glue.send(cmd);
    if (res.JobRuns) {
      result.result = res.JobRuns;
    }
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.logToOutput("api.GetGlueJobRuns Error !!!", error);
    return result;
  }
}

export async function GetGlueJobDescription(region: string, jobName: string): Promise<MethodResult<any>> {
  let result: MethodResult<any> = new MethodResult<any>();
  try {
    const glue = await GetGlueClient(region);
    const cmd = new GetJobsCommand({ }); // Glue doesn't have a simple DescribeJob, GetJobs works
    const res = await glue.send(cmd);
    const job = res.Jobs?.find(j => j.Name === jobName);
    result.result = job;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    return result;
  }
}