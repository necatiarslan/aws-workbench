import { 
    SQSClient, 
    ListQueuesCommand, 
    ListQueuesCommandOutput,
    GetQueueAttributesCommand,
    SendMessageCommand,
    ReceiveMessageCommand,
    DeleteMessageCommand,
    PurgeQueueCommand,
    SendMessageCommandOutput,
    ReceiveMessageCommandOutput,
    DeleteMessageCommandOutput,
    PurgeQueueCommandOutput,
    ListQueueTagsCommand,
    TagQueueCommand,
    UntagQueueCommand,
    Message,
    QueueAttributeName
} from "@aws-sdk/client-sqs";
import { MethodResult } from '../common/MethodResult';
import { Session } from '../common/Session';
import * as ui from "../common/UI";

export async function GetSQSClient(region: string): Promise<SQSClient> {
    const credentials = await Session.Current.GetCredentials();
    
    const sqsClient = new SQSClient({
        region,
        credentials,
        endpoint: Session.Current.AwsEndPoint,
    });
    
    return sqsClient;
}

export function GetQueueNameFromUrl(queueUrl: string): string {
    return queueUrl.split('/').pop() || queueUrl;
}

export function IsFifoQueue(queueUrl: string): boolean {
    return queueUrl.endsWith('.fifo');
}

export async function GetQueueList(
    region: string,
    queueNamePrefix?: string
): Promise<MethodResult<string[]>> {
    let result: MethodResult<string[]> = new MethodResult<string[]>();
    result.result = [];

    try {
        const sqs = await GetSQSClient(region);
        
        let allQueues: string[] = [];
        let nextToken: string | undefined = undefined;
        
        do {
            const listCommand: ListQueuesCommand = new ListQueuesCommand({ 
                NextToken: nextToken,
                QueueNamePrefix: queueNamePrefix 
            });
            const listResponse: ListQueuesCommandOutput = await sqs.send(listCommand);

            if (listResponse.QueueUrls) {
                allQueues.push(...listResponse.QueueUrls);
            }
            
            nextToken = listResponse.NextToken;
        } while (nextToken);

        result.result = allQueues;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetQueueList Error !!!", error);
        ui.logToOutput("api.GetQueueList Error !!!", error);
        return result;
    }
}

export interface QueueAttributes {
    QueueArn?: string;
    QueueUrl: string;
    QueueName: string;
    IsFifo: boolean;
    ApproximateNumberOfMessages?: number;
    ApproximateNumberOfMessagesNotVisible?: number;
    ApproximateNumberOfMessagesDelayed?: number;
    CreatedTimestamp?: string;
    LastModifiedTimestamp?: string;
    VisibilityTimeout?: string;
    MaximumMessageSize?: string;
    MessageRetentionPeriod?: string;
    DelaySeconds?: string;
    RedrivePolicy?: string;
    DlqQueueArn?: string;
    ContentBasedDeduplication?: string;
    Policy?: string;
}

export async function GetQueueAttributes(
    region: string,
    queueUrl: string
): Promise<MethodResult<QueueAttributes>> {
    let result: MethodResult<QueueAttributes> = new MethodResult<QueueAttributes>();

    try {
        const sqs = await GetSQSClient(region);
        
        const command = new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: [QueueAttributeName.All]
        });
        
        const response = await sqs.send(command);
        const attrs = response.Attributes || {};
        
        // Parse RedrivePolicy to extract DLQ ARN
        let dlqArn: string | undefined;
        if (attrs.RedrivePolicy) {
            try {
                const redrivePolicy = JSON.parse(attrs.RedrivePolicy);
                dlqArn = redrivePolicy.deadLetterTargetArn;
            } catch {
                // Invalid JSON in RedrivePolicy
            }
        }

        result.result = {
            QueueUrl: queueUrl,
            QueueName: GetQueueNameFromUrl(queueUrl),
            QueueArn: attrs.QueueArn,
            IsFifo: attrs.FifoQueue === "true",
            ApproximateNumberOfMessages: attrs.ApproximateNumberOfMessages ? parseInt(attrs.ApproximateNumberOfMessages, 10) : undefined,
            ApproximateNumberOfMessagesNotVisible: attrs.ApproximateNumberOfMessagesNotVisible ? parseInt(attrs.ApproximateNumberOfMessagesNotVisible, 10) : undefined,
            ApproximateNumberOfMessagesDelayed: attrs.ApproximateNumberOfMessagesDelayed ? parseInt(attrs.ApproximateNumberOfMessagesDelayed, 10) : undefined,
            CreatedTimestamp: attrs.CreatedTimestamp,
            LastModifiedTimestamp: attrs.LastModifiedTimestamp,
            VisibilityTimeout: attrs.VisibilityTimeout,
            MaximumMessageSize: attrs.MaximumMessageSize,
            MessageRetentionPeriod: attrs.MessageRetentionPeriod,
            DelaySeconds: attrs.DelaySeconds,
            RedrivePolicy: attrs.RedrivePolicy,
            DlqQueueArn: dlqArn,
            ContentBasedDeduplication: attrs.ContentBasedDeduplication,
            Policy: attrs.Policy
        };
        
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetQueueAttributes Error !!!", error);
        ui.logToOutput("api.GetQueueAttributes Error !!!", error);
        return result;
    }
}

export async function SendMessage(
    region: string,
    queueUrl: string,
    messageBody: string,
    messageGroupId?: string,
    messageDeduplicationId?: string
): Promise<MethodResult<SendMessageCommandOutput>> {
    let result: MethodResult<SendMessageCommandOutput> = new MethodResult<SendMessageCommandOutput>();

    try {
        const sqs = await GetSQSClient(region);

        const command = new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: messageBody,
            MessageGroupId: messageGroupId,
            MessageDeduplicationId: messageDeduplicationId
        });

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

export async function ReceiveMessages(
    region: string,
    queueUrl: string,
    maxNumberOfMessages: number = 10,
    waitTimeSeconds: number = 0
): Promise<MethodResult<Message[]>> {
    let result: MethodResult<Message[]> = new MethodResult<Message[]>();
    result.result = [];

    try {
        const sqs = await GetSQSClient(region);

        const command = new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: Math.min(maxNumberOfMessages, 10), // SQS max is 10
            WaitTimeSeconds: waitTimeSeconds,
            MessageAttributeNames: ["All"],
            AttributeNames: [QueueAttributeName.All]
        });

        const response = await sqs.send(command);
        result.result = response.Messages || [];
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.ReceiveMessages Error !!!", error);
        ui.logToOutput("api.ReceiveMessages Error !!!", error);
        return result;
    }
}

export async function DeleteMessage(
    region: string,
    queueUrl: string,
    receiptHandle: string
): Promise<MethodResult<DeleteMessageCommandOutput>> {
    let result: MethodResult<DeleteMessageCommandOutput> = new MethodResult<DeleteMessageCommandOutput>();

    try {
        const sqs = await GetSQSClient(region);

        const command = new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: receiptHandle
        });

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

export async function PurgeQueue(
    region: string,
    queueUrl: string
): Promise<MethodResult<PurgeQueueCommandOutput>> {
    let result: MethodResult<PurgeQueueCommandOutput> = new MethodResult<PurgeQueueCommandOutput>();

    try {
        const sqs = await GetSQSClient(region);

        const command = new PurgeQueueCommand({
            QueueUrl: queueUrl
        });

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

export async function GetMessageCount(
    region: string,
    queueUrl: string
): Promise<MethodResult<number>> {
    let result: MethodResult<number> = new MethodResult<number>();

    try {
        const sqs = await GetSQSClient(region);

        const command = new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: [QueueAttributeName.ApproximateNumberOfMessages]
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

export async function GetQueuePolicy(
    region: string,
    queueUrl: string
): Promise<MethodResult<string | undefined>> {
    let result: MethodResult<string | undefined> = new MethodResult<string | undefined>();

    try {
        const sqs = await GetSQSClient(region);

        const command = new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: [QueueAttributeName.Policy]
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

export async function GetQueueTags(
    region: string,
    queueUrl: string
): Promise<MethodResult<Array<{ key: string; value: string }>>> {
    const result: MethodResult<Array<{ key: string; value: string }>> = new MethodResult<Array<{ key: string; value: string }>>();
    result.result = [];

    try {
        const sqsClient = await GetSQSClient(region);
        const command = new ListQueueTagsCommand({
            QueueUrl: queueUrl
        });

        const response = await sqsClient.send(command);
        
        if (response.Tags) {
            result.result = Object.entries(response.Tags).map(([key, value]) => ({
                key,
                value: value || ''
            }));
        }

        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.GetQueueTags Error !!!", error);
        return result;
    }
}

export async function UpdateSQSQueueTag(
    region: string,
    queueUrl: string,
    key: string,
    value: string
): Promise<MethodResult<void>> {
    const result: MethodResult<void> = new MethodResult<void>();

    try {
        const sqsClient = await GetSQSClient(region);
        const command = new TagQueueCommand({
            QueueUrl: queueUrl,
            Tags: {
                [key]: value
            }
        });

        await sqsClient.send(command);
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.UpdateSQSQueueTag Error !!!", error);
        return result;
    }
}

export async function RemoveSQSQueueTag(
    region: string,
    queueUrl: string,
    key: string
): Promise<MethodResult<void>> {
    const result: MethodResult<void> = new MethodResult<void>();

    try {
        const sqsClient = await GetSQSClient(region);
        const command = new UntagQueueCommand({
            QueueUrl: queueUrl,
            TagKeys: [key]
        });

        await sqsClient.send(command);
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.RemoveSQSQueueTag Error !!!", error);
        return result;
    }
}
