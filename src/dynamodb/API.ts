/* eslint-disable @typescript-eslint/naming-convention */
import { 
    DynamoDBClient, 
    ListTablesCommand, 
    DescribeTableCommand, 
    QueryCommand,
    ScanCommand,
    PutItemCommand,
    UpdateItemCommand,
    DeleteItemCommand,
    GetItemCommand,
    BatchGetItemCommand,
    BatchWriteItemCommand,
    ListTagsOfResourceCommand,
    TagResourceCommand,
    UntagResourceCommand
} from "@aws-sdk/client-dynamodb";
import * as ui from "../common/UI";
import { MethodResult } from '../common/MethodResult';
import { Session } from '../common/Session';

export async function GetDynamoDBClient(region: string) {
    const credentials = await Session.Current.GetCredentials();
    
    const dynamodbClient = new DynamoDBClient({
        region,
        credentials,
        endpoint: Session.Current.AwsEndPoint,
    });
    
    return dynamodbClient;
}

export async function GetDynamoDBTableList(
    region: string,
    tableNameFilter?: string
): Promise<MethodResult<string[]>> {
    let result: MethodResult<string[]> = new MethodResult<string[]>();
    result.result = [];

    try {
        const dynamodb = await GetDynamoDBClient(region);
        
        let allTables: string[] = [];
        let exclusiveStartTableName: string | undefined = undefined;
        
        do {
            const command: ListTablesCommand = new ListTablesCommand({ 
                ExclusiveStartTableName: exclusiveStartTableName 
            });
            const tablesList = await dynamodb.send(command);
            
            if (tablesList.TableNames) {
                allTables.push(...tablesList.TableNames);
            }
            
            exclusiveStartTableName = tablesList.LastEvaluatedTableName;
        } while (exclusiveStartTableName);

        if (tableNameFilter) {
            result.result = allTables.filter(
                (tableName) => tableName.toLowerCase().includes(tableNameFilter.toLowerCase())
            );
        } else {
            result.result = allTables;
        }

        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetDynamoDBTableList Error !!!", error);
        ui.logToOutput("api.GetDynamoDBTableList Error !!!", error);
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
    globalSecondaryIndexes?: Array<{ name: string; keys: string; keySchema: Array<{ name: string; type: string; keyType: string }> }>;
    localSecondaryIndexes?: Array<{ name: string; keys: string; keySchema: Array<{ name: string; type: string; keyType: string }> }>;
    tableArn?: string;
    tags?: Array<{ key: string; value: string }>;
    averageItemSize?: number;
    creationDateTime?: Date;
    attributeDefinitions?: Array<{ name: string; type: string }>;
}

export async function DescribeTable(
    region: string,
    tableName: string
): Promise<MethodResult<any>> {
    let result: MethodResult<any> = new MethodResult<any>();

    try {
        const dynamodb = await GetDynamoDBClient(region);

        const command = new DescribeTableCommand({
            TableName: tableName,
        });

        const response = await dynamodb.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.DescribeTable Error !!!", error);
        ui.logToOutput("api.DescribeTable Error !!!", error);
        return result;
    }
}

export function ExtractTableDetails(describeTableResponse: any): TableDetails {
    const table = describeTableResponse.Table;
    if (!table) {
        return {};
    }

    const details: TableDetails = {};

    // Store attribute definitions for later use
    if (table.AttributeDefinitions) {
        details.attributeDefinitions = table.AttributeDefinitions.map((a: any) => ({
            name: a.AttributeName,
            type: a.AttributeType
        }));
    }

    // Extract partition and sort keys
    if (table.KeySchema) {
        const partitionKeyAttr = table.KeySchema.find((k: any) => k.KeyType === 'HASH');
        const sortKeyAttr = table.KeySchema.find((k: any) => k.KeyType === 'RANGE');
        
        if (partitionKeyAttr && table.AttributeDefinitions) {
            const attr = table.AttributeDefinitions.find((a: any) => a.AttributeName === partitionKeyAttr.AttributeName);
            details.partitionKey = {
                name: partitionKeyAttr.AttributeName,
                type: attr?.AttributeType || 'S'
            };
        }
        
        if (sortKeyAttr && table.AttributeDefinitions) {
            const attr = table.AttributeDefinitions.find((a: any) => a.AttributeName === sortKeyAttr.AttributeName);
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
        details.globalSecondaryIndexes = table.GlobalSecondaryIndexes.map((gsi: any) => {
            const keySchema = gsi.KeySchema.map((k: any) => {
                const attr = table.AttributeDefinitions.find((a: any) => a.AttributeName === k.AttributeName);
                return {
                    name: k.AttributeName,
                    type: attr?.AttributeType || 'S',
                    keyType: k.KeyType
                };
            });
            return {
                name: gsi.IndexName,
                keys: gsi.KeySchema.map((k: any) => `${k.AttributeName} (${k.KeyType})`).join(', '),
                keySchema
            };
        });
    }

    // Extract Local Secondary Indexes
    if (table.LocalSecondaryIndexes) {
        details.localSecondaryIndexes = table.LocalSecondaryIndexes.map((lsi: any) => {
            const keySchema = lsi.KeySchema.map((k: any) => {
                const attr = table.AttributeDefinitions.find((a: any) => a.AttributeName === k.AttributeName);
                return {
                    name: k.AttributeName,
                    type: attr?.AttributeType || 'S',
                    keyType: k.KeyType
                };
            });
            return {
                name: lsi.IndexName,
                keys: lsi.KeySchema.map((k: any) => `${k.AttributeName} (${k.KeyType})`).join(', '),
                keySchema
            };
        });
    }

    return details;
}

export async function GetTableTags(
    region: string,
    tableArn: string
): Promise<MethodResult<Array<{ key: string; value: string }>>> {
    let result: MethodResult<Array<{ key: string; value: string }>> = new MethodResult<Array<{ key: string; value: string }>>();
    result.result = [];

    try {
        const dynamodb = await GetDynamoDBClient(region);

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
        return result;
    }
}

export async function UpdateDynamoDBTag(
    region: string,
    tableArn: string,
    key: string,
    value: string
): Promise<MethodResult<void>> {
    const result: MethodResult<void> = new MethodResult<void>();

    try {
        const dynamodb = await GetDynamoDBClient(region);

        const command = new TagResourceCommand({
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
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.UpdateDynamoDBTag Error !!!", error);
        return result;
    }
}

export async function RemoveDynamoDBTag(
    region: string,
    tableArn: string,
    key: string
): Promise<MethodResult<void>> {
    const result: MethodResult<void> = new MethodResult<void>();

    try {
        const dynamodb = await GetDynamoDBClient(region);

        const command = new UntagResourceCommand({
            ResourceArn: tableArn,
            TagKeys: [key]
        });

        await dynamodb.send(command);
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.RemoveDynamoDBTag Error !!!", error);
        return result;
    }
}

export async function QueryTable(
    region: string,
    tableName: string,
    keyConditionExpression: string,
    expressionAttributeValues: any,
    indexName?: string,
    limit?: number,
    exclusiveStartKey?: any,
    filterExpression?: string,
    expressionAttributeNames?: any
): Promise<MethodResult<any>> {
    let result: MethodResult<any> = new MethodResult<any>();

    try {
        const dynamodb = await GetDynamoDBClient(region);

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

        if (exclusiveStartKey) {
            queryParams.ExclusiveStartKey = exclusiveStartKey;
        }

        if (filterExpression) {
            queryParams.FilterExpression = filterExpression;
        }

        if (expressionAttributeNames) {
            queryParams.ExpressionAttributeNames = expressionAttributeNames;
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
    expressionAttributeValues?: any,
    exclusiveStartKey?: any,
    expressionAttributeNames?: any
): Promise<MethodResult<any>> {
    let result: MethodResult<any> = new MethodResult<any>();

    try {
        const dynamodb = await GetDynamoDBClient(region);

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

        if (exclusiveStartKey) {
            scanParams.ExclusiveStartKey = exclusiveStartKey;
        }

        if (expressionAttributeNames) {
            scanParams.ExpressionAttributeNames = expressionAttributeNames;
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
        const dynamodb = await GetDynamoDBClient(region);

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
        const dynamodb = await GetDynamoDBClient(region);

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
    expressionAttributeValues: any,
    expressionAttributeNames?: any
): Promise<MethodResult<any>> {
    let result: MethodResult<any> = new MethodResult<any>();

    try {
        const dynamodb = await GetDynamoDBClient(region);

        const params: any = {
            TableName: tableName,
            Key: key,
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        };

        if (expressionAttributeNames) {
            params.ExpressionAttributeNames = expressionAttributeNames;
        }

        const command = new UpdateItemCommand(params);
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
        const dynamodb = await GetDynamoDBClient(region);

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

export async function BatchGetItem(
    region: string,
    tableName: string,
    keys: any[]
): Promise<MethodResult<any>> {
    let result: MethodResult<any> = new MethodResult<any>();

    try {
        const dynamodb = await GetDynamoDBClient(region);

        const command = new BatchGetItemCommand({
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
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.BatchGetItem Error !!!", error);
        ui.logToOutput("api.BatchGetItem Error !!!", error);
        return result;
    }
}

export async function BatchWriteItem(
    region: string,
    tableName: string,
    writeRequests: any[]
): Promise<MethodResult<any>> {
    let result: MethodResult<any> = new MethodResult<any>();

    try {
        const dynamodb = await GetDynamoDBClient(region);

        const command = new BatchWriteItemCommand({
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
        } else {
            ui.showInfoMessage('Batch write completed successfully!');
        }
        
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.BatchWriteItem Error !!!", error);
        ui.logToOutput("api.BatchWriteItem Error !!!", error);
        return result;
    }
}

// Helper function to format DynamoDB value for display
export function formatDynamoDBValue(value: any): string {
    if (!value) { return 'null'; }
    
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
export function toDynamoDBValue(value: any, type: string): any {
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
