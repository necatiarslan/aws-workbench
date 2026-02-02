import { 
    SFNClient, 
    ListStateMachinesCommand, 
    DescribeStateMachineCommand,
    UpdateStateMachineCommand,
    StartExecutionCommand,
    ListExecutionsCommand,
    DescribeExecutionCommand,
    GetExecutionHistoryCommand,
    ListTagsForResourceCommand,
    TagResourceCommand,
    UntagResourceCommand,
    StateMachineListItem,
    ExecutionListItem,
    DescribeStateMachineOutput,
    DescribeExecutionCommandOutput,
    GetExecutionHistoryOutput
} from "@aws-sdk/client-sfn";
import { DescribeLogStreamsCommand } from "@aws-sdk/client-cloudwatch-logs";
import * as ui from "../common/UI";
import { MethodResult } from '../common/MethodResult';
import { Session } from '../common/Session';
import { GetCloudWatchLogsClient } from "../cloudwatch-logs/API";

export async function GetSFNClient(region: string) {
    const credentials = await Session.Current.GetCredentials();
    
    const sfnClient = new SFNClient({
        region,
        credentials,
        endpoint: Session.Current.AwsEndPoint,
    });
    
    return sfnClient;
}

export async function GetStateMachineList(
    region: string,
    stateMachineName?: string
): Promise<MethodResult<StateMachineListItem[]>> {
    let result: MethodResult<StateMachineListItem[]> = new MethodResult<StateMachineListItem[]>();
    result.result = [];

    try {
        const sfn = await GetSFNClient(region);
        
        let allStateMachines: StateMachineListItem[] = [];
        let nextToken: string | undefined = undefined;
        
        do {
            const command: ListStateMachinesCommand = new ListStateMachinesCommand({ nextToken });
            const response = await sfn.send(command);
            
            if (response.stateMachines) {
                allStateMachines.push(...response.stateMachines);
            }
            
            nextToken = response.nextToken;
        } while (nextToken);

        // Filter state machines if a name filter is provided
        let matchingStateMachines: StateMachineListItem[] = [];
        if (stateMachineName) {
            matchingStateMachines = allStateMachines.filter(
                (sm) => sm.name?.includes(stateMachineName) || stateMachineName.length === 0
            );
        } else {
            matchingStateMachines = allStateMachines;
        }

        result.result = matchingStateMachines;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetStateMachineList Error !!!", error);
        ui.logToOutput("api.GetStateMachineList Error !!!", error);
        return result;
    }
}

export async function GetStateMachineDefinition(
    region: string,
    stateMachineArn: string
): Promise<MethodResult<DescribeStateMachineOutput>> {
    let result: MethodResult<DescribeStateMachineOutput> = new MethodResult<DescribeStateMachineOutput>();

    try {
        const sfn = await GetSFNClient(region);
        const command = new DescribeStateMachineCommand({ stateMachineArn });
        const response = await sfn.send(command);

        result.result = response;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetStateMachineDefinition Error !!!", error);
        ui.logToOutput("api.GetStateMachineDefinition Error !!!", error);
        return result;
    }
}

export async function UpdateStateMachineDefinition(
    region: string,
    stateMachineArn: string,
    definition: string
): Promise<MethodResult<boolean>> {
    let result: MethodResult<boolean> = new MethodResult<boolean>();

    try {
        const sfn = await GetSFNClient(region);
        const command = new UpdateStateMachineCommand({ 
            stateMachineArn,
            definition 
        });
        await sfn.send(command);

        result.result = true;
        result.isSuccessful = true;
        ui.logToOutput("api.UpdateStateMachineDefinition Success");
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.UpdateStateMachineDefinition Error !!!", error);
        ui.logToOutput("api.UpdateStateMachineDefinition Error !!!", error);
        return result;
    }
}

export async function StartExecution(
    region: string,
    stateMachineArn: string,
    input: string,
    name?: string
): Promise<MethodResult<string>> {
    let result: MethodResult<string> = new MethodResult<string>();

    try {
        const sfn = await GetSFNClient(region);
        const command = new StartExecutionCommand({ 
            stateMachineArn,
            input,
            name
        });
        const response = await sfn.send(command);

        result.result = response.executionArn || '';
        result.isSuccessful = true;
        ui.logToOutput("api.StartExecution Success");
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.StartExecution Error !!!", error);
        ui.logToOutput("api.StartExecution Error !!!", error);
        return result;
    }
}

export async function ListExecutions(
    region: string,
    stateMachineArn: string,
    statusFilter?: string,
    maxResults?: number,
    startDate?: Date,
): Promise<MethodResult<ExecutionListItem[]>> {
    let result: MethodResult<ExecutionListItem[]> = new MethodResult<ExecutionListItem[]>();
    result.result = [];
    if(!maxResults) {maxResults = 100;}

    try {
        const sfn = await GetSFNClient(region);
        
        let nextToken: string | undefined = undefined;
        
        do {
            const command: ListExecutionsCommand = new ListExecutionsCommand({ 
                stateMachineArn,
                statusFilter: statusFilter as any,
                nextToken,
                maxResults: maxResults
            });
            const response = await sfn.send(command);
            
            if (response.executions) {
                result.result.push(...response.executions);
            }
            
            if (startDate && response.executions) {
                // if any execution's startDate is before the specified startDate, stop fetching more
                const hasOlderExecution = response.executions.some(exec => {
                    return exec.startDate && exec.startDate < startDate!;
                });
                if (hasOlderExecution) {
                    //filter out executions before startDate
                    result.result = result.result.filter(exec => {
                        return exec.startDate && exec.startDate >= startDate!;
                    });
                    break;
                }
            }

            nextToken = response.nextToken;
        } while (nextToken);

        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.ListExecutions Error !!!", error);
        ui.logToOutput("api.ListExecutions Error !!!", error);
        return result;
    }
}

export async function GetExecutionDetails(
    region: string,
    executionArn: string
): Promise<MethodResult<DescribeExecutionCommandOutput>> {
    let result: MethodResult<DescribeExecutionCommandOutput> = new MethodResult<DescribeExecutionCommandOutput>();

    try {
        const sfn = await GetSFNClient(region);
        const command = new DescribeExecutionCommand({ executionArn });
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

export async function GetExecutionHistory(
    region: string,
    executionArn: string
): Promise<MethodResult<GetExecutionHistoryOutput>> {
    let result: MethodResult<GetExecutionHistoryOutput> = new MethodResult<GetExecutionHistoryOutput>();

    try {
        const sfn = await GetSFNClient(region);
        
        let allEvents: any[] = [];
        let nextToken: string | undefined = undefined;
        
        do {
            const command: GetExecutionHistoryCommand = new GetExecutionHistoryCommand({ 
                executionArn,
                nextToken,
                maxResults: 1000
            });
            const response = await sfn.send(command);
            
            if (response.events) {
                allEvents.push(...response.events);
            }
            
            nextToken = response.nextToken;
        } while (nextToken);

        result.result = { events: allEvents };
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetExecutionHistory Error !!!", error);
        ui.logToOutput("api.GetExecutionHistory Error !!!", error);
        return result;
    }
}

export function GetLogGroupNameFromArn(stateMachineArn: string): string | undefined {
    try {
        // Extract log group from state machine ARN if logging is configured
        // This is a placeholder - in reality, we need to get logging configuration
        // from DescribeStateMachine response
        const parts = stateMachineArn.split(':');
        if (parts.length >= 7) {
            const stateMachineName = parts[6];
            return `/aws/vendedlogs/states/${stateMachineName}`;
        }
        return undefined;
    } catch (error: any) {
        ui.logToOutput("GetLogGroupNameFromArn Error", error);
        return undefined;
    }
}

export async function GetLatestLogStreamForExecution(
    region: string,
    logGroupName: string,
    executionName?: string
): Promise<MethodResult<string>> {
    let result: MethodResult<string> = new MethodResult<string>();

    try {
        const cloudwatchlogs = await GetCloudWatchLogsClient(region);
        
        const command = new DescribeLogStreamsCommand({
            logGroupName,
            orderBy: 'LastEventTime',
            descending: true,
            limit: executionName ? 50 : 1
        });

        const response = await cloudwatchlogs.send(command);

        if (!response.logStreams || response.logStreams.length === 0) {
            result.isSuccessful = false;
            result.error = new Error("No log streams found");
            return result;
        }

        // If execution name provided, try to find matching stream
        if (executionName) {
            const matchingStream = response.logStreams.find(
                stream => stream.logStreamName?.includes(executionName)
            );
            if (matchingStream && matchingStream.logStreamName) {
                result.result = matchingStream.logStreamName;
                result.isSuccessful = true;
                return result;
            }
        }

        // Otherwise return the latest stream
        const latestStream = response.logStreams[0].logStreamName;
        if (!latestStream) {
            result.isSuccessful = false;
            result.error = new Error("No log stream name found");
            return result;
        }

        result.result = latestStream;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLatestLogStreamForExecution Error !!!", error);
        ui.logToOutput("api.GetLatestLogStreamForExecution Error !!!", error);
        return result;
    }
}

export async function GetStateMachineTags(
    region: string,
    stateMachineArn: string
): Promise<MethodResult<Array<{ key: string; value: string }>>> {
    const result: MethodResult<Array<{ key: string; value: string }>> = new MethodResult<Array<{ key: string; value: string }>>();
    result.result = [];

    try {
        const sfnClient = await GetSFNClient(region);
        const command = new ListTagsForResourceCommand({
            resourceArn: stateMachineArn
        });

        const response = await sfnClient.send(command);
        
        if (response.tags) {
            result.result = response.tags.map((tag: any) => ({
                key: tag.key || '',
                value: tag.value || ''
            }));
        }

        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.GetStateMachineTags Error !!!", error);
        return result;
    }
}

export async function UpdateStateMachineTag(
    region: string,
    stateMachineArn: string,
    key: string,
    value: string
): Promise<MethodResult<void>> {
    const result: MethodResult<void> = new MethodResult<void>();

    try {
        const sfnClient = await GetSFNClient(region);
        const command = new TagResourceCommand({
            resourceArn: stateMachineArn,
            tags: [
                {
                    key: key,
                    value: value
                }
            ]
        });

        await sfnClient.send(command);
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.UpdateStateMachineTag Error !!!", error);
        return result;
    }
}

export async function RemoveStateMachineTag(
    region: string,
    stateMachineArn: string,
    key: string
): Promise<MethodResult<void>> {
    const result: MethodResult<void> = new MethodResult<void>();

    try {
        const sfnClient = await GetSFNClient(region);
        const command = new UntagResourceCommand({
            resourceArn: stateMachineArn,
            tagKeys: [key]
        });

        await sfnClient.send(command);
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.RemoveStateMachineTag Error !!!", error);
        return result;
    }
}
