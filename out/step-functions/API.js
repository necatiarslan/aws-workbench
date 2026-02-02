"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSFNClient = GetSFNClient;
exports.GetStateMachineList = GetStateMachineList;
exports.GetStateMachineDefinition = GetStateMachineDefinition;
exports.UpdateStateMachineDefinition = UpdateStateMachineDefinition;
exports.StartExecution = StartExecution;
exports.ListExecutions = ListExecutions;
exports.GetExecutionDetails = GetExecutionDetails;
exports.GetExecutionHistory = GetExecutionHistory;
exports.GetLogGroupNameFromArn = GetLogGroupNameFromArn;
exports.GetLatestLogStreamForExecution = GetLatestLogStreamForExecution;
exports.GetStateMachineTags = GetStateMachineTags;
exports.UpdateStateMachineTag = UpdateStateMachineTag;
exports.RemoveStateMachineTag = RemoveStateMachineTag;
const client_sfn_1 = require("@aws-sdk/client-sfn");
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
const ui = require("../common/UI");
const MethodResult_1 = require("../common/MethodResult");
const Session_1 = require("../common/Session");
const API_1 = require("../cloudwatch-logs/API");
async function GetSFNClient(region) {
    const credentials = await Session_1.Session.Current.GetCredentials();
    const sfnClient = new client_sfn_1.SFNClient({
        region,
        credentials,
        endpoint: Session_1.Session.Current.AwsEndPoint,
    });
    return sfnClient;
}
async function GetStateMachineList(region, stateMachineName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const sfn = await GetSFNClient(region);
        let allStateMachines = [];
        let nextToken = undefined;
        do {
            const command = new client_sfn_1.ListStateMachinesCommand({ nextToken });
            const response = await sfn.send(command);
            if (response.stateMachines) {
                allStateMachines.push(...response.stateMachines);
            }
            nextToken = response.nextToken;
        } while (nextToken);
        // Filter state machines if a name filter is provided
        let matchingStateMachines = [];
        if (stateMachineName) {
            matchingStateMachines = allStateMachines.filter((sm) => sm.name?.includes(stateMachineName) || stateMachineName.length === 0);
        }
        else {
            matchingStateMachines = allStateMachines;
        }
        result.result = matchingStateMachines;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetStateMachineList Error !!!", error);
        ui.logToOutput("api.GetStateMachineList Error !!!", error);
        return result;
    }
}
async function GetStateMachineDefinition(region, stateMachineArn) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sfn = await GetSFNClient(region);
        const command = new client_sfn_1.DescribeStateMachineCommand({ stateMachineArn });
        const response = await sfn.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetStateMachineDefinition Error !!!", error);
        ui.logToOutput("api.GetStateMachineDefinition Error !!!", error);
        return result;
    }
}
async function UpdateStateMachineDefinition(region, stateMachineArn, definition) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sfn = await GetSFNClient(region);
        const command = new client_sfn_1.UpdateStateMachineCommand({
            stateMachineArn,
            definition
        });
        await sfn.send(command);
        result.result = true;
        result.isSuccessful = true;
        ui.logToOutput("api.UpdateStateMachineDefinition Success");
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.UpdateStateMachineDefinition Error !!!", error);
        ui.logToOutput("api.UpdateStateMachineDefinition Error !!!", error);
        return result;
    }
}
async function StartExecution(region, stateMachineArn, input, name) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sfn = await GetSFNClient(region);
        const command = new client_sfn_1.StartExecutionCommand({
            stateMachineArn,
            input,
            name
        });
        const response = await sfn.send(command);
        result.result = response.executionArn || '';
        result.isSuccessful = true;
        ui.logToOutput("api.StartExecution Success");
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.StartExecution Error !!!", error);
        ui.logToOutput("api.StartExecution Error !!!", error);
        return result;
    }
}
async function ListExecutions(region, stateMachineArn, statusFilter, maxResults, startDate) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    if (!maxResults) {
        maxResults = 100;
    }
    try {
        const sfn = await GetSFNClient(region);
        let nextToken = undefined;
        do {
            const command = new client_sfn_1.ListExecutionsCommand({
                stateMachineArn,
                statusFilter: statusFilter,
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
                    return exec.startDate && exec.startDate < startDate;
                });
                if (hasOlderExecution) {
                    //filter out executions before startDate
                    result.result = result.result.filter(exec => {
                        return exec.startDate && exec.startDate >= startDate;
                    });
                    break;
                }
            }
            nextToken = response.nextToken;
        } while (nextToken);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.ListExecutions Error !!!", error);
        ui.logToOutput("api.ListExecutions Error !!!", error);
        return result;
    }
}
async function GetExecutionDetails(region, executionArn) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sfn = await GetSFNClient(region);
        const command = new client_sfn_1.DescribeExecutionCommand({ executionArn });
        const response = await sfn.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetExecutionDetails Error !!!", error);
        ui.logToOutput("api.GetExecutionDetails Error !!!", error);
        return result;
    }
}
async function GetExecutionHistory(region, executionArn) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sfn = await GetSFNClient(region);
        let allEvents = [];
        let nextToken = undefined;
        do {
            const command = new client_sfn_1.GetExecutionHistoryCommand({
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
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetExecutionHistory Error !!!", error);
        ui.logToOutput("api.GetExecutionHistory Error !!!", error);
        return result;
    }
}
function GetLogGroupNameFromArn(stateMachineArn) {
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
    }
    catch (error) {
        ui.logToOutput("GetLogGroupNameFromArn Error", error);
        return undefined;
    }
}
async function GetLatestLogStreamForExecution(region, logGroupName, executionName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const cloudwatchlogs = await (0, API_1.GetCloudWatchLogsClient)(region);
        const command = new client_cloudwatch_logs_1.DescribeLogStreamsCommand({
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
            const matchingStream = response.logStreams.find(stream => stream.logStreamName?.includes(executionName));
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
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLatestLogStreamForExecution Error !!!", error);
        ui.logToOutput("api.GetLatestLogStreamForExecution Error !!!", error);
        return result;
    }
}
async function GetStateMachineTags(region, stateMachineArn) {
    const result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const sfnClient = await GetSFNClient(region);
        const command = new client_sfn_1.ListTagsForResourceCommand({
            resourceArn: stateMachineArn
        });
        const response = await sfnClient.send(command);
        if (response.tags) {
            result.result = response.tags.map((tag) => ({
                key: tag.key || '',
                value: tag.value || ''
            }));
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.GetStateMachineTags Error !!!", error);
        return result;
    }
}
async function UpdateStateMachineTag(region, stateMachineArn, key, value) {
    const result = new MethodResult_1.MethodResult();
    try {
        const sfnClient = await GetSFNClient(region);
        const command = new client_sfn_1.TagResourceCommand({
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
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.UpdateStateMachineTag Error !!!", error);
        return result;
    }
}
async function RemoveStateMachineTag(region, stateMachineArn, key) {
    const result = new MethodResult_1.MethodResult();
    try {
        const sfnClient = await GetSFNClient(region);
        const command = new client_sfn_1.UntagResourceCommand({
            resourceArn: stateMachineArn,
            tagKeys: [key]
        });
        await sfnClient.send(command);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.RemoveStateMachineTag Error !!!", error);
        return result;
    }
}
//# sourceMappingURL=API.js.map