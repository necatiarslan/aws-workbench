"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSQSClient = GetSQSClient;
exports.GetQueueNameFromUrl = GetQueueNameFromUrl;
exports.IsFifoQueue = IsFifoQueue;
exports.GetQueueList = GetQueueList;
exports.GetQueueAttributes = GetQueueAttributes;
exports.SendMessage = SendMessage;
exports.ReceiveMessages = ReceiveMessages;
exports.DeleteMessage = DeleteMessage;
exports.PurgeQueue = PurgeQueue;
exports.GetMessageCount = GetMessageCount;
exports.GetQueuePolicy = GetQueuePolicy;
const client_sqs_1 = require("@aws-sdk/client-sqs");
const MethodResult_1 = require("../common/MethodResult");
const Session_1 = require("../common/Session");
const ui = require("../common/UI");
async function GetSQSClient(region) {
    const credentials = await Session_1.Session.Current.GetCredentials();
    const sqsClient = new client_sqs_1.SQSClient({
        region,
        credentials,
        endpoint: Session_1.Session.Current.AwsEndPoint,
    });
    return sqsClient;
}
function GetQueueNameFromUrl(queueUrl) {
    return queueUrl.split('/').pop() || queueUrl;
}
function IsFifoQueue(queueUrl) {
    return queueUrl.endsWith('.fifo');
}
async function GetQueueList(region, queueNamePrefix) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const sqs = await GetSQSClient(region);
        let allQueues = [];
        let nextToken = undefined;
        do {
            const listCommand = new client_sqs_1.ListQueuesCommand({
                NextToken: nextToken,
                QueueNamePrefix: queueNamePrefix
            });
            const listResponse = await sqs.send(listCommand);
            if (listResponse.QueueUrls) {
                allQueues.push(...listResponse.QueueUrls);
            }
            nextToken = listResponse.NextToken;
        } while (nextToken);
        result.result = allQueues;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetQueueList Error !!!", error);
        ui.logToOutput("api.GetQueueList Error !!!", error);
        return result;
    }
}
async function GetQueueAttributes(region, queueUrl) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sqs = await GetSQSClient(region);
        const command = new client_sqs_1.GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: [client_sqs_1.QueueAttributeName.All]
        });
        const response = await sqs.send(command);
        const attrs = response.Attributes || {};
        // Parse RedrivePolicy to extract DLQ ARN
        let dlqArn;
        if (attrs.RedrivePolicy) {
            try {
                const redrivePolicy = JSON.parse(attrs.RedrivePolicy);
                dlqArn = redrivePolicy.deadLetterTargetArn;
            }
            catch {
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
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetQueueAttributes Error !!!", error);
        ui.logToOutput("api.GetQueueAttributes Error !!!", error);
        return result;
    }
}
async function SendMessage(region, queueUrl, messageBody, messageGroupId, messageDeduplicationId) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sqs = await GetSQSClient(region);
        const command = new client_sqs_1.SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: messageBody,
            MessageGroupId: messageGroupId,
            MessageDeduplicationId: messageDeduplicationId
        });
        const response = await sqs.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.SendMessage Error !!!", error);
        ui.logToOutput("api.SendMessage Error !!!", error);
        return result;
    }
}
async function ReceiveMessages(region, queueUrl, maxNumberOfMessages = 10, waitTimeSeconds = 0) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const sqs = await GetSQSClient(region);
        const command = new client_sqs_1.ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: Math.min(maxNumberOfMessages, 10), // SQS max is 10
            WaitTimeSeconds: waitTimeSeconds,
            MessageAttributeNames: ["All"],
            AttributeNames: [client_sqs_1.QueueAttributeName.All]
        });
        const response = await sqs.send(command);
        result.result = response.Messages || [];
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.ReceiveMessages Error !!!", error);
        ui.logToOutput("api.ReceiveMessages Error !!!", error);
        return result;
    }
}
async function DeleteMessage(region, queueUrl, receiptHandle) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sqs = await GetSQSClient(region);
        const command = new client_sqs_1.DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: receiptHandle
        });
        const response = await sqs.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.DeleteMessage Error !!!", error);
        ui.logToOutput("api.DeleteMessage Error !!!", error);
        return result;
    }
}
async function PurgeQueue(region, queueUrl) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sqs = await GetSQSClient(region);
        const command = new client_sqs_1.PurgeQueueCommand({
            QueueUrl: queueUrl
        });
        const response = await sqs.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.PurgeQueue Error !!!", error);
        ui.logToOutput("api.PurgeQueue Error !!!", error);
        return result;
    }
}
async function GetMessageCount(region, queueUrl) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sqs = await GetSQSClient(region);
        const command = new client_sqs_1.GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: [client_sqs_1.QueueAttributeName.ApproximateNumberOfMessages]
        });
        const response = await sqs.send(command);
        const count = response.Attributes?.ApproximateNumberOfMessages
            ? parseInt(response.Attributes.ApproximateNumberOfMessages, 10)
            : 0;
        result.result = count;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetMessageCount Error !!!", error);
        ui.logToOutput("api.GetMessageCount Error !!!", error);
        return result;
    }
}
async function GetQueuePolicy(region, queueUrl) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sqs = await GetSQSClient(region);
        const command = new client_sqs_1.GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: [client_sqs_1.QueueAttributeName.Policy]
        });
        const response = await sqs.send(command);
        result.result = response.Attributes?.Policy;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetQueuePolicy Error !!!", error);
        ui.logToOutput("api.GetQueuePolicy Error !!!", error);
        return result;
    }
}
//# sourceMappingURL=API.js.map