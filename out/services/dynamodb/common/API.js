"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFilepath = exports.getCredentialsFilepath = exports.getHomeDir = exports.ENV_CREDENTIALS_PATH = void 0;
exports.GetCredentials = GetCredentials;
exports.GetDynamodbList = GetDynamodbList;
exports.CreateDynamodbTable = CreateDynamodbTable;
exports.DeleteDynamodbTable = DeleteDynamodbTable;
exports.UpdateTableCapacity = UpdateTableCapacity;
exports.QueryTable = QueryTable;
exports.ScanTable = ScanTable;
exports.GetItem = GetItem;
exports.PutItem = PutItem;
exports.UpdateItem = UpdateItem;
exports.DeleteItem = DeleteItem;
exports.isJsonString = isJsonString;
exports.ParseJson = ParseJson;
exports.TriggerDynamodb = TriggerDynamodb;
exports.GetLatestDynamodbLogStreamName = GetLatestDynamodbLogStreamName;
exports.GetDynamodbLogGroupName = GetDynamodbLogGroupName;
exports.GetLatestDynamodbLogs = GetLatestDynamodbLogs;
exports.GetLatestDynamodbLogStreams = GetLatestDynamodbLogStreams;
exports.GetDynamodbLogs = GetDynamodbLogs;
exports.GetLogEvents = GetLogEvents;
exports.GetDynamodb = GetDynamodb;
exports.GetTableTags = GetTableTags;
exports.ExtractTableDetails = ExtractTableDetails;
exports.GetDynamodbConfiguration = GetDynamodbConfiguration;
exports.UpdateDynamodbCode = UpdateDynamodbCode;
exports.ZipTextFile = ZipTextFile;
exports.TestAwsCredentials = TestAwsCredentials;
exports.TestAwsConnection = TestAwsConnection;
exports.GetAwsProfileList = GetAwsProfileList;
exports.getIniProfileData = getIniProfileData;
/* eslint-disable @typescript-eslint/naming-convention */
const credential_providers_1 = require("@aws-sdk/credential-providers");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
const client_iam_1 = require("@aws-sdk/client-iam");
const ui = require("./UI");
const MethodResult_1 = require("./MethodResult");
const os_1 = require("os");
const path_1 = require("path");
const path_2 = require("path");
const parseKnownFiles_1 = require("../aws-sdk/parseKnownFiles");
const DynamodbService_1 = require("../DynamodbService");
const fs = require("fs");
const archiver = require("archiver");
async function GetCredentials() {
    let credentials;
    try {
        if (DynamodbService_1.DynamodbService.Instance) {
            process.env.AWS_PROFILE = DynamodbService_1.DynamodbService.Instance.AwsProfile;
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
async function GetDynamodbClient(region) {
    const credentials = await GetCredentials();
    const dynamodbClient = new client_dynamodb_1.DynamoDBClient({
        region,
        credentials,
        endpoint: DynamodbService_1.DynamodbService.Instance?.AwsEndPoint,
    });
    return dynamodbClient;
}
async function GetCloudWatchClient(region) {
    const credentials = await GetCredentials();
    const cloudwatchLogsClient = new client_cloudwatch_logs_1.CloudWatchLogsClient({
        region,
        credentials,
        endpoint: DynamodbService_1.DynamodbService.Instance?.AwsEndPoint,
    });
    return cloudwatchLogsClient;
}
async function GetIAMClient() {
    const credentials = await GetCredentials();
    const iamClient = new client_iam_1.IAMClient({ credentials });
    return iamClient;
}
async function GetDynamodbList(region, TableNameFilter) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        // Get the DynamoDB client (v3 client)
        const dynamodb = await GetDynamodbClient(region);
        let allTables = [];
        let exclusiveStartTableName = undefined;
        // Continue fetching pages until no ExclusiveStartTableName is returned
        do {
            const command = new client_dynamodb_1.ListTablesCommand({
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
            matchingTables = allTables.filter((tableName) => tableName.includes(TableNameFilter) || TableNameFilter.length === 0);
        }
        else {
            matchingTables = allTables;
        }
        // Add the table names to the result
        result.result = matchingTables;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetDynamodbList Error !!!", error);
        ui.logToOutput("api.GetDynamodbList Error !!!", error);
        return result;
    }
}
async function CreateDynamodbTable(region, tableName, partitionKeyName, partitionKeyType, sortKeyName, sortKeyType) {
    let result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamodbClient(region);
        const keySchema = [
            { AttributeName: partitionKeyName, KeyType: 'HASH' }
        ];
        const attributeDefinitions = [
            { AttributeName: partitionKeyName, AttributeType: partitionKeyType }
        ];
        if (sortKeyName && sortKeyType) {
            keySchema.push({ AttributeName: sortKeyName, KeyType: 'RANGE' });
            attributeDefinitions.push({ AttributeName: sortKeyName, AttributeType: sortKeyType });
        }
        const command = new client_dynamodb_1.CreateTableCommand({
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
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.CreateDynamodbTable Error !!!", error);
        ui.logToOutput("api.CreateDynamodbTable Error !!!", error);
        return result;
    }
}
async function DeleteDynamodbTable(region, tableName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamodbClient(region);
        const command = new client_dynamodb_1.DeleteTableCommand({
            TableName: tableName,
        });
        const response = await dynamodb.send(command);
        result.result = response;
        result.isSuccessful = true;
        ui.showInfoMessage(`Table ${tableName} deleted successfully!`);
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.DeleteDynamodbTable Error !!!", error);
        ui.logToOutput("api.DeleteDynamodbTable Error !!!", error);
        return result;
    }
}
async function UpdateTableCapacity(region, tableName, readCapacity, writeCapacity, billingMode) {
    let result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamodbClient(region);
        const updateParams = {
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
        }
        else if (readCapacity && writeCapacity) {
            updateParams.ProvisionedThroughput = {
                ReadCapacityUnits: readCapacity,
                WriteCapacityUnits: writeCapacity
            };
        }
        const command = new client_dynamodb_1.UpdateTableCommand(updateParams);
        const response = await dynamodb.send(command);
        result.result = response;
        result.isSuccessful = true;
        ui.showInfoMessage(`Table ${tableName} capacity updated successfully!`);
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.UpdateTableCapacity Error !!!", error);
        ui.logToOutput("api.UpdateTableCapacity Error !!!", error);
        return result;
    }
}
async function QueryTable(region, tableName, keyConditionExpression, expressionAttributeValues, indexName, limit) {
    let result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamodbClient(region);
        const queryParams = {
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
        const command = new client_dynamodb_1.QueryCommand(queryParams);
        const response = await dynamodb.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.QueryTable Error !!!", error);
        ui.logToOutput("api.QueryTable Error !!!", error);
        return result;
    }
}
async function ScanTable(region, tableName, limit, filterExpression, expressionAttributeValues) {
    let result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamodbClient(region);
        const scanParams = {
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
        const command = new client_dynamodb_1.ScanCommand(scanParams);
        const response = await dynamodb.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.ScanTable Error !!!", error);
        ui.logToOutput("api.ScanTable Error !!!", error);
        return result;
    }
}
async function GetItem(region, tableName, key) {
    let result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamodbClient(region);
        const command = new client_dynamodb_1.GetItemCommand({
            TableName: tableName,
            Key: key,
        });
        const response = await dynamodb.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetItem Error !!!", error);
        ui.logToOutput("api.GetItem Error !!!", error);
        return result;
    }
}
async function PutItem(region, tableName, item) {
    let result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamodbClient(region);
        const command = new client_dynamodb_1.PutItemCommand({
            TableName: tableName,
            Item: item,
        });
        const response = await dynamodb.send(command);
        result.result = response;
        result.isSuccessful = true;
        ui.showInfoMessage('Item added successfully!');
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.PutItem Error !!!", error);
        ui.logToOutput("api.PutItem Error !!!", error);
        return result;
    }
}
async function UpdateItem(region, tableName, key, updateExpression, expressionAttributeValues) {
    let result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamodbClient(region);
        const command = new client_dynamodb_1.UpdateItemCommand({
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
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.UpdateItem Error !!!", error);
        ui.logToOutput("api.UpdateItem Error !!!", error);
        return result;
    }
}
async function DeleteItem(region, tableName, key) {
    let result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamodbClient(region);
        const command = new client_dynamodb_1.DeleteItemCommand({
            TableName: tableName,
            Key: key,
        });
        const response = await dynamodb.send(command);
        result.result = response;
        result.isSuccessful = true;
        ui.showInfoMessage('Item deleted successfully!');
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.DeleteItem Error !!!", error);
        ui.logToOutput("api.DeleteItem Error !!!", error);
        return result;
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
// Note: DynamoDB Tables don't have "trigger" capability like Lambda functions
// This is kept for backward compatibility but returns a message
async function TriggerDynamodb(Region, TableName, Parameters) {
    let result = new MethodResult_1.MethodResult();
    try {
        result.isSuccessful = false;
        result.error = new Error("Trigger operation is not applicable for DynamoDB tables");
        ui.showInfoMessage("Trigger operation is not applicable for DynamoDB tables. Use AWS Lambda integration if you need triggers.");
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        return result;
    }
}
const client_cloudwatch_logs_2 = require("@aws-sdk/client-cloudwatch-logs");
async function GetLatestDynamodbLogStreamName(Region, Dynamodb) {
    ui.logToOutput("GetLatestDynamodbLogStreamName for Dynamodb function: " + Dynamodb);
    let result = new MethodResult_1.MethodResult();
    try {
        // Get the log group name
        const logGroupName = GetDynamodbLogGroupName(Dynamodb);
        const cloudwatchlogs = await GetCloudWatchClient(Region);
        // Get the streams sorted by the latest event time
        const describeLogStreamsCommand = new client_cloudwatch_logs_2.DescribeLogStreamsCommand({
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
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLatestDynamodbLogStreamName Error !!!", error);
        ui.logToOutput("api.GetLatestDynamodbLogStreamName Error !!!", error);
        return result;
    }
}
function GetDynamodbLogGroupName(Dynamodb) {
    return `/aws/dynamodb/${Dynamodb}`;
}
async function GetLatestDynamodbLogs(Region, Dynamodb) {
    ui.logToOutput("Getting logs for Dynamodb function: " + Dynamodb);
    let result = new MethodResult_1.MethodResult();
    try {
        // Get the log group name
        const logGroupName = GetDynamodbLogGroupName(Dynamodb);
        const cloudwatchlogs = await GetCloudWatchClient(Region);
        // Get the streams sorted by the latest event time
        const describeLogStreamsCommand = new client_cloudwatch_logs_2.DescribeLogStreamsCommand({
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
        const getLogEventsCommand = new client_cloudwatch_logs_2.GetLogEventsCommand({
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
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLatestDynamodbLogs Error !!!", error);
        ui.logToOutput("api.GetLatestDynamodbLogs Error !!!", error);
        return result;
    }
}
async function GetLatestDynamodbLogStreams(Region, Dynamodb) {
    ui.logToOutput("Getting log streams for Dynamodb function: " + Dynamodb);
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        // Get the log group name
        const logGroupName = GetDynamodbLogGroupName(Dynamodb);
        const cloudwatchlogs = await GetCloudWatchClient(Region);
        // Get the streams sorted by the latest event time
        const describeLogStreamsCommand = new client_cloudwatch_logs_2.DescribeLogStreamsCommand({
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
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLatestDynamodbLogStreams Error !!!", error);
        ui.logToOutput("api.GetLatestDynamodbLogStreams Error !!!", error);
        return result;
    }
}
async function GetDynamodbLogs(Region, Dynamodb, LogStreamName) {
    ui.logToOutput("Getting logs for Dynamodb function: " + Dynamodb + " LogStream " + LogStreamName);
    let result = new MethodResult_1.MethodResult();
    try {
        // Get the log group name
        const logGroupName = GetDynamodbLogGroupName(Dynamodb);
        const cloudwatchlogs = await GetCloudWatchClient(Region);
        const getLogEventsCommand = new client_cloudwatch_logs_2.GetLogEventsCommand({
            logGroupName: logGroupName,
            logStreamName: LogStreamName,
            limit: 50, // Adjust the limit as needed
            startFromHead: true, // Start from the beginning of the log stream
        });
        const eventsResponse = await cloudwatchlogs.send(getLogEventsCommand);
        if (!eventsResponse.events || eventsResponse.events.length === 0) {
            result.isSuccessful = false;
            result.error = new Error("No log events found for this Dynamodb function." + Dynamodb + " LogStream " + LogStreamName);
            ui.showErrorMessage("No log events found for this Dynamodb function." + Dynamodb + " LogStream " + LogStreamName, result.error);
            ui.logToOutput("No log events found for this Dynamodb function." + Dynamodb + " LogStream " + LogStreamName);
            return result;
        }
        // Concatenate log messages
        result.result = eventsResponse.events
            .map((event) => event.message)
            .filter((msg) => msg)
            .join("\n");
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLatestDynamodbLogs Error !!!", error);
        ui.logToOutput("api.GetLatestDynamodbLogs Error !!!", error);
        return result;
    }
}
async function GetLogEvents(Region, LogGroupName, LogStreamName) {
    ui.logToOutput("Getting logs from LogGroupName: " + LogGroupName + " LogStreamName: " + LogStreamName);
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        // Get the log group name
        const cloudwatchlogs = await GetCloudWatchClient(Region);
        const getLogEventsCommand = new client_cloudwatch_logs_2.GetLogEventsCommand({
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
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLogEvents Error !!!", error);
        ui.logToOutput("api.GetLogEvents Error !!!", error);
        return result;
    }
}
async function GetDynamodb(Region, TableName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamodbClient(Region);
        const command = new client_dynamodb_1.DescribeTableCommand({
            TableName: TableName,
        });
        const response = await dynamodb.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetDynamodb Error !!!", error);
        ui.logToOutput("api.GetDynamodb Error !!!", error);
        return result;
    }
}
async function GetTableTags(region, tableArn) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const dynamodb = await GetDynamodbClient(region);
        const command = new client_dynamodb_1.ListTagsOfResourceCommand({
            ResourceArn: tableArn,
        });
        const response = await dynamodb.send(command);
        if (response.Tags) {
            result.result = response.Tags.map((tag) => ({
                key: tag.Key || '',
                value: tag.Value || ''
            }));
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.GetTableTags Error !!!", error);
        // Tags are optional, so we don't show error message to user
        return result;
    }
}
function ExtractTableDetails(describeTableResponse) {
    const table = describeTableResponse.Table;
    if (!table) {
        return {};
    }
    const details = {};
    // Extract partition and sort keys
    if (table.KeySchema) {
        const partitionKeyAttr = table.KeySchema.find((k) => k.KeyType === 'HASH');
        const sortKeyAttr = table.KeySchema.find((k) => k.KeyType === 'RANGE');
        if (partitionKeyAttr && table.AttributeDefinitions) {
            const attr = table.AttributeDefinitions.find((a) => a.AttributeName === partitionKeyAttr.AttributeName);
            details.partitionKey = {
                name: partitionKeyAttr.AttributeName,
                type: attr?.AttributeType || 'Unknown'
            };
        }
        if (sortKeyAttr && table.AttributeDefinitions) {
            const attr = table.AttributeDefinitions.find((a) => a.AttributeName === sortKeyAttr.AttributeName);
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
        details.globalSecondaryIndexes = table.GlobalSecondaryIndexes.map((gsi) => ({
            name: gsi.IndexName,
            keys: gsi.KeySchema.map((k) => `${k.AttributeName} (${k.KeyType})`).join(', ')
        }));
    }
    if (table.LocalSecondaryIndexes) {
        details.localSecondaryIndexes = table.LocalSecondaryIndexes.map((lsi) => ({
            name: lsi.IndexName,
            keys: lsi.KeySchema.map((k) => `${k.AttributeName} (${k.KeyType})`).join(', ')
        }));
    }
    return details;
}
async function GetDynamodbConfiguration(Region, TableName) {
    let result = new MethodResult_1.MethodResult();
    try {
        result.isSuccessful = false;
        result.error = new Error("Configuration operation is not applicable for DynamoDB tables");
        ui.showInfoMessage("Configuration operation is not applicable for DynamoDB tables. Use DescribeTable instead.");
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        return result;
    }
}
// Note: DynamoDB tables don't have "code" like Lambda functions
// Kept as stub for backward compatibility
async function UpdateDynamodbCode(Region, TableName, CodeFilePath) {
    let result = new MethodResult_1.MethodResult();
    try {
        result.isSuccessful = false;
        result.error = new Error("Code update operation is not applicable for DynamoDB tables");
        ui.showInfoMessage("Code update operation is not applicable for DynamoDB tables.");
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        return result;
    }
}
async function ZipTextFile(inputPath, outputZipPath) {
    let result = new MethodResult_1.MethodResult();
    try {
        if (!outputZipPath) {
            outputZipPath = (0, path_2.dirname)(inputPath) + "/" + (0, path_2.basename)(inputPath) + ".zip";
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
        }
        else {
            archive.file(inputPath, { name: (0, path_2.basename)(inputPath) });
        }
        archive.finalize();
        result.result = outputZipPath;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage('api.ZipTextFile Error !!!', error);
        ui.logToOutput("api.ZipTextFile Error !!!", error);
        return result;
    }
}
const client_sts_1 = require("@aws-sdk/client-sts");
async function GetSTSClient(region) {
    const credentials = await GetCredentials();
    const iamClient = new client_sts_1.STSClient({
        region,
        credentials,
        endpoint: DynamodbService_1.DynamodbService.Instance?.AwsEndPoint,
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
const getCredentialsFilepath = () => process.env[exports.ENV_CREDENTIALS_PATH] || (0, path_2.join)((0, exports.getHomeDir)(), ".aws", "credentials");
exports.getCredentialsFilepath = getCredentialsFilepath;
const getConfigFilepath = () => process.env[exports.ENV_CREDENTIALS_PATH] || (0, path_2.join)((0, exports.getHomeDir)(), ".aws", "config");
exports.getConfigFilepath = getConfigFilepath;
//# sourceMappingURL=API.js.map