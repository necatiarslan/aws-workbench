/* eslint-disable @typescript-eslint/naming-convention */
import { 
    SNSClient, 
    ListTopicsCommand, 
    PublishCommand, 
    PublishCommandInput, 
    PublishCommandOutput,
    GetTopicAttributesCommand,
    GetTopicAttributesCommandOutput,
    ListSubscriptionsByTopicCommand,
    ListSubscriptionsByTopicCommandOutput,
    SubscribeCommand,
    SubscribeCommandOutput,
    UnsubscribeCommand,
    UnsubscribeCommandOutput,
    ListTagsForResourceCommand,
    TagResourceCommand,
    UntagResourceCommand,
    Subscription
} from "@aws-sdk/client-sns";
import * as ui from "../common/UI";
import { MethodResult } from '../common/MethodResult';
import { Session } from '../common/Session';

export async function GetSNSClient(region: string): Promise<SNSClient> {
    const credentials = await Session.Current.GetCredentials();
    
    const sns = new SNSClient({
        region,
        credentials,
        endpoint: Session.Current.AwsEndPoint,
    });
    
    return sns;
}

export async function GetTopicList(
    region: string,
    topicNameFilter?: string
): Promise<MethodResult<string[]>> {
    let result: MethodResult<string[]> = new MethodResult<string[]>();
    result.result = [];

    try {
        const sns = await GetSNSClient(region);
        
        let allTopics: { TopicArn?: string }[] = [];
        let nextToken: string | undefined = undefined;
        
        // Paginate through all topics
        do {
            const command: ListTopicsCommand = new ListTopicsCommand({ NextToken: nextToken });
            const response = await sns.send(command);
            
            if (response.Topics) {
                allTopics.push(...response.Topics);
            }
            
            nextToken = response.NextToken;
        } while (nextToken);

        // Filter topics if filter is provided
        let matchingTopics = allTopics;
        if (topicNameFilter && topicNameFilter.length > 0) {
            matchingTopics = allTopics.filter(
                (topic) => topic.TopicArn?.toLowerCase().includes(topicNameFilter.toLowerCase())
            );
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
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetTopicList Error !!!", error);
        ui.logToOutput("api.GetTopicList Error !!!", error);
        return result;
    }
}

export async function PublishMessage(
    region: string,
    topicArn: string,
    message: string,
    subject?: string
): Promise<MethodResult<PublishCommandOutput>> {
    let result: MethodResult<PublishCommandOutput> = new MethodResult<PublishCommandOutput>();

    try {
        const sns = await GetSNSClient(region);

        const params: PublishCommandInput = {
            TopicArn: topicArn,
            Message: message,
        };

        if (subject) {
            params.Subject = subject;
        }

        const command = new PublishCommand(params);
        const response = await sns.send(command);

        result.result = response;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.PublishMessage Error !!!", error);
        ui.logToOutput("api.PublishMessage Error !!!", error);
        return result;
    }
}

export async function GetTopicAttributes(
    region: string,
    topicArn: string
): Promise<MethodResult<GetTopicAttributesCommandOutput>> {
    let result: MethodResult<GetTopicAttributesCommandOutput> = new MethodResult<GetTopicAttributesCommandOutput>();

    try {
        const sns = await GetSNSClient(region);

        const command = new GetTopicAttributesCommand({
            TopicArn: topicArn,
        });

        const response = await sns.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetTopicAttributes Error !!!", error);
        ui.logToOutput("api.GetTopicAttributes Error !!!", error);
        return result;
    }
}

export async function GetSubscriptions(
    region: string,
    topicArn: string
): Promise<MethodResult<Subscription[]>> {
    let result: MethodResult<Subscription[]> = new MethodResult<Subscription[]>();
    result.result = [];

    try {
        const sns = await GetSNSClient(region);
        
        let allSubscriptions: Subscription[] = [];
        let nextToken: string | undefined = undefined;

        // Paginate through all subscriptions
        do {
            const command: ListSubscriptionsByTopicCommand = new ListSubscriptionsByTopicCommand({ 
                TopicArn: topicArn,
                NextToken: nextToken 
            });
            const response: ListSubscriptionsByTopicCommandOutput = await sns.send(command);

            if (response.Subscriptions) {
                allSubscriptions.push(...response.Subscriptions);
            }

            nextToken = response.NextToken;
        } while (nextToken);

        result.result = allSubscriptions;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetSubscriptions Error !!!", error);
        ui.logToOutput("api.GetSubscriptions Error !!!", error);
        return result;
    }
}

export type SubscriptionProtocol = 'email' | 'email-json' | 'sqs' | 'lambda' | 'http' | 'https';

export const SUBSCRIPTION_PROTOCOLS: { label: string; value: SubscriptionProtocol; description: string }[] = [
    { label: 'Email', value: 'email', description: 'Delivers messages via SMTP' },
    { label: 'Email-JSON', value: 'email-json', description: 'Delivers JSON-formatted messages via SMTP' },
    { label: 'SQS', value: 'sqs', description: 'Delivers messages to an Amazon SQS queue' },
    { label: 'Lambda', value: 'lambda', description: 'Delivers messages to an AWS Lambda function' },
    { label: 'HTTP', value: 'http', description: 'Delivers JSON-formatted messages via HTTP POST' },
    { label: 'HTTPS', value: 'https', description: 'Delivers JSON-formatted messages via HTTPS POST' },
];

export async function Subscribe(
    region: string,
    topicArn: string,
    protocol: SubscriptionProtocol,
    endpoint: string
): Promise<MethodResult<SubscribeCommandOutput>> {
    let result: MethodResult<SubscribeCommandOutput> = new MethodResult<SubscribeCommandOutput>();

    try {
        const sns = await GetSNSClient(region);

        const command = new SubscribeCommand({
            TopicArn: topicArn,
            Protocol: protocol,
            Endpoint: endpoint,
        });

        const response = await sns.send(command);

        result.result = response;
        result.isSuccessful = true;
        ui.logToOutput("api.Subscribe Success - SubscriptionArn: " + response.SubscriptionArn);
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.Subscribe Error !!!", error);
        ui.logToOutput("api.Subscribe Error !!!", error);
        return result;
    }
}

export async function Unsubscribe(
    region: string,
    subscriptionArn: string
): Promise<MethodResult<UnsubscribeCommandOutput>> {
    let result: MethodResult<UnsubscribeCommandOutput> = new MethodResult<UnsubscribeCommandOutput>();

    try {
        const sns = await GetSNSClient(region);

        const command = new UnsubscribeCommand({
            SubscriptionArn: subscriptionArn,
        });

        const response = await sns.send(command);

        result.result = response;
        result.isSuccessful = true;
        ui.logToOutput("api.Unsubscribe Success");
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.Unsubscribe Error !!!", error);
        ui.logToOutput("api.Unsubscribe Error !!!", error);
        return result;
    }
}

export function GetTopicNameFromArn(topicArn: string): string {
    // ARN format: arn:aws:sns:region:account-id:topic-name
    const parts = topicArn.split(':');
    return parts.length > 0 ? parts[parts.length - 1] : topicArn;
}

export function IsSubscriptionPending(subscriptionArn: string | undefined): boolean {
    return subscriptionArn === 'PendingConfirmation';
}

export async function GetTopicTags(
    region: string,
    topicArn: string
): Promise<MethodResult<Array<{ key: string; value: string }>>> {
    const result: MethodResult<Array<{ key: string; value: string }>> = new MethodResult<Array<{ key: string; value: string }>>();
    result.result = [];

    try {
        const snsClient = await GetSNSClient(region);
        const command = new ListTagsForResourceCommand({
            ResourceArn: topicArn
        });

        const response = await snsClient.send(command);
        
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
        ui.logToOutput("api.GetTopicTags Error !!!", error);
        return result;
    }
}

export async function UpdateSNSTopicTag(
    region: string,
    topicArn: string,
    key: string,
    value: string
): Promise<MethodResult<void>> {
    const result: MethodResult<void> = new MethodResult<void>();

    try {
        const snsClient = await GetSNSClient(region);
        const command = new TagResourceCommand({
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
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.UpdateSNSTopicTag Error !!!", error);
        return result;
    }
}

export async function RemoveSNSTopicTag(
    region: string,
    topicArn: string,
    key: string
): Promise<MethodResult<void>> {
    const result: MethodResult<void> = new MethodResult<void>();

    try {
        const snsClient = await GetSNSClient(region);
        const command = new UntagResourceCommand({
            ResourceArn: topicArn,
            TagKeys: [key]
        });

        await snsClient.send(command);
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.RemoveSNSTopicTag Error !!!", error);
        return result;
    }
}
