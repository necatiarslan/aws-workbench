"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFilepath = exports.getCredentialsFilepath = exports.getHomeDir = exports.ENV_CREDENTIALS_PATH = void 0;
exports.GetCredentials = GetCredentials;
exports.GetStepFuncList = GetStepFuncList;
exports.isJsonString = isJsonString;
exports.ParseJson = ParseJson;
exports.TriggerStepFunc = TriggerStepFunc;
exports.GetStepFuncLogGroupArn = GetStepFuncLogGroupArn;
exports.GetStepFuncLogGroupName = GetStepFuncLogGroupName;
exports.GetLatestLogGroupLogStreamList = GetLatestLogGroupLogStreamList;
exports.GetLatestStepFuncLogStreamName = GetLatestStepFuncLogStreamName;
exports.GetStepFuncName = GetStepFuncName;
exports.GetStepFuncRegion = GetStepFuncRegion;
exports.GetLatestStepFuncLogs = GetLatestStepFuncLogs;
exports.GetLatestStepFuncLogStreams = GetLatestStepFuncLogStreams;
exports.GetStepFuncLogs = GetStepFuncLogs;
exports.GetLogEvents = GetLogEvents;
exports.GetStepFuncDescription = GetStepFuncDescription;
exports.UpdateStepFuncCode = UpdateStepFuncCode;
exports.ZipTextFile = ZipTextFile;
exports.TestAwsCredentials = TestAwsCredentials;
exports.TestAwsConnection = TestAwsConnection;
exports.GetAwsProfileList = GetAwsProfileList;
exports.getIniProfileData = getIniProfileData;
exports.GetStepFuncExecutions = GetStepFuncExecutions;
exports.GetExecutionDetails = GetExecutionDetails;
/* eslint-disable @typescript-eslint/naming-convention */
const credential_providers_1 = require("@aws-sdk/credential-providers");
const client_sfn_1 = require("@aws-sdk/client-sfn");
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
const client_iam_1 = require("@aws-sdk/client-iam");
const ui = require("./UI");
const MethodResult_1 = require("./MethodResult");
const os_1 = require("os");
const path_1 = require("path");
const path_2 = require("path");
const parseKnownFiles_1 = require("../aws-sdk/parseKnownFiles");
const StepFuncTreeView = require("../step/StepFuncTreeView");
const fs = require("fs");
// add a simple in-memory cache for DescribeStateMachine responses
const stateMachineCache = new Map();
async function GetCredentials() {
    let credentials;
    try {
        if (StepFuncTreeView.StepFuncTreeView.Current) {
            process.env.AWS_PROFILE = StepFuncTreeView.StepFuncTreeView.Current.AwsProfile;
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
async function GetStepFuncClient(region) {
    const credentials = await GetCredentials();
    const stepFuncClient = new client_sfn_1.SFNClient({
        region,
        credentials,
        endpoint: StepFuncTreeView.StepFuncTreeView.Current?.AwsEndPoint,
    });
    return stepFuncClient;
}
async function GetCloudWatchClient(region) {
    const credentials = await GetCredentials();
    const cloudwatchLogsClient = new client_cloudwatch_logs_1.CloudWatchLogsClient({
        region,
        credentials,
        endpoint: StepFuncTreeView.StepFuncTreeView.Current?.AwsEndPoint,
    });
    return cloudwatchLogsClient;
}
async function GetIAMClient() {
    const credentials = await GetCredentials();
    const iamClient = new client_iam_1.IAMClient({ credentials });
    return iamClient;
}
async function GetStepFuncList(region, StepFuncName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const sfn = await GetStepFuncClient(region);
        let nextToken = undefined;
        do {
            const cmd = new client_sfn_1.ListStateMachinesCommand({ maxResults: 100, nextToken });
            const res = await sfn.send(cmd);
            if (res.stateMachines) {
                for (const sm of res.stateMachines) {
                    const name = sm.name ?? sm.stateMachineArn ?? "";
                    if (!StepFuncName || name.includes(StepFuncName)) {
                        result.result.push(sm.stateMachineArn ?? "");
                    }
                }
            }
            nextToken = res.nextToken;
        } while (nextToken);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetStepFuncList Error !!!", error);
        ui.logToOutput("api.GetStepFuncList Error !!!", error);
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
async function TriggerStepFunc(StepFuncArn, Parameters) {
    let result = new MethodResult_1.MethodResult();
    let Region = GetStepFuncRegion(StepFuncArn);
    try {
        // Start Step Functions execution
        const sfn = await GetStepFuncClient(Region);
        const input = JSON.stringify(Parameters ?? {});
        const stateMachineArn = StepFuncArn;
        const startCmd = new client_sfn_1.StartExecutionCommand({
            stateMachineArn,
            input,
        });
        const startResponse = await sfn.send(startCmd);
        result.result = startResponse;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.TriggerStepFunc Error !!!", error);
        ui.logToOutput("api.TriggerStepFunc Error !!!", error);
        return result;
    }
}
const client_cloudwatch_logs_2 = require("@aws-sdk/client-cloudwatch-logs");
// Utility to extract log group name from arn
function extractLogGroupNameFromArn(arn) {
    try {
        // arn:partition:service:region:account-id:resource-type:resource
        // CloudWatch log group ARNs are like: arn:aws:logs:region:account-id:log-group:my-log-group:*
        //example arn:aws:logs:us-east-1:123456789012:log-group:/aws/vendedlogs/states/us-east-1/MyStateMachine:*
        const parts = arn.split(':');
        // parts[5] should be "log-group", parts[6] the name (may include colons or slashes)
        if (parts.length >= 7) {
            let result = parts[6];
            ui.logToOutput("extractLogGroupNameFromArn: " + result);
            return result;
        }
        else {
            ui.logToOutput("extractLogGroupNameFromArn: Invalid ARN format");
        }
        return null;
    }
    catch (e) {
        ui.logToOutput("extractLogGroupNameFromArn error");
        return null;
    }
}
async function GetStepFuncLogGroupArn(StepFuncArn) {
    try {
        const describeResult = await GetStepFuncDescription(StepFuncArn);
        if (describeResult.isSuccessful && describeResult.result) {
            const loggingConfig = describeResult.result.loggingConfiguration;
            ui.logToOutput("GetStepFuncLogGroupArn: loggingConfig " + JSON.stringify(loggingConfig));
            if (loggingConfig.destinations?.length) {
                const cw = loggingConfig.destinations.find((d) => d.cloudWatchLogsLogGroup);
                let logGroupArn = cw?.cloudWatchLogsLogGroup?.logGroupArn ?? null;
                ui.logToOutput("GetStepFuncLogGroupArn: " + logGroupArn);
                return logGroupArn;
            }
            else {
                ui.logToOutput("GetStepFuncLogGroupArn: No logging configuration found.");
            }
        }
    }
    catch (error) {
        ui.logToOutput("GetStepFuncLogGroupArn error", error);
    }
    return null;
}
// Replace old synchronous function with async implementation that uses the state machine definition
async function GetStepFuncLogGroupName(StepFuncArn) {
    try {
        const logGroupArn = await GetStepFuncLogGroupArn(StepFuncArn);
        if (logGroupArn) {
            return extractLogGroupNameFromArn(logGroupArn);
        }
        // // Fallback to previous convention if no loggingConfiguration is present
        // const region = GetStepFuncRegion(StepFuncArn);
        // const name = GetStepFuncName(StepFuncArn);
        // if (region && name) {
        //   return `/aws/vendedlogs/states/${region}/${name}`;
        // }
        return null;
    }
    catch (error) {
        ui.logToOutput("GetStepFuncLogGroupName error", error);
        return null;
    }
}
async function GetLatestLogGroupLogStreamList(Region, LogGroupName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const cloudwatchlogs = await GetCloudWatchClient(Region);
        // Get the streams sorted by the latest event time
        const describeLogStreamsCommand = new client_cloudwatch_logs_2.DescribeLogStreamsCommand({
            logGroupName: LogGroupName,
            orderBy: "LastEventTime",
            descending: true,
            limit: 30,
        });
        const streamsResponse = await cloudwatchlogs.send(describeLogStreamsCommand);
        if (!streamsResponse.logStreams || streamsResponse.logStreams.length === 0) {
            return result;
        }
        result.result = streamsResponse.logStreams.map(stream => stream.logStreamName || 'invalid log stream');
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLatestStepFuncLogStreamName Error !!!", error);
        ui.logToOutput("api.GetLatestStepFuncLogStreamName Error !!!", error);
        return result;
    }
}
async function GetLatestStepFuncLogStreamName(StepFuncArn) {
    ui.logToOutput("GetLatestStepFuncLogStreamName for StepFunc function: " + StepFuncArn);
    let result = new MethodResult_1.MethodResult();
    let Region = GetStepFuncRegion(StepFuncArn);
    try {
        // Get the log group name
        const logGroupName = await GetStepFuncLogGroupName(StepFuncArn);
        if (!logGroupName) {
            result.isSuccessful = false;
            result.error = new Error("No log group found for this state machine.");
            ui.showErrorMessage("No log group found for this state machine.", result.error);
            ui.logToOutput("No log group found for this state machine.");
            return result;
        }
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
            result.error = new Error("No log streams found for this StepFunc function.");
            ui.showErrorMessage("No log streams found for this StepFunc function.", result.error);
            ui.logToOutput("No log streams found for this StepFunc function.");
            return result;
        }
        // Get the latest log events from the first stream
        const logStreamName = streamsResponse.logStreams[0].logStreamName;
        if (!logStreamName) {
            result.isSuccessful = false;
            result.error = new Error("No log stream name found for this StepFunc function.");
            ui.showErrorMessage("No log stream name found for this StepFunc function.", result.error);
            ui.logToOutput("No log stream name found for this StepFunc function.");
            return result;
        }
        result.result = logStreamName;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLatestStepFuncLogStreamName Error !!!", error);
        ui.logToOutput("api.GetLatestStepFuncLogStreamName Error !!!", error);
        return result;
    }
}
function GetStepFuncName(stepFuncArn) {
    if (stepFuncArn) {
        let parts = stepFuncArn.split(":");
        return parts[parts.length - 1];
    }
    return "";
}
function GetStepFuncRegion(stepFuncArn) {
    if (stepFuncArn) {
        let parts = stepFuncArn.split(":");
        return parts[3];
    }
    return "";
}
async function GetLatestStepFuncLogs(StepFunc) {
    ui.logToOutput("Getting logs for StepFunc function: " + StepFunc);
    let result = new MethodResult_1.MethodResult();
    let Region = GetStepFuncRegion(StepFunc);
    try {
        // Get the log group name
        const logGroupName = await GetStepFuncLogGroupName(StepFunc);
        if (!logGroupName) {
            result.isSuccessful = false;
            result.error = new Error("No log group found for this state machine.");
            ui.showErrorMessage("No log group found for this state machine.", result.error);
            ui.logToOutput("No log group found for this state machine.");
            return result;
        }
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
            result.error = new Error("No log streams found for this StepFunc function.");
            ui.showErrorMessage("No log streams found for this StepFunc function.", result.error);
            ui.logToOutput("No log streams found for this StepFunc function.");
            return result;
        }
        // Get the latest log events from the first stream
        const logStreamName = streamsResponse.logStreams[0].logStreamName;
        if (!logStreamName) {
            result.isSuccessful = false;
            result.error = new Error("No log stream name found for this StepFunc function.");
            ui.showErrorMessage("No log stream name found for this StepFunc function.", result.error);
            ui.logToOutput("No log stream name found for this StepFunc function.");
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
            result.error = new Error("No log events found for this StepFunc function.");
            ui.showErrorMessage("No log events found for this StepFunc function.", result.error);
            ui.logToOutput("No log events found for this StepFunc function.");
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
        ui.showErrorMessage("api.GetLatestStepFuncLogs Error !!!", error);
        ui.logToOutput("api.GetLatestStepFuncLogs Error !!!", error);
        return result;
    }
}
async function GetLatestStepFuncLogStreams(StepFunc) {
    ui.logToOutput("Getting log streams for StepFunc function: " + StepFunc);
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    let Region = GetStepFuncRegion(StepFunc);
    try {
        // Get the log group name
        const logGroupName = await GetStepFuncLogGroupName(StepFunc);
        if (!logGroupName) {
            result.isSuccessful = false;
            result.error = new Error("No log group found for this state machine.");
            ui.showErrorMessage("No log group found for this state machine.", result.error);
            ui.logToOutput("No log group found for this state machine.");
            return result;
        }
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
        ui.showErrorMessage("api.GetLatestStepFuncLogStreams Error !!!", error);
        ui.logToOutput("api.GetLatestStepFuncLogStreams Error !!!", error);
        return result;
    }
}
async function GetStepFuncLogs(Region, StepFunc, LogStreamName) {
    ui.logToOutput("Getting logs for StepFunc function: " + StepFunc + " LogStream " + LogStreamName);
    let result = new MethodResult_1.MethodResult();
    try {
        // Get the log group name
        const logGroupName = await GetStepFuncLogGroupName(StepFunc);
        if (!logGroupName) {
            result.isSuccessful = false;
            result.error = new Error("No log group found for this state machine.");
            ui.showErrorMessage("No log group found for this state machine.", result.error);
            ui.logToOutput("No log group found for this state machine.");
            return result;
        }
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
            result.error = new Error("No log events found for this StepFunc function." + StepFunc + " LogStream " + LogStreamName);
            ui.showErrorMessage("No log events found for this StepFunc function." + StepFunc + " LogStream " + LogStreamName, result.error);
            ui.logToOutput("No log events found for this StepFunc function." + StepFunc + " LogStream " + LogStreamName);
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
        ui.showErrorMessage("api.GetLatestStepFuncLogs Error !!!", error);
        ui.logToOutput("api.GetLatestStepFuncLogs Error !!!", error);
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
async function GetStepFuncDescription(StepFuncArn) {
    let result = new MethodResult_1.MethodResult();
    let Region = GetStepFuncRegion(StepFuncArn);
    try {
        // Return cached value if present
        if (stateMachineCache.has(StepFuncArn)) {
            ui.logToOutput(`GetStepFunc: returning cached state machine for ${StepFuncArn}`);
            result.result = stateMachineCache.get(StepFuncArn);
            result.isSuccessful = true;
            return result;
        }
        const stepFunc = await GetStepFuncClient(Region);
        const command = new client_sfn_1.DescribeStateMachineCommand({
            stateMachineArn: StepFuncArn,
        });
        const response = await stepFunc.send(command);
        // Cache the response for future calls
        stateMachineCache.set(StepFuncArn, response);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetStepFunc Error !!!", error);
        ui.logToOutput("api.GetStepFunc Error !!!", error);
        return result;
    }
}
const client_sfn_2 = require("@aws-sdk/client-sfn");
async function UpdateStepFuncCode(StepFuncArn, CodeFilePath) {
    let result = new MethodResult_1.MethodResult();
    let Region = GetStepFuncRegion(StepFuncArn);
    try {
        const stepFunc = await GetStepFuncClient(Region);
        const definition = fs.readFileSync(CodeFilePath, "utf8");
        const command = new client_sfn_2.UpdateStateMachineCommand({
            stateMachineArn: StepFuncArn,
            definition: definition,
        });
        const response = await stepFunc.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.UpdateStepFuncCode Error !!!", error);
        ui.logToOutput("api.UpdateStepFuncCode Error !!!", error);
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
        endpoint: StepFuncTreeView.StepFuncTreeView.Current?.AwsEndPoint,
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
async function GetStepFuncExecutions(StepFuncArn, ExecutionName, MaxResults = 20, StatusFilter) {
    ui.logToOutput("Getting executions for StepFunc: " + StepFuncArn);
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    let Region = GetStepFuncRegion(StepFuncArn);
    try {
        const sfn = await GetStepFuncClient(Region);
        const command = new client_sfn_1.ListExecutionsCommand({
            stateMachineArn: StepFuncArn,
            maxResults: MaxResults,
            statusFilter: StatusFilter,
        });
        const response = await sfn.send(command);
        if (response.executions) {
            if (ExecutionName) {
                result.result = response.executions.filter(exec => (exec.name ?? '').includes(ExecutionName));
            }
            else {
                result.result = response.executions;
            }
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetStepFuncExecutions Error !!!", error);
        ui.logToOutput("api.GetStepFuncExecutions Error !!!", error);
        return result;
    }
}
async function GetExecutionDetails(Region, ExecutionArn) {
    ui.logToOutput("Getting execution details for: " + ExecutionArn);
    let result = new MethodResult_1.MethodResult();
    try {
        const sfn = await GetStepFuncClient(Region);
        const command = new client_sfn_1.DescribeExecutionCommand({
            executionArn: ExecutionArn,
        });
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
//# sourceMappingURL=API.js.map