/* eslint-disable @typescript-eslint/naming-convention */
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { SQSClient, ListQueuesCommand } from "@aws-sdk/client-sqs";
import * as ui from "../../../common/UI";
import { MethodResult } from '../../../common/MethodResult';
import { homedir } from "os";
import { sep } from "path";
import { join, basename, extname, dirname } from "path";
import { parseKnownFiles, SourceProfileInit } from "../../../common/aws-sdk/parseKnownFiles";
import { ParsedIniData } from "@aws-sdk/types";
import { SqsService } from '../SqsService';
import * as fs from 'fs';
import * as archiver from 'archiver';

export async function GetCredentials() {
  let credentials;

  try {
    if (SqsService.Instance) {
      process.env.AWS_PROFILE = SqsService.Instance.AwsProfile ;
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

async function GetSQSClient(region: string) {
  const credentials = await GetCredentials();
  
  const sqs = new SQSClient({
    region,
    credentials,
    endpoint: SqsService.Instance?.AwsEndPoint,
  });
  
  return sqs;
}

export async function GetSqsQueueList(
  region: string,
  QueName?: string
): Promise<MethodResult<string[]>> {
  let result: MethodResult<string[]> = new MethodResult<string[]>();
  result.result = [];

  try {
    const snd = await GetSQSClient(region);
    
    let allQues = [];
    let marker: string | undefined = undefined;
    
    // Continue fetching pages until no NextMarker is returned
    do {
      const command:ListQueuesCommand = new ListQueuesCommand({NextToken: marker,});
      const queList = await snd.send(command);

      if (queList.QueueUrls) {
        allQues.push(...queList.QueueUrls);
      }
      
      // Update marker to the next page (if present)
      marker = queList.NextToken;
    } while (marker);

    let matchingQueues;
    if (QueName) {
      matchingQueues = allQues.filter(
        (que) =>
          que.includes(QueName) || QueName.length === 0
      );
    } else {
      matchingQueues = allQues;
    }

    // Extract the function names into the result
    if (matchingQueues && matchingQueues.length > 0) {
      matchingQueues.forEach((que) => {
        if (que) result.result.push(que!);
      });
    }

    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetSqsQueueList Error !!!", error);
    ui.logToOutput("api.GetSqsQueueList Error !!!", error);
    return result;
  }
}

import {
  GetQueueAttributesCommand,
  GetQueueAttributesCommandInput,
  GetQueueAttributesCommandOutput,
} from "@aws-sdk/client-sqs";

export async function GetQueueDetails(region: string, queueUrl: string) {
  const sqs = new SQSClient({ region });
  const command = new GetQueueAttributesCommand({
    QueueUrl: queueUrl,
    AttributeNames: [
      "QueueArn",
      "CreatedTimestamp",
      "LastModifiedTimestamp",
      "MaximumMessageSize",
      "RedrivePolicy", // Dead-letter queue info
      "All" // To get all attributes
    ]
  });
  const response = await sqs.send(command);

  // Extract details
  return {
    QueueUrl: queueUrl,
    QueueArn: response.Attributes?.QueueArn,
    CreatedDate: response.Attributes?.CreatedTimestamp,
    LastUpdatedDate: response.Attributes?.LastModifiedTimestamp,
    MaxMessageSize: response.Attributes?.MaximumMessageSize,
    DeadLetterQueueEnabled: !!response.Attributes?.RedrivePolicy,
    // Queue Name and Type are not direct attributes, but you can parse the name from the URL
    QueueName: queueUrl.split("/").pop(),
    Type: response.Attributes?.FifoQueue === "true" ? "FIFO" : "Standard"
  };
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

import {
  SendMessageCommand,
  SendMessageCommandInput,
  SendMessageCommandOutput,
} from "@aws-sdk/client-sqs";

export async function SendMessage(
  Region: string,
  QueueUrl: string,
  Message: string
): Promise<MethodResult<SendMessageCommandOutput>> {
  let result: MethodResult<SendMessageCommandOutput> = new MethodResult<SendMessageCommandOutput>();

  try {
    const sqs = await GetSQSClient(Region);

    const param: SendMessageCommandInput = {
      QueueUrl: QueueUrl,
      MessageBody: Message
    };

    const command = new SendMessageCommand(param);
    const response = await sqs.send(command);

    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.SendMessage Error !!!", error);
    ui.logToOutput("api.SendMessage Error !!!", error);
    return result;
  }
}

import {ReceiveMessageCommand, ReceiveMessageCommandOutput, ReceiveMessageCommandInput} from "@aws-sdk/client-sqs";

export async function ReceiveMessage(
  Region: string,
  QueueUrl: string,
  MaxNumberOfMessages: number = 1,
  WaitTimeSeconds: number = 0
): Promise<MethodResult<ReceiveMessageCommandOutput>> {
  let result: MethodResult<ReceiveMessageCommandOutput> = new MethodResult<ReceiveMessageCommandOutput>();
  try {
    const sqs = await GetSQSClient(Region);
    const params: ReceiveMessageCommandInput = {
      QueueUrl,
      MaxNumberOfMessages,
      WaitTimeSeconds,
    };
    const command = new ReceiveMessageCommand(params);
    const response = await sqs.send(command);
    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.ReceiveMessage Error !!!", error);
    ui.logToOutput("api.ReceiveMessage Error !!!", error);
    return result;
  }
}

import { PurgeQueueCommand, PurgeQueueCommandOutput } from "@aws-sdk/client-sqs";

export async function PurgeQueue(Region: string, QueueUrl: string): Promise<MethodResult<PurgeQueueCommandOutput>> {
  let result: MethodResult<PurgeQueueCommandOutput> = new MethodResult<PurgeQueueCommandOutput>();
  try {
    const sqs = await GetSQSClient(Region);
    const command = new PurgeQueueCommand({ QueueUrl });
    const response = await sqs.send(command);
    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.PurgeQueue Error !!!", error);
    ui.logToOutput("api.PurgeQueue Error !!!", error);
    return result;
  }
}

import {
  DeleteMessageCommand,
  DeleteMessageCommandInput,
  DeleteMessageCommandOutput,
} from "@aws-sdk/client-sqs";

export async function DeleteMessage(
  Region: string,
  QueueUrl: string,
  ReceiptHandle: string
): Promise<MethodResult<DeleteMessageCommandOutput>> {
  let result: MethodResult<DeleteMessageCommandOutput> = new MethodResult<DeleteMessageCommandOutput>();
  try {
    const sqs = await GetSQSClient(Region);
    const params: DeleteMessageCommandInput = {
      QueueUrl,
      ReceiptHandle,
    };
    const command = new DeleteMessageCommand(params);
    const response = await sqs.send(command);
    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.DeleteMessage Error !!!", error);
    ui.logToOutput("api.DeleteMessage Error !!!", error);
    return result;
  }
}

export async function DeleteAllMessages(
  Region: string,
  QueueUrl: string,
  MaxBatch: number = 10
): Promise<MethodResult<number>> {
  let result: MethodResult<number> = new MethodResult<number>();
  let deletedCount = 0;
  try {
    const sqs = await GetSQSClient(Region);
    while (true) {
      // Receive up to MaxBatch messages
      const receiveParams = {
        QueueUrl,
        MaxNumberOfMessages: MaxBatch,
        WaitTimeSeconds: 0,
      };
      const receiveCommand = new ReceiveMessageCommand(receiveParams);
      const receiveResponse = await sqs.send(receiveCommand);
      const messages = receiveResponse.Messages || [];
      if (messages.length === 0) {
        break;
      }
      for (const msg of messages) {
        if (msg.ReceiptHandle) {
          const deleteParams = {
            QueueUrl,
            ReceiptHandle: msg.ReceiptHandle,
          };
          const deleteCommand = new DeleteMessageCommand(deleteParams);
          await sqs.send(deleteCommand);
          deletedCount++;
        }
      }
    }
    result.result = deletedCount;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.DeleteAllMessages Error !!!", error);
    ui.logToOutput("api.DeleteAllMessages Error !!!", error);
    return result;
  }
}

export async function GetQueuePolicy(
  region: string,
  queueUrl: string
): Promise<MethodResult<string | undefined>> {
  let result: MethodResult<string | undefined> = new MethodResult<string | undefined>();
  try {
    const sqs = await GetSQSClient(region);
    const command = new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ["Policy"]
    });
    const response = await sqs.send(command);
    result.result = response.Attributes?.Policy;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetQueuePolicy Error !!!", error);
    ui.logToOutput("api.GetQueuePolicy Error !!!", error);
    return result;
  }
}

export async function GetMessageCount(
  Region: string,
  QueueUrl: string
): Promise<MethodResult<number>> {
  let result: MethodResult<number> = new MethodResult<number>();
  try {
    const sqs = await GetSQSClient(Region);
    const command = new GetQueueAttributesCommand({
      QueueUrl,
      AttributeNames: ["ApproximateNumberOfMessages"]
    });
    const response = await sqs.send(command);
    const count = response.Attributes?.ApproximateNumberOfMessages
      ? parseInt(response.Attributes.ApproximateNumberOfMessages, 10)
      : 0;
    result.result = count;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetMessageCount Error !!!", error);
    ui.logToOutput("api.GetMessageCount Error !!!", error);
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
      endpoint: SqsService.Instance?.AwsEndPoint,
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