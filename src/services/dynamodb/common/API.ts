/* eslint-disable @typescript-eslint/naming-convention */
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import { 
  DynamoDBClient, 
  ListTablesCommand, 
  DescribeTableCommand, 
  CreateTableCommand, 
  DeleteTableCommand,
  QueryCommand,
  ScanCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  GetItemCommand,
  UpdateTableCommand,
  UpdateTimeToLiveCommand,
  ListTagsOfResourceCommand
} from "@aws-sdk/client-dynamodb";
import { CloudWatchLogsClient, OutputLogEvent } from "@aws-sdk/client-cloudwatch-logs";
import { IAMClient } from "@aws-sdk/client-iam";
import * as ui from "./UI";
import { MethodResult } from './MethodResult';
import { homedir } from "os";
import { sep } from "path";
import { join, basename, extname, dirname } from "path";
import { parseKnownFiles, SourceProfileInit } from "../aws-sdk/parseKnownFiles";
import { ParsedIniData } from "@aws-sdk/types";
import * as DynamodbTreeView from '../dynamodb/DynamodbTreeView';
import * as fs from 'fs';
import * as archiver from 'archiver';

export async function GetCredentials() {
  let credentials;

  try {
    if (DynamodbTreeView.DynamodbTreeView.Current) {
      process.env.AWS_PROFILE = DynamodbTreeView.DynamodbTreeView.Current.AwsProfile ;
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

async function GetDynamodbClient(region: string) {
  const credentials = await GetCredentials();
  
  const dynamodbClient = new DynamoDBClient({
    region,
    credentials,
    endpoint: DynamodbTreeView.DynamodbTreeView.Current?.AwsEndPoint,
  });
  
  return dynamodbClient;
}

async function GetCloudWatchClient(region: string) {
  const credentials = await GetCredentials();
  const cloudwatchLogsClient = new CloudWatchLogsClient({
    region,
    credentials,
    endpoint: DynamodbTreeView.DynamodbTreeView.Current?.AwsEndPoint,
  });
  
  return cloudwatchLogsClient;
}

async function GetIAMClient() {
  const credentials = await GetCredentials();
  const iamClient = new IAMClient({ credentials });
  return iamClient;
}

export async function GetDynamodbList(
  region: string,
  TableNameFilter?: string
): Promise<MethodResult<string[]>> {
  let result: MethodResult<string[]> = new MethodResult<string[]>();
  result.result = [];

  try {
    // Get the DynamoDB client (v3 client)
    const dynamodb = await GetDynamodbClient(region);
    
    let allTables: string[] = [];
    let exclusiveStartTableName: string | undefined = undefined;
    
    // Continue fetching pages until no ExclusiveStartTableName is returned
    do {
      const command: ListTablesCommand = new ListTablesCommand({ 
        ExclusiveStartTableName: exclusiveStartTableName 
      });
      const tablesList = await dynamodb.send(command);
      
      if (tablesList.TableNames) {
        allTables.push(...tablesList.TableNames);
      }
      
      // Update marker to the next page (if present)
      exclusiveStartTableName = tablesList.LastEvaluatedTableName;
    } while (exclusiveStartTableName);

    // Filter tables if a TableNameFilter is provided
    let matchingTables;
    if (TableNameFilter) {
      matchingTables = allTables.filter(
        (tableName) =>
          tableName.includes(TableNameFilter) || TableNameFilter.length === 0
      );
    } else {
      matchingTables = allTables;
    }

    // Add the table names to the result
    result.result = matchingTables;

    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetDynamodbList Error !!!", error);
    ui.logToOutput("api.GetDynamodbList Error !!!", error);
    return result;
  }
}

export async function CreateDynamodbTable(
  region: string,
  tableName: string,
  partitionKeyName: string,
  partitionKeyType: string,
  sortKeyName?: string,
  sortKeyType?: string
): Promise<MethodResult<any>> {
  let result: MethodResult<any> = new MethodResult<any>();

  try {
    const dynamodb = await GetDynamodbClient(region);

    const keySchema: any[] = [
      { AttributeName: partitionKeyName, KeyType: 'HASH' }
    ];

    const attributeDefinitions: any[] = [
      { AttributeName: partitionKeyName, AttributeType: partitionKeyType }
    ];

    if (sortKeyName && sortKeyType) {
      keySchema.push({ AttributeName: sortKeyName, KeyType: 'RANGE' });
      attributeDefinitions.push({ AttributeName: sortKeyName, AttributeType: sortKeyType });
    }

    const command = new CreateTableCommand({
      TableName: tableName,
      KeySchema: keySchema,
      AttributeDefinitions: attributeDefinitions,
      BillingMode: 'PAY_PER_REQUEST', // Use on-demand billing by default
    });

    const response = await dynamodb.send(command);
    result.result = response;
    result.isSuccessful = true;
    ui.showInfoMessage(`Table ${tableName} created successfully!`);
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.CreateDynamodbTable Error !!!", error);
    ui.logToOutput("api.CreateDynamodbTable Error !!!", error);
    return result;
  }
}

export async function DeleteDynamodbTable(
  region: string,
  tableName: string
): Promise<MethodResult<any>> {
  let result: MethodResult<any> = new MethodResult<any>();

  try {
    const dynamodb = await GetDynamodbClient(region);

    const command = new DeleteTableCommand({
      TableName: tableName,
    });

    const response = await dynamodb.send(command);
    result.result = response;
    result.isSuccessful = true;
    ui.showInfoMessage(`Table ${tableName} deleted successfully!`);
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.DeleteDynamodbTable Error !!!", error);
    ui.logToOutput("api.DeleteDynamodbTable Error !!!", error);
    return result;
  }
}

export async function UpdateTableCapacity(
  region: string,
  tableName: string,
  readCapacity?: number,
  writeCapacity?: number,
  billingMode?: string
): Promise<MethodResult<any>> {
  let result: MethodResult<any> = new MethodResult<any>();

  try {
    const dynamodb = await GetDynamodbClient(region);

    const updateParams: any = {
      TableName: tableName,
    };

    if (billingMode) {
      updateParams.BillingMode = billingMode;
      if (billingMode === 'PROVISIONED' && readCapacity && writeCapacity) {
        updateParams.ProvisionedThroughput = {
          ReadCapacityUnits: readCapacity,
          WriteCapacityUnits: writeCapacity
        };
      }
    } else if (readCapacity && writeCapacity) {
      updateParams.ProvisionedThroughput = {
        ReadCapacityUnits: readCapacity,
        WriteCapacityUnits: writeCapacity
      };
    }

    const command = new UpdateTableCommand(updateParams);
    const response = await dynamodb.send(command);
    result.result = response;
    result.isSuccessful = true;
    ui.showInfoMessage(`Table ${tableName} capacity updated successfully!`);
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.UpdateTableCapacity Error !!!", error);
    ui.logToOutput("api.UpdateTableCapacity Error !!!", error);
    return result;
  }
}

export async function QueryTable(
  region: string,
  tableName: string,
  keyConditionExpression: string,
  expressionAttributeValues: any,
  indexName?: string,
  limit?: number
): Promise<MethodResult<any>> {
  let result: MethodResult<any> = new MethodResult<any>();

  try {
    const dynamodb = await GetDynamodbClient(region);

    const queryParams: any = {
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    if (indexName) {
      queryParams.IndexName = indexName;
    }

    if (limit) {
      queryParams.Limit = limit;
    }

    const command = new QueryCommand(queryParams);
    const response = await dynamodb.send(command);
    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.QueryTable Error !!!", error);
    ui.logToOutput("api.QueryTable Error !!!", error);
    return result;
  }
}

export async function ScanTable(
  region: string,
  tableName: string,
  limit?: number,
  filterExpression?: string,
  expressionAttributeValues?: any
): Promise<MethodResult<any>> {
  let result: MethodResult<any> = new MethodResult<any>();

  try {
    const dynamodb = await GetDynamodbClient(region);

    const scanParams: any = {
      TableName: tableName,
    };

    if (limit) {
      scanParams.Limit = limit;
    }

    if (filterExpression) {
      scanParams.FilterExpression = filterExpression;
    }

    if (expressionAttributeValues) {
      scanParams.ExpressionAttributeValues = expressionAttributeValues;
    }

    const command = new ScanCommand(scanParams);
    const response = await dynamodb.send(command);
    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.ScanTable Error !!!", error);
    ui.logToOutput("api.ScanTable Error !!!", error);
    return result;
  }
}

export async function GetItem(
  region: string,
  tableName: string,
  key: any
): Promise<MethodResult<any>> {
  let result: MethodResult<any> = new MethodResult<any>();

  try {
    const dynamodb = await GetDynamodbClient(region);

    const command = new GetItemCommand({
      TableName: tableName,
      Key: key,
    });

    const response = await dynamodb.send(command);
    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetItem Error !!!", error);
    ui.logToOutput("api.GetItem Error !!!", error);
    return result;
  }
}

export async function PutItem(
  region: string,
  tableName: string,
  item: any
): Promise<MethodResult<any>> {
  let result: MethodResult<any> = new MethodResult<any>();

  try {
    const dynamodb = await GetDynamodbClient(region);

    const command = new PutItemCommand({
      TableName: tableName,
      Item: item,
    });

    const response = await dynamodb.send(command);
    result.result = response;
    result.isSuccessful = true;
    ui.showInfoMessage('Item added successfully!');
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.PutItem Error !!!", error);
    ui.logToOutput("api.PutItem Error !!!", error);
    return result;
  }
}

export async function UpdateItem(
  region: string,
  tableName: string,
  key: any,
  updateExpression: string,
  expressionAttributeValues: any
): Promise<MethodResult<any>> {
  let result: MethodResult<any> = new MethodResult<any>();

  try {
    const dynamodb = await GetDynamodbClient(region);

    const command = new UpdateItemCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const response = await dynamodb.send(command);
    result.result = response;
    result.isSuccessful = true;
    ui.showInfoMessage('Item updated successfully!');
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.UpdateItem Error !!!", error);
    ui.logToOutput("api.UpdateItem Error !!!", error);
    return result;
  }
}

export async function DeleteItem(
  region: string,
  tableName: string,
  key: any
): Promise<MethodResult<any>> {
  let result: MethodResult<any> = new MethodResult<any>();

  try {
    const dynamodb = await GetDynamodbClient(region);

    const command = new DeleteItemCommand({
      TableName: tableName,
      Key: key,
    });

    const response = await dynamodb.send(command);
    result.result = response;
    result.isSuccessful = true;
    ui.showInfoMessage('Item deleted successfully!');
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.DeleteItem Error !!!", error);
    ui.logToOutput("api.DeleteItem Error !!!", error);
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

// Note: DynamoDB Tables don't have "trigger" capability like Lambda functions
// This is kept for backward compatibility but returns a message
export async function TriggerDynamodb(
  Region: string,
  TableName: string,
  Parameters: { [key: string]: any }
): Promise<MethodResult<any>> {
  let result: MethodResult<any> = new MethodResult<any>();

  try {
    result.isSuccessful = false;
    result.error = new Error("Trigger operation is not applicable for DynamoDB tables");
    ui.showInfoMessage("Trigger operation is not applicable for DynamoDB tables. Use AWS Lambda integration if you need triggers.");
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    return result;
  }
}



import {
  DescribeLogStreamsCommand,
  GetLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

export async function GetLatestDynamodbLogStreamName(
  Region: string,
  Dynamodb: string
): Promise<MethodResult<string>> {
  ui.logToOutput("GetLatestDynamodbLogStreamName for Dynamodb function: " + Dynamodb);
  let result: MethodResult<string> = new MethodResult<string>();

  try {
    // Get the log group name
    const logGroupName = GetDynamodbLogGroupName(Dynamodb);
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
      result.error = new Error("No log streams found for this Dynamodb function.");
      ui.showErrorMessage("No log streams found for this Dynamodb function.", result.error);
      ui.logToOutput("No log streams found for this Dynamodb function.");
      return result;
    }

    // Get the latest log events from the first stream
    const logStreamName = streamsResponse.logStreams[0].logStreamName;
    if (!logStreamName) {
      result.isSuccessful = false;
      result.error = new Error("No log stream name found for this Dynamodb function.");
      ui.showErrorMessage("No log stream name found for this Dynamodb function.", result.error);
      ui.logToOutput("No log stream name found for this Dynamodb function.");
      return result;
    }

    result.result = logStreamName;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetLatestDynamodbLogStreamName Error !!!", error);
    ui.logToOutput("api.GetLatestDynamodbLogStreamName Error !!!", error);
    return result;
  }
}

export function GetDynamodbLogGroupName(Dynamodb: string) {
  return `/aws/dynamodb/${Dynamodb}`;
}

export async function GetLatestDynamodbLogs(
  Region: string,
  Dynamodb: string
): Promise<MethodResult<string>> {
  ui.logToOutput("Getting logs for Dynamodb function: " + Dynamodb);
  let result: MethodResult<string> = new MethodResult<string>();

  try {
    // Get the log group name
    const logGroupName = GetDynamodbLogGroupName(Dynamodb);
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
      result.error = new Error("No log streams found for this Dynamodb function.");
      ui.showErrorMessage("No log streams found for this Dynamodb function.", result.error);
      ui.logToOutput("No log streams found for this Dynamodb function.");
      return result;
    }

    // Get the latest log events from the first stream
    const logStreamName = streamsResponse.logStreams[0].logStreamName;
    if (!logStreamName) {
      result.isSuccessful = false;
      result.error = new Error("No log stream name found for this Dynamodb function.");
      ui.showErrorMessage("No log stream name found for this Dynamodb function.", result.error);
      ui.logToOutput("No log stream name found for this Dynamodb function.");
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
      result.error = new Error("No log events found for this Dynamodb function.");
      ui.showErrorMessage("No log events found for this Dynamodb function.", result.error);
      ui.logToOutput("No log events found for this Dynamodb function.");
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
    ui.showErrorMessage("api.GetLatestDynamodbLogs Error !!!", error);
    ui.logToOutput("api.GetLatestDynamodbLogs Error !!!", error);
    return result;
  }
}

export async function GetLatestDynamodbLogStreams(
  Region: string,
  Dynamodb: string
): Promise<MethodResult<string[]>> {
  ui.logToOutput("Getting log streams for Dynamodb function: " + Dynamodb);
  let result: MethodResult<string[]> = new MethodResult<string[]>();
  result.result = [];

  try {
    // Get the log group name
    const logGroupName = GetDynamodbLogGroupName(Dynamodb);
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
    ui.showErrorMessage("api.GetLatestDynamodbLogStreams Error !!!", error);
    ui.logToOutput("api.GetLatestDynamodbLogStreams Error !!!", error);
    return result;
  }
}

export async function GetDynamodbLogs(
  Region: string,
  Dynamodb: string,
  LogStreamName: string
): Promise<MethodResult<string>> {
  ui.logToOutput("Getting logs for Dynamodb function: " + Dynamodb + " LogStream " + LogStreamName);
  let result: MethodResult<string> = new MethodResult<string>();

  try {
    // Get the log group name
    const logGroupName = GetDynamodbLogGroupName(Dynamodb);
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
      result.error = new Error("No log events found for this Dynamodb function." + Dynamodb + " LogStream " + LogStreamName);
      ui.showErrorMessage("No log events found for this Dynamodb function."+ Dynamodb + " LogStream " + LogStreamName, result.error);
      ui.logToOutput("No log events found for this Dynamodb function."+ Dynamodb + " LogStream " + LogStreamName);
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
    ui.showErrorMessage("api.GetLatestDynamodbLogs Error !!!", error);
    ui.logToOutput("api.GetLatestDynamodbLogs Error !!!", error);
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


export async function GetDynamodb(
  Region: string,
  TableName: string
): Promise<MethodResult<any>> {
  let result: MethodResult<any> = new MethodResult<any>();

  try {
    const dynamodb = await GetDynamodbClient(Region);

    const command = new DescribeTableCommand({
      TableName: TableName,
    });

    const response = await dynamodb.send(command);
    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetDynamodb Error !!!", error);
    ui.logToOutput("api.GetDynamodb Error !!!", error);
    return result;
  }
}

export async function GetTableTags(
  region: string,
  tableArn: string
): Promise<MethodResult<Array<{ key: string; value: string }>>> {
  let result: MethodResult<Array<{ key: string; value: string }>> = new MethodResult<Array<{ key: string; value: string }>>();
  result.result = [];

  try {
    const dynamodb = await GetDynamodbClient(region);

    const command = new ListTagsOfResourceCommand({
      ResourceArn: tableArn,
    });

    const response = await dynamodb.send(command);
    
    if (response.Tags) {
      result.result = response.Tags.map((tag: any) => ({
        key: tag.Key || '',
        value: tag.Value || ''
      }));
    }

    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.logToOutput("api.GetTableTags Error !!!", error);
    // Tags are optional, so we don't show error message to user
    return result;
  }
}


export interface TableDetails {
  partitionKey?: { name: string; type: string };
  sortKey?: { name: string; type: string };
  billingMode?: string;
  readCapacity?: number;
  writeCapacity?: number;
  tableSize?: number;
  itemCount?: number;
  tableClass?: string;
  tableStatus?: string;
  globalSecondaryIndexes?: Array<{ name: string; keys: string }>;
  localSecondaryIndexes?: Array<{ name: string; keys: string }>;
  tableArn?: string;
  tags?: Array<{ key: string; value: string }>;
  averageItemSize?: number;
}

export function ExtractTableDetails(describeTableResponse: any): TableDetails {
  const table = describeTableResponse.Table;
  if (!table) {
    return {};
  }

  const details: TableDetails = {};

  // Extract partition and sort keys
  if (table.KeySchema) {
    const partitionKeyAttr = table.KeySchema.find((k: any) => k.KeyType === 'HASH');
    const sortKeyAttr = table.KeySchema.find((k: any) => k.KeyType === 'RANGE');
    
    if (partitionKeyAttr && table.AttributeDefinitions) {
      const attr = table.AttributeDefinitions.find((a: any) => a.AttributeName === partitionKeyAttr.AttributeName);
      details.partitionKey = {
        name: partitionKeyAttr.AttributeName,
        type: attr?.AttributeType || 'Unknown'
      };
    }
    
    if (sortKeyAttr && table.AttributeDefinitions) {
      const attr = table.AttributeDefinitions.find((a: any) => a.AttributeName === sortKeyAttr.AttributeName);
      details.sortKey = {
        name: sortKeyAttr.AttributeName,
        type: attr?.AttributeType || 'Unknown'
      };
    }
  }

  // Extract billing mode and capacity
  details.billingMode = table.BillingModeSummary?.BillingMode || 'PROVISIONED';
  if (table.ProvisionedThroughput) {
    details.readCapacity = table.ProvisionedThroughput.ReadCapacityUnits;
    details.writeCapacity = table.ProvisionedThroughput.WriteCapacityUnits;
  }

  // Extract table info
  details.tableSize = table.TableSizeBytes;
  details.itemCount = table.ItemCount;
  details.tableClass = table.TableClassSummary?.TableClass || 'STANDARD';
  details.tableStatus = table.TableStatus;
  details.tableArn = table.TableArn;

  // Calculate average item size
  if (details.tableSize && details.itemCount && details.itemCount > 0) {
    details.averageItemSize = Math.round(details.tableSize / details.itemCount);
  }

  // Extract indexes
  if (table.GlobalSecondaryIndexes) {
    details.globalSecondaryIndexes = table.GlobalSecondaryIndexes.map((gsi: any) => ({
      name: gsi.IndexName,
      keys: gsi.KeySchema.map((k: any) => `${k.AttributeName} (${k.KeyType})`).join(', ')
    }));
  }

  if (table.LocalSecondaryIndexes) {
    details.localSecondaryIndexes = table.LocalSecondaryIndexes.map((lsi: any) => ({
      name: lsi.IndexName,
      keys: lsi.KeySchema.map((k: any) => `${k.AttributeName} (${k.KeyType})`).join(', ')
    }));
  }

  return details;
}


export async function GetDynamodbConfiguration(
  Region: string,
  TableName: string
): Promise<MethodResult<any>> {
  let result: MethodResult<any> = new MethodResult<any>();

  try {
    result.isSuccessful = false;
    result.error = new Error("Configuration operation is not applicable for DynamoDB tables");
    ui.showInfoMessage("Configuration operation is not applicable for DynamoDB tables. Use DescribeTable instead.");
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    return result;
  }
}

// Note: DynamoDB tables don't have "code" like Lambda functions
// Kept as stub for backward compatibility
export async function UpdateDynamodbCode(
  Region: string,
  TableName: string,
  CodeFilePath: string
): Promise<MethodResult<any>> {
  let result: MethodResult<any> = new MethodResult<any>();

  try {
    result.isSuccessful = false;
    result.error = new Error("Code update operation is not applicable for DynamoDB tables");
    ui.showInfoMessage("Code update operation is not applicable for DynamoDB tables.");
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
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

import { GetUserCommand, GetUserCommandOutput } from "@aws-sdk/client-iam";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

async function GetSTSClient(region: string) {
  const credentials = await GetCredentials();
  const iamClient = new STSClient(
    {
      region,
      credentials,
      endpoint: DynamodbTreeView.DynamodbTreeView.Current?.AwsEndPoint,
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