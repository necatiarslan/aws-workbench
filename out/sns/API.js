"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSCRIPTION_PROTOCOLS = void 0;
exports.GetSNSClient = GetSNSClient;
exports.GetTopicList = GetTopicList;
exports.PublishMessage = PublishMessage;
exports.GetTopicAttributes = GetTopicAttributes;
exports.GetSubscriptions = GetSubscriptions;
exports.Subscribe = Subscribe;
exports.Unsubscribe = Unsubscribe;
exports.GetTopicNameFromArn = GetTopicNameFromArn;
exports.IsSubscriptionPending = IsSubscriptionPending;
exports.GetTopicTags = GetTopicTags;
exports.UpdateSNSTopicTag = UpdateSNSTopicTag;
exports.RemoveSNSTopicTag = RemoveSNSTopicTag;
/* eslint-disable @typescript-eslint/naming-convention */
const client_sns_1 = require("@aws-sdk/client-sns");
const ui = require("../common/UI");
const MethodResult_1 = require("../common/MethodResult");
const Session_1 = require("../common/Session");
async function GetSNSClient(region) {
    const credentials = await Session_1.Session.Current.GetCredentials();
    const sns = new client_sns_1.SNSClient({
        region,
        credentials,
        endpoint: Session_1.Session.Current.AwsEndPoint,
    });
    return sns;
}
async function GetTopicList(region, topicNameFilter) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const sns = await GetSNSClient(region);
        let allTopics = [];
        let nextToken = undefined;
        // Paginate through all topics
        do {
            const command = new client_sns_1.ListTopicsCommand({ NextToken: nextToken });
            const response = await sns.send(command);
            if (response.Topics) {
                allTopics.push(...response.Topics);
            }
            nextToken = response.NextToken;
        } while (nextToken);
        // Filter topics if filter is provided
        let matchingTopics = allTopics;
        if (topicNameFilter && topicNameFilter.length > 0) {
            matchingTopics = allTopics.filter((topic) => topic.TopicArn?.toLowerCase().includes(topicNameFilter.toLowerCase()));
        }
        // Extract topic ARNs
        if (matchingTopics && matchingTopics.length > 0) {
            matchingTopics.forEach((topic) => {
                if (topic.TopicArn) {
                    result.result.push(topic.TopicArn);
                }
            });
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetTopicList Error !!!", error);
        ui.logToOutput("api.GetTopicList Error !!!", error);
        return result;
    }
}
async function PublishMessage(region, topicArn, message, subject) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sns = await GetSNSClient(region);
        const params = {
            TopicArn: topicArn,
            Message: message,
        };
        if (subject) {
            params.Subject = subject;
        }
        const command = new client_sns_1.PublishCommand(params);
        const response = await sns.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.PublishMessage Error !!!", error);
        ui.logToOutput("api.PublishMessage Error !!!", error);
        return result;
    }
}
async function GetTopicAttributes(region, topicArn) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sns = await GetSNSClient(region);
        const command = new client_sns_1.GetTopicAttributesCommand({
            TopicArn: topicArn,
        });
        const response = await sns.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetTopicAttributes Error !!!", error);
        ui.logToOutput("api.GetTopicAttributes Error !!!", error);
        return result;
    }
}
async function GetSubscriptions(region, topicArn) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const sns = await GetSNSClient(region);
        let allSubscriptions = [];
        let nextToken = undefined;
        // Paginate through all subscriptions
        do {
            const command = new client_sns_1.ListSubscriptionsByTopicCommand({
                TopicArn: topicArn,
                NextToken: nextToken
            });
            const response = await sns.send(command);
            if (response.Subscriptions) {
                allSubscriptions.push(...response.Subscriptions);
            }
            nextToken = response.NextToken;
        } while (nextToken);
        result.result = allSubscriptions;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetSubscriptions Error !!!", error);
        ui.logToOutput("api.GetSubscriptions Error !!!", error);
        return result;
    }
}
exports.SUBSCRIPTION_PROTOCOLS = [
    { label: 'Email', value: 'email', description: 'Delivers messages via SMTP' },
    { label: 'Email-JSON', value: 'email-json', description: 'Delivers JSON-formatted messages via SMTP' },
    { label: 'SQS', value: 'sqs', description: 'Delivers messages to an Amazon SQS queue' },
    { label: 'Lambda', value: 'lambda', description: 'Delivers messages to an AWS Lambda function' },
    { label: 'HTTP', value: 'http', description: 'Delivers JSON-formatted messages via HTTP POST' },
    { label: 'HTTPS', value: 'https', description: 'Delivers JSON-formatted messages via HTTPS POST' },
];
async function Subscribe(region, topicArn, protocol, endpoint) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sns = await GetSNSClient(region);
        const command = new client_sns_1.SubscribeCommand({
            TopicArn: topicArn,
            Protocol: protocol,
            Endpoint: endpoint,
        });
        const response = await sns.send(command);
        result.result = response;
        result.isSuccessful = true;
        ui.logToOutput("api.Subscribe Success - SubscriptionArn: " + response.SubscriptionArn);
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.Subscribe Error !!!", error);
        ui.logToOutput("api.Subscribe Error !!!", error);
        return result;
    }
}
async function Unsubscribe(region, subscriptionArn) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sns = await GetSNSClient(region);
        const command = new client_sns_1.UnsubscribeCommand({
            SubscriptionArn: subscriptionArn,
        });
        const response = await sns.send(command);
        result.result = response;
        result.isSuccessful = true;
        ui.logToOutput("api.Unsubscribe Success");
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.Unsubscribe Error !!!", error);
        ui.logToOutput("api.Unsubscribe Error !!!", error);
        return result;
    }
}
function GetTopicNameFromArn(topicArn) {
    // ARN format: arn:aws:sns:region:account-id:topic-name
    const parts = topicArn.split(':');
    return parts.length > 0 ? parts[parts.length - 1] : topicArn;
}
function IsSubscriptionPending(subscriptionArn) {
    return subscriptionArn === 'PendingConfirmation';
}
async function GetTopicTags(region, topicArn) {
    const result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const snsClient = await GetSNSClient(region);
        const command = new client_sns_1.ListTagsForResourceCommand({
            ResourceArn: topicArn
        });
        const response = await snsClient.send(command);
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
        ui.logToOutput("api.GetTopicTags Error !!!", error);
        return result;
    }
}
async function UpdateSNSTopicTag(region, topicArn, key, value) {
    const result = new MethodResult_1.MethodResult();
    try {
        const snsClient = await GetSNSClient(region);
        const command = new client_sns_1.TagResourceCommand({
            ResourceArn: topicArn,
            Tags: [
                {
                    Key: key,
                    Value: value
                }
            ]
        });
        await snsClient.send(command);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.UpdateSNSTopicTag Error !!!", error);
        return result;
    }
}
async function RemoveSNSTopicTag(region, topicArn, key) {
    const result = new MethodResult_1.MethodResult();
    try {
        const snsClient = await GetSNSClient(region);
        const command = new client_sns_1.UntagResourceCommand({
            ResourceArn: topicArn,
            TagKeys: [key]
        });
        await snsClient.send(command);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.RemoveSNSTopicTag Error !!!", error);
        return result;
    }
}
//# sourceMappingURL=API.js.map