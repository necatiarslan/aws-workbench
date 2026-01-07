/* eslint-disable @typescript-eslint/naming-convention */
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import { ListStateMachinesCommand, StartExecutionCommand, DescribeStateMachineCommand, SFNClient, ListExecutionsCommand, ExecutionListItem, DescribeExecutionCommand, DescribeExecutionCommandOutput } from "@aws-sdk/client-sfn";
import { CloudWatchLogsClient, OutputLogEvent } from "@aws-sdk/client-cloudwatch-logs";
import { IAMClient } from "@aws-sdk/client-iam";
import * as ui from "./UI";
import { MethodResult } from './MethodResult';
import { homedir } from "os";
import { sep } from "path";
import { join, basename, extname, dirname } from "path";
import { parseKnownFiles, SourceProfileInit } from "../aws-sdk/parseKnownFiles";
import { ParsedIniData } from "@aws-sdk/types";
import * as StepFuncTreeView from '../step/StepFuncTreeView';
import * as fs from 'fs';

// add a simple in-memory cache for DescribeStateMachine responses
const stateMachineCache: Map<string, any> = new Map();

export async function GetCredentials() {
  let credentials;

  try {
    if (StepFuncTreeView.StepFuncTreeView.Current) {
      process.env.AWS_PROFILE = StepFuncTreeView.StepFuncTreeView.Current.AwsProfile ;
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

async function GetStepFuncClient(region: string) {
  const credentials = await GetCredentials();
  
  const stepFuncClient = new SFNClient({
    region,
    credentials,
    endpoint: StepFuncTreeView.StepFuncTreeView.Current?.AwsEndPoint,
  });
  
  return stepFuncClient;
}

async function GetCloudWatchClient(region: string) {
  const credentials = await GetCredentials();
  const cloudwatchLogsClient = new CloudWatchLogsClient({
    region,
    credentials,
    endpoint: StepFuncTreeView.StepFuncTreeView.Current?.AwsEndPoint,
  });
  
  return cloudwatchLogsClient;
}

async function GetIAMClient() {
  const credentials = await GetCredentials();
  const iamClient = new IAMClient({ credentials });
  return iamClient;
}

export async function GetStepFuncList(
  region: string,
  StepFuncName?: string
): Promise<MethodResult<string[]>> {
  let result: MethodResult<string[]> = new MethodResult<string[]>();
  result.result = [];

  try {
    const sfn = await GetStepFuncClient(region);
    let nextToken: string | undefined = undefined;
    do {
      const cmd: ListStateMachinesCommand = new ListStateMachinesCommand({ maxResults: 100, nextToken });
      const res = await sfn.send(cmd);
      if (res.stateMachines) {
        for (const sm of res.stateMachines) {
          const name = sm.name ?? sm.stateMachineArn ?? "";
          if (!StepFuncName || name.includes(StepFuncName)) {
            result.result.push(sm.stateMachineArn ?? "");
          }
        }
      }
      nextToken = (res as any).nextToken;
    } while (nextToken);
 
     result.isSuccessful = true;
     return result;
   } catch (error: any) {
     result.isSuccessful = false;
     result.error = error;
     ui.showErrorMessage("api.GetStepFuncList Error !!!", error);
     ui.logToOutput("api.GetStepFuncList Error !!!", error);
     return result;
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

import { StartExecutionCommandOutput } from "@aws-sdk/client-sfn";
export async function TriggerStepFunc(
  StepFuncArn: string,
  Parameters: { [key: string]: any }
): Promise<MethodResult<StartExecutionCommandOutput>> {
  let result: MethodResult<StartExecutionCommandOutput> = new MethodResult<StartExecutionCommandOutput>();
  let Region = GetStepFuncRegion(StepFuncArn);
  try {
    // Start Step Functions execution
    const sfn = await GetStepFuncClient(Region);
    const input = JSON.stringify(Parameters ?? {});
    const stateMachineArn = StepFuncArn;
    const startCmd = new StartExecutionCommand({
      stateMachineArn,
      input,
    });
    const startResponse = await sfn.send(startCmd);
    result.result = startResponse;
    result.isSuccessful = true;
    return result;
   } catch (error: any) {
     result.isSuccessful = false;
     result.error = error;
     ui.showErrorMessage("api.TriggerStepFunc Error !!!", error);
     ui.logToOutput("api.TriggerStepFunc Error !!!", error);
     return result;
   }
 }


import {
  DescribeLogStreamsCommand,
  GetLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

// Utility to extract log group name from arn
function extractLogGroupNameFromArn(arn: string): string | null {
  try {
    // arn:partition:service:region:account-id:resource-type:resource
    // CloudWatch log group ARNs are like: arn:aws:logs:region:account-id:log-group:my-log-group:*
    //example arn:aws:logs:us-east-1:123456789012:log-group:/aws/vendedlogs/states/us-east-1/MyStateMachine:*
    const parts = arn.split(':');
    // parts[5] should be "log-group", parts[6] the name (may include colons or slashes)
    if (parts.length >= 7) {
      let result = parts[6];
      ui.logToOutput("extractLogGroupNameFromArn: " + result);
      return result;
    }
    else {
      ui.logToOutput("extractLogGroupNameFromArn: Invalid ARN format");
    }
    return null;
  } catch (e) {
    ui.logToOutput("extractLogGroupNameFromArn error");
    return null;
  }
}

export async function GetStepFuncLogGroupArn(
  StepFuncArn: string
): Promise<string | null> {
  try {
    const describeResult = await GetStepFuncDescription(StepFuncArn);
    if (describeResult.isSuccessful && describeResult.result) {
      const loggingConfig = (describeResult.result as any).loggingConfiguration;
      ui.logToOutput("GetStepFuncLogGroupArn: loggingConfig " + JSON.stringify(loggingConfig));
      if (loggingConfig.destinations?.length) {
        const cw = loggingConfig.destinations.find((d: any) => d.cloudWatchLogsLogGroup);
        let logGroupArn = cw?.cloudWatchLogsLogGroup?.logGroupArn ?? null;
        ui.logToOutput("GetStepFuncLogGroupArn: " + logGroupArn);
        return logGroupArn;
      }
      else {
        ui.logToOutput("GetStepFuncLogGroupArn: No logging configuration found.");
      }
    }
  } catch (error: any) {
    ui.logToOutput("GetStepFuncLogGroupArn error", error);
  }
  return null;
}

// Replace old synchronous function with async implementation that uses the state machine definition
export async function GetStepFuncLogGroupName(
  StepFuncArn: string
): Promise<string | null> {

  try {
    const logGroupArn = await GetStepFuncLogGroupArn(StepFuncArn);
    if (logGroupArn) {
      return extractLogGroupNameFromArn(logGroupArn);
    }

    // // Fallback to previous convention if no loggingConfiguration is present
    // const region = GetStepFuncRegion(StepFuncArn);
    // const name = GetStepFuncName(StepFuncArn);
    // if (region && name) {
    //   return `/aws/vendedlogs/states/${region}/${name}`;
    // }

    return null;
  } catch (error: any) {
    ui.logToOutput("GetStepFuncLogGroupName error", error);
    return null;
  }
}

export async function GetLatestLogGroupLogStreamList(
  Region: string,
  LogGroupName: string
): Promise<MethodResult<string[]>> {
  let result: MethodResult<string[]> = new MethodResult<string[]>();
  result.result = [];

  try {
    const cloudwatchlogs = await GetCloudWatchClient(Region);

    // Get the streams sorted by the latest event time
    const describeLogStreamsCommand = new DescribeLogStreamsCommand({
      logGroupName: LogGroupName,
      orderBy: "LastEventTime",
      descending: true,
      limit: 30,
    });

    const streamsResponse = await cloudwatchlogs.send(describeLogStreamsCommand);

    if (!streamsResponse.logStreams || streamsResponse.logStreams.length === 0) {
      return result;
    }

    result.result = streamsResponse.logStreams.map(stream => stream.logStreamName || 'invalid log stream');
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetLatestStepFuncLogStreamName Error !!!", error);
    ui.logToOutput("api.GetLatestStepFuncLogStreamName Error !!!", error);
    return result;
  }
}

export async function GetLatestStepFuncLogStreamName(
  StepFuncArn: string
): Promise<MethodResult<string>> {
  ui.logToOutput("GetLatestStepFuncLogStreamName for StepFunc function: " + StepFuncArn);
  let result: MethodResult<string> = new MethodResult<string>();

  let Region = GetStepFuncRegion(StepFuncArn);

  try {
    // Get the log group name
    const logGroupName = await GetStepFuncLogGroupName(StepFuncArn);
    if (!logGroupName) {
      result.isSuccessful = false;
      result.error = new Error("No log group found for this state machine.");
      ui.showErrorMessage("No log group found for this state machine.", result.error);
      ui.logToOutput("No log group found for this state machine.");
      return result;
    }
    const cloudwatchlogs = await GetCloudWatchClient(Region);

    // Get the streams sorted by the latest event time
    const describeLogStreamsCommand = new DescribeLogStreamsCommand({
      logGroupName,
      orderBy: "LastEventTime",
      descending: true,
      limit: 1,
    });

    const streamsResponse = await cloudwatchlogs.send(describeLogStreamsCommand);

    if (!streamsResponse.logStreams || streamsResponse.logStreams.length === 0) {
      result.isSuccessful = false;
      result.error = new Error("No log streams found for this StepFunc function.");
      ui.showErrorMessage("No log streams found for this StepFunc function.", result.error);
      ui.logToOutput("No log streams found for this StepFunc function.");
      return result;
    }

    // Get the latest log events from the first stream
    const logStreamName = streamsResponse.logStreams[0].logStreamName;
    if (!logStreamName) {
      result.isSuccessful = false;
      result.error = new Error("No log stream name found for this StepFunc function.");
      ui.showErrorMessage("No log stream name found for this StepFunc function.", result.error);
      ui.logToOutput("No log stream name found for this StepFunc function.");
      return result;
    }

    result.result = logStreamName;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetLatestStepFuncLogStreamName Error !!!", error);
    ui.logToOutput("api.GetLatestStepFuncLogStreamName Error !!!", error);
    return result;
  }
}

export function GetStepFuncName(stepFuncArn: string): string {
  if(stepFuncArn)
  {
    let parts = stepFuncArn.split(":");
    return parts[parts.length - 1];
  }
  return "";
}

export function GetStepFuncRegion(stepFuncArn: string): string {
  if(stepFuncArn)
  {
    let parts = stepFuncArn.split(":");
    return parts[3];
  }
  return "";
}

export async function GetLatestStepFuncLogs(
  StepFunc: string
): Promise<MethodResult<string>> {
  ui.logToOutput("Getting logs for StepFunc function: " + StepFunc);
  let result: MethodResult<string> = new MethodResult<string>();
  let Region = GetStepFuncRegion(StepFunc);
  try {
    // Get the log group name
    const logGroupName = await GetStepFuncLogGroupName(StepFunc);
    if (!logGroupName) {
      result.isSuccessful = false;
      result.error = new Error("No log group found for this state machine.");
      ui.showErrorMessage("No log group found for this state machine.", result.error);
      ui.logToOutput("No log group found for this state machine.");
      return result;
    }
    const cloudwatchlogs = await GetCloudWatchClient(Region);

    // Get the streams sorted by the latest event time
    const describeLogStreamsCommand = new DescribeLogStreamsCommand({
      logGroupName,
      orderBy: "LastEventTime",
      descending: true,
      limit: 1,
    });

    const streamsResponse = await cloudwatchlogs.send(describeLogStreamsCommand);

    if (!streamsResponse.logStreams || streamsResponse.logStreams.length === 0) {
      result.isSuccessful = false;
      result.error = new Error("No log streams found for this StepFunc function.");
      ui.showErrorMessage("No log streams found for this StepFunc function.", result.error);
      ui.logToOutput("No log streams found for this StepFunc function.");
      return result;
    }

    // Get the latest log events from the first stream
    const logStreamName = streamsResponse.logStreams[0].logStreamName;
    if (!logStreamName) {
      result.isSuccessful = false;
      result.error = new Error("No log stream name found for this StepFunc function.");
      ui.showErrorMessage("No log stream name found for this StepFunc function.", result.error);
      ui.logToOutput("No log stream name found for this StepFunc function.");
      return result;
    }

    const getLogEventsCommand = new GetLogEventsCommand({
      logGroupName: logGroupName,
      logStreamName: logStreamName,
      limit: 50, // Adjust the limit as needed
      startFromHead: true, // Start from the beginning of the log stream
    });

    const eventsResponse = await cloudwatchlogs.send(getLogEventsCommand);

    if (!eventsResponse.events || eventsResponse.events.length === 0) {
      result.isSuccessful = false;
      result.error = new Error("No log events found for this StepFunc function.");
      ui.showErrorMessage("No log events found for this StepFunc function.", result.error);
      ui.logToOutput("No log events found for this StepFunc function.");
      return result;
    }

    // Concatenate log messages
    result.result = eventsResponse.events
      .map((event) => event.message)
      .filter((msg) => msg)
      .join("\n");

    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetLatestStepFuncLogs Error !!!", error);
    ui.logToOutput("api.GetLatestStepFuncLogs Error !!!", error);
    return result;
  }
}

export async function GetLatestStepFuncLogStreams(
  StepFunc: string
): Promise<MethodResult<string[]>> {
  ui.logToOutput("Getting log streams for StepFunc function: " + StepFunc);
  let result: MethodResult<string[]> = new MethodResult<string[]>();
  result.result = [];
  let Region = GetStepFuncRegion(StepFunc);
  try {
    // Get the log group name
    const logGroupName = await GetStepFuncLogGroupName(StepFunc);
    if (!logGroupName) {
      result.isSuccessful = false;
      result.error = new Error("No log group found for this state machine.");
      ui.showErrorMessage("No log group found for this state machine.", result.error);
      ui.logToOutput("No log group found for this state machine.");
      return result;
    }
    const cloudwatchlogs = await GetCloudWatchClient(Region);

    // Get the streams sorted by the latest event time
    const describeLogStreamsCommand = new DescribeLogStreamsCommand({
      logGroupName,
      orderBy: "LastEventTime",
      descending: true,
      limit: 1,
    });

    const streamsResponse = await cloudwatchlogs.send(describeLogStreamsCommand);

    if (streamsResponse.logStreams && streamsResponse.logStreams.length > 0) {
      let logStreamNames = streamsResponse.logStreams.slice(0, 10).map(stream => stream.logStreamName || 'invalid log stream');
      result.result = logStreamNames;
    }
  
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetLatestStepFuncLogStreams Error !!!", error);
    ui.logToOutput("api.GetLatestStepFuncLogStreams Error !!!", error);
    return result;
  }
}

export async function GetStepFuncLogs(
  Region: string,
  StepFunc: string,
  LogStreamName: string
): Promise<MethodResult<string>> {
  ui.logToOutput("Getting logs for StepFunc function: " + StepFunc + " LogStream " + LogStreamName);
  let result: MethodResult<string> = new MethodResult<string>();

  try {
    // Get the log group name
    const logGroupName = await GetStepFuncLogGroupName(StepFunc);
    if (!logGroupName) {
      result.isSuccessful = false;
      result.error = new Error("No log group found for this state machine.");
      ui.showErrorMessage("No log group found for this state machine.", result.error);
      ui.logToOutput("No log group found for this state machine.");
      return result;
    }
    const cloudwatchlogs = await GetCloudWatchClient(Region);

    const getLogEventsCommand = new GetLogEventsCommand({
      logGroupName: logGroupName,
      logStreamName: LogStreamName,
      limit: 50, // Adjust the limit as needed
      startFromHead: true, // Start from the beginning of the log stream
    });

    const eventsResponse = await cloudwatchlogs.send(getLogEventsCommand);

    if (!eventsResponse.events || eventsResponse.events.length === 0) {
      result.isSuccessful = false;
      result.error = new Error("No log events found for this StepFunc function." + StepFunc + " LogStream " + LogStreamName);
      ui.showErrorMessage("No log events found for this StepFunc function."+ StepFunc + " LogStream " + LogStreamName, result.error);
      ui.logToOutput("No log events found for this StepFunc function."+ StepFunc + " LogStream " + LogStreamName);
      return result;
    }

    // Concatenate log messages
    result.result = eventsResponse.events
      .map((event) => event.message)
      .filter((msg) => msg)
      .join("\n");

    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetLatestStepFuncLogs Error !!!", error);
    ui.logToOutput("api.GetLatestStepFuncLogs Error !!!", error);
    return result;
  }
}

export async function GetLogEvents(
  Region: string,
  LogGroupName: string,
  LogStreamName: string,
): Promise<MethodResult<OutputLogEvent[]>> {
  ui.logToOutput("Getting logs from LogGroupName: " + LogGroupName + " LogStreamName: " + LogStreamName);
  let result: MethodResult<OutputLogEvent[]> = new MethodResult<OutputLogEvent[]>();
  result.result = [];
  try {
    // Get the log group name
    const cloudwatchlogs = await GetCloudWatchClient(Region);

    const getLogEventsCommand = new GetLogEventsCommand({
      logGroupName: LogGroupName,
      logStreamName: LogStreamName,
      limit: 50, // Adjust the limit as needed
      startFromHead: true, // Start from the beginning of the log stream
    });

    const eventsResponse = await cloudwatchlogs.send(getLogEventsCommand);

    if (!eventsResponse.events || eventsResponse.events.length === 0) {
      result.isSuccessful = true;
      return result;
    }

    // Concatenate log messages
    result.result.push(...eventsResponse.events);

    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetLogEvents Error !!!", error);
    ui.logToOutput("api.GetLogEvents Error !!!", error);
    return result;
  }
}

import { DescribeStateMachineCommandOutput } from "@aws-sdk/client-sfn";

export async function GetStepFuncDescription(
  StepFuncArn: string
): Promise<MethodResult<DescribeStateMachineCommandOutput>> {
  let result: MethodResult<DescribeStateMachineCommandOutput> = new MethodResult<DescribeStateMachineCommandOutput>();
  let Region = GetStepFuncRegion(StepFuncArn);
  try {
    // Return cached value if present
    if (stateMachineCache.has(StepFuncArn)) {
      ui.logToOutput(`GetStepFunc: returning cached state machine for ${StepFuncArn}`);
      result.result = stateMachineCache.get(StepFuncArn);
      result.isSuccessful = true;
      return result;
    }

    const stepFunc = await GetStepFuncClient(Region);

    const command = new DescribeStateMachineCommand({
      stateMachineArn: StepFuncArn,
    });

    const response = await stepFunc.send(command);
    // Cache the response for future calls
    stateMachineCache.set(StepFuncArn, response);

    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetStepFunc Error !!!", error);
    ui.logToOutput("api.GetStepFunc Error !!!", error);
    return result;
  }
}

import { UpdateStateMachineCommand, UpdateStateMachineCommandOutput } from "@aws-sdk/client-sfn";

export async function UpdateStepFuncCode(
  StepFuncArn: string,
  CodeFilePath: string
): Promise<MethodResult<UpdateStateMachineCommandOutput>> {
  let result: MethodResult<UpdateStateMachineCommandOutput> =
    new MethodResult<UpdateStateMachineCommandOutput>();
  let Region = GetStepFuncRegion(StepFuncArn);
  try {
    const stepFunc = await GetStepFuncClient(Region);

    const definition = fs.readFileSync(CodeFilePath, "utf8");

    const command = new UpdateStateMachineCommand({
      stateMachineArn: StepFuncArn,
      definition: definition,
    });

    const response = await stepFunc.send(command);

    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.UpdateStepFuncCode Error !!!", error);
    ui.logToOutput("api.UpdateStepFuncCode Error !!!", error);
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

import { GetUserCommand, GetUserCommandOutput } from "@aws-sdk/client-iam";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

async function GetSTSClient(region: string) {
  const credentials = await GetCredentials();
  const iamClient = new STSClient(
    {
      region,
      credentials,
      endpoint: StepFuncTreeView.StepFuncTreeView.Current?.AwsEndPoint,
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

export async function GetStepFuncExecutions(
  StepFuncArn: string,
  ExecutionName?: string,
  MaxResults: number = 20,
  StatusFilter?: string
): Promise<MethodResult<ExecutionListItem[]>> {
  ui.logToOutput("Getting executions for StepFunc: " + StepFuncArn);
  let result: MethodResult<ExecutionListItem[]> = new MethodResult<ExecutionListItem[]>();
  result.result = [];
  let Region = GetStepFuncRegion(StepFuncArn);
  try {
    const sfn = await GetStepFuncClient(Region);

    const command = new ListExecutionsCommand({
      stateMachineArn: StepFuncArn,
      maxResults: MaxResults,
      statusFilter: StatusFilter as any,
    });

    const response = await sfn.send(command);

    if (response.executions) {
      if (ExecutionName) {
        result.result = response.executions.filter(exec => (exec.name ?? '').includes(ExecutionName));
      } else {
        result.result = response.executions;
      }
    }

    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetStepFuncExecutions Error !!!", error);
    ui.logToOutput("api.GetStepFuncExecutions Error !!!", error);
    return result;
  }
}

export async function GetExecutionDetails(
  Region: string,
  ExecutionArn: string
): Promise<MethodResult<DescribeExecutionCommandOutput>> {
  ui.logToOutput("Getting execution details for: " + ExecutionArn);
  let result: MethodResult<DescribeExecutionCommandOutput> = new MethodResult<DescribeExecutionCommandOutput>();

  try {
    const sfn = await GetStepFuncClient(Region);

    const command = new DescribeExecutionCommand({
      executionArn: ExecutionArn,
    });

    const response = await sfn.send(command);
    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetExecutionDetails Error !!!", error);
    ui.logToOutput("api.GetExecutionDetails Error !!!", error);
    return result;
  }
}