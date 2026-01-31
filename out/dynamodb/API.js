"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDynamoDBClient = GetDynamoDBClient;
exports.GetDynamoDBTableList = GetDynamoDBTableList;
exports.DescribeTable = DescribeTable;
exports.ExtractTableDetails = ExtractTableDetails;
exports.GetTableTags = GetTableTags;
exports.UpdateDynamoDBTag = UpdateDynamoDBTag;
exports.RemoveDynamoDBTag = RemoveDynamoDBTag;
exports.QueryTable = QueryTable;
exports.ScanTable = ScanTable;
exports.GetItem = GetItem;
exports.PutItem = PutItem;
exports.UpdateItem = UpdateItem;
exports.DeleteItem = DeleteItem;
exports.BatchGetItem = BatchGetItem;
exports.BatchWriteItem = BatchWriteItem;
exports.formatDynamoDBValue = formatDynamoDBValue;
exports.toDynamoDBValue = toDynamoDBValue;
/* eslint-disable @typescript-eslint/naming-convention */
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const ui = require("../common/UI");
const MethodResult_1 = require("../common/MethodResult");
const Session_1 = require("../common/Session");
async function GetDynamoDBClient(region) {
    const credentials = await Session_1.Session.Current.GetCredentials();
    const dynamodbClient = new client_dynamodb_1.DynamoDBClient({
        region,
        credentials,
        endpoint: Session_1.Session.Current.AwsEndPoint,
    });
    return dynamodbClient;
}
async function GetDynamoDBTableList(region, tableNameFilter) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const dynamodb = await GetDynamoDBClient(region);
        let allTables = [];
        let exclusiveStartTableName = undefined;
        do {
            const command = new client_dynamodb_1.ListTablesCommand({
                ExclusiveStartTableName: exclusiveStartTableName
            });
            const tablesList = await dynamodb.send(command);
            if (tablesList.TableNames) {
                allTables.push(...tablesList.TableNames);
            }
            exclusiveStartTableName = tablesList.LastEvaluatedTableName;
        } while (exclusiveStartTableName);
        if (tableNameFilter) {
            result.result = allTables.filter((tableName) => tableName.toLowerCase().includes(tableNameFilter.toLowerCase()));
        }
        else {
            result.result = allTables;
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetDynamoDBTableList Error !!!", error);
        ui.logToOutput("api.GetDynamoDBTableList Error !!!", error);
        return result;
    }
}
async function DescribeTable(region, tableName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamoDBClient(region);
        const command = new client_dynamodb_1.DescribeTableCommand({
            TableName: tableName,
        });
        const response = await dynamodb.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.DescribeTable Error !!!", error);
        ui.logToOutput("api.DescribeTable Error !!!", error);
        return result;
    }
}
function ExtractTableDetails(describeTableResponse) {
    const table = describeTableResponse.Table;
    if (!table) {
        return {};
    }
    const details = {};
    // Store attribute definitions for later use
    if (table.AttributeDefinitions) {
        details.attributeDefinitions = table.AttributeDefinitions.map((a) => ({
            name: a.AttributeName,
            type: a.AttributeType
        }));
    }
    // Extract partition and sort keys
    if (table.KeySchema) {
        const partitionKeyAttr = table.KeySchema.find((k) => k.KeyType === 'HASH');
        const sortKeyAttr = table.KeySchema.find((k) => k.KeyType === 'RANGE');
        if (partitionKeyAttr && table.AttributeDefinitions) {
            const attr = table.AttributeDefinitions.find((a) => a.AttributeName === partitionKeyAttr.AttributeName);
            details.partitionKey = {
                name: partitionKeyAttr.AttributeName,
                type: attr?.AttributeType || 'S'
            };
        }
        if (sortKeyAttr && table.AttributeDefinitions) {
            const attr = table.AttributeDefinitions.find((a) => a.AttributeName === sortKeyAttr.AttributeName);
            details.sortKey = {
                name: sortKeyAttr.AttributeName,
                type: attr?.AttributeType || 'S'
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
    details.creationDateTime = table.CreationDateTime;
    // Calculate average item size
    if (details.tableSize && details.itemCount && details.itemCount > 0) {
        details.averageItemSize = Math.round(details.tableSize / details.itemCount);
    }
    // Extract Global Secondary Indexes
    if (table.GlobalSecondaryIndexes) {
        details.globalSecondaryIndexes = table.GlobalSecondaryIndexes.map((gsi) => {
            const keySchema = gsi.KeySchema.map((k) => {
                const attr = table.AttributeDefinitions.find((a) => a.AttributeName === k.AttributeName);
                return {
                    name: k.AttributeName,
                    type: attr?.AttributeType || 'S',
                    keyType: k.KeyType
                };
            });
            return {
                name: gsi.IndexName,
                keys: gsi.KeySchema.map((k) => `${k.AttributeName} (${k.KeyType})`).join(', '),
                keySchema
            };
        });
    }
    // Extract Local Secondary Indexes
    if (table.LocalSecondaryIndexes) {
        details.localSecondaryIndexes = table.LocalSecondaryIndexes.map((lsi) => {
            const keySchema = lsi.KeySchema.map((k) => {
                const attr = table.AttributeDefinitions.find((a) => a.AttributeName === k.AttributeName);
                return {
                    name: k.AttributeName,
                    type: attr?.AttributeType || 'S',
                    keyType: k.KeyType
                };
            });
            return {
                name: lsi.IndexName,
                keys: lsi.KeySchema.map((k) => `${k.AttributeName} (${k.KeyType})`).join(', '),
                keySchema
            };
        });
    }
    return details;
}
async function GetTableTags(region, tableArn) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const dynamodb = await GetDynamoDBClient(region);
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
        return result;
    }
}
async function UpdateDynamoDBTag(region, tableArn, key, value) {
    const result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamoDBClient(region);
        const command = new client_dynamodb_1.TagResourceCommand({
            ResourceArn: tableArn,
            Tags: [
                {
                    Key: key,
                    Value: value
                }
            ]
        });
        await dynamodb.send(command);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.UpdateDynamoDBTag Error !!!", error);
        return result;
    }
}
async function RemoveDynamoDBTag(region, tableArn, key) {
    const result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamoDBClient(region);
        const command = new client_dynamodb_1.UntagResourceCommand({
            ResourceArn: tableArn,
            TagKeys: [key]
        });
        await dynamodb.send(command);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.RemoveDynamoDBTag Error !!!", error);
        return result;
    }
}
async function QueryTable(region, tableName, keyConditionExpression, expressionAttributeValues, indexName, limit, exclusiveStartKey, filterExpression, expressionAttributeNames) {
    let result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamoDBClient(region);
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
        if (exclusiveStartKey) {
            queryParams.ExclusiveStartKey = exclusiveStartKey;
        }
        if (filterExpression) {
            queryParams.FilterExpression = filterExpression;
        }
        if (expressionAttributeNames) {
            queryParams.ExpressionAttributeNames = expressionAttributeNames;
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
async function ScanTable(region, tableName, limit, filterExpression, expressionAttributeValues, exclusiveStartKey, expressionAttributeNames) {
    let result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamoDBClient(region);
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
        if (exclusiveStartKey) {
            scanParams.ExclusiveStartKey = exclusiveStartKey;
        }
        if (expressionAttributeNames) {
            scanParams.ExpressionAttributeNames = expressionAttributeNames;
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
        const dynamodb = await GetDynamoDBClient(region);
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
        const dynamodb = await GetDynamoDBClient(region);
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
async function UpdateItem(region, tableName, key, updateExpression, expressionAttributeValues, expressionAttributeNames) {
    let result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamoDBClient(region);
        const params = {
            TableName: tableName,
            Key: key,
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        };
        if (expressionAttributeNames) {
            params.ExpressionAttributeNames = expressionAttributeNames;
        }
        const command = new client_dynamodb_1.UpdateItemCommand(params);
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
        const dynamodb = await GetDynamoDBClient(region);
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
async function BatchGetItem(region, tableName, keys) {
    let result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamoDBClient(region);
        const command = new client_dynamodb_1.BatchGetItemCommand({
            RequestItems: {
                [tableName]: {
                    Keys: keys
                }
            }
        });
        const response = await dynamodb.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.BatchGetItem Error !!!", error);
        ui.logToOutput("api.BatchGetItem Error !!!", error);
        return result;
    }
}
async function BatchWriteItem(region, tableName, writeRequests) {
    let result = new MethodResult_1.MethodResult();
    try {
        const dynamodb = await GetDynamoDBClient(region);
        const command = new client_dynamodb_1.BatchWriteItemCommand({
            RequestItems: {
                [tableName]: writeRequests
            }
        });
        const response = await dynamodb.send(command);
        result.result = response;
        result.isSuccessful = true;
        const unprocessedCount = response.UnprocessedItems?.[tableName]?.length || 0;
        if (unprocessedCount > 0) {
            ui.showWarningMessage(`Batch write completed with ${unprocessedCount} unprocessed items`);
        }
        else {
            ui.showInfoMessage('Batch write completed successfully!');
        }
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.BatchWriteItem Error !!!", error);
        ui.logToOutput("api.BatchWriteItem Error !!!", error);
        return result;
    }
}
// Helper function to format DynamoDB value for display
function formatDynamoDBValue(value) {
    if (!value) {
        return 'null';
    }
    const type = Object.keys(value)[0];
    const val = value[type];
    switch (type) {
        case 'NULL':
            return 'NULL';
        case 'S':
        case 'N':
            return String(val);
        case 'BOOL':
            return val ? 'true' : 'false';
        case 'B':
            return '[Binary]';
        case 'SS':
        case 'NS':
        case 'BS':
            return JSON.stringify(val);
        case 'M':
        case 'L':
            return JSON.stringify(val);
        default:
            return JSON.stringify(value);
    }
}
// Helper function to convert JS value to DynamoDB format
function toDynamoDBValue(value, type) {
    switch (type) {
        case 'S':
            return { S: String(value) };
        case 'N':
            return { N: String(value) };
        case 'BOOL':
            return { BOOL: value === true || value === 'true' };
        case 'NULL':
            return { NULL: true };
        case 'B':
            return { B: value };
        case 'SS':
            return { SS: Array.isArray(value) ? value : [value] };
        case 'NS':
            return { NS: Array.isArray(value) ? value.map(String) : [String(value)] };
        case 'M':
            return { M: typeof value === 'string' ? JSON.parse(value) : value };
        case 'L':
            return { L: typeof value === 'string' ? JSON.parse(value) : value };
        default:
            return { S: String(value) };
    }
}
//# sourceMappingURL=API.js.map