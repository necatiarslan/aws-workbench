"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFilepath = exports.getCredentialsFilepath = exports.getHomeDir = exports.ENV_CREDENTIALS_PATH = void 0;
exports.GetCredentials = GetCredentials;
exports.GetGlueJobList = GetGlueJobList;
exports.StartGlueJobRun = StartGlueJobRun;
exports.GetLatestLogGroupLogStreamList = GetLatestLogGroupLogStreamList;
exports.GetLogEvents = GetLogEvents;
exports.TestAwsCredentials = TestAwsCredentials;
exports.TestAwsConnection = TestAwsConnection;
exports.GetAwsProfileList = GetAwsProfileList;
exports.getIniProfileData = getIniProfileData;
exports.isJsonString = isJsonString;
exports.GetGlueJobRuns = GetGlueJobRuns;
exports.GetGlueJobDescription = GetGlueJobDescription;
/* eslint-disable @typescript-eslint/naming-convention */
const credential_providers_1 = require("@aws-sdk/credential-providers");
const client_glue_1 = require("@aws-sdk/client-glue");
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
const client_sts_1 = require("@aws-sdk/client-sts");
const ui = require("./UI");
const MethodResult_1 = require("./MethodResult");
const os_1 = require("os");
const path_1 = require("path");
const path_2 = require("path");
const parseKnownFiles_1 = require("../aws-sdk/parseKnownFiles");
const GlueTreeView = require("../glue/GlueTreeView");
async function GetCredentials() {
    let credentials;
    try {
        if (GlueTreeView.GlueTreeView.Current) {
            process.env.AWS_PROFILE = GlueTreeView.GlueTreeView.Current.AwsProfile;
        }
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
async function GetGlueClient(region) {
    const credentials = await GetCredentials();
    const glueClient = new client_glue_1.GlueClient({
        region,
        credentials,
        endpoint: GlueTreeView.GlueTreeView.Current?.AwsEndPoint,
    });
    return glueClient;
}
async function GetCloudWatchClient(region) {
    const credentials = await GetCredentials();
    const cloudwatchLogsClient = new client_cloudwatch_logs_1.CloudWatchLogsClient({
        region,
        credentials,
        endpoint: GlueTreeView.GlueTreeView.Current?.AwsEndPoint,
    });
    return cloudwatchLogsClient;
}
async function GetSTSClient(region) {
    const credentials = await GetCredentials();
    const stsClient = new client_sts_1.STSClient({
        region,
        credentials,
        endpoint: GlueTreeView.GlueTreeView.Current?.AwsEndPoint,
    });
    return stsClient;
}
async function GetGlueJobList(region, filter) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const glue = await GetGlueClient(region);
        let nextToken = undefined;
        do {
            const cmd = new client_glue_1.GetJobsCommand({ MaxResults: 100, NextToken: nextToken });
            const res = await glue.send(cmd);
            if (res.Jobs) {
                for (const job of res.Jobs) {
                    if (!filter || job.Name?.includes(filter)) {
                        result.result.push(job.Name ?? "");
                    }
                }
            }
            nextToken = res.NextToken;
        } while (nextToken);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.GetGlueJobList Error !!!", error);
        return result;
    }
}
async function StartGlueJobRun(region, jobName, parameters) {
    let result = new MethodResult_1.MethodResult();
    try {
        const glue = await GetGlueClient(region);
        const cmd = new client_glue_1.StartJobRunCommand({ JobName: jobName, Arguments: parameters });
        const res = await glue.send(cmd);
        result.result = res.JobRunId ?? "";
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.StartGlueJobRun Error !!!", error);
        return result;
    }
}
async function GetLatestLogGroupLogStreamList(Region, LogGroupName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const cloudwatchlogs = await GetCloudWatchClient(Region);
        const describeLogStreamsCommand = new client_cloudwatch_logs_1.DescribeLogStreamsCommand({
            logGroupName: LogGroupName,
            orderBy: "LastEventTime",
            descending: true,
            limit: 30,
        });
        const streamsResponse = await cloudwatchlogs.send(describeLogStreamsCommand);
        if (streamsResponse.logStreams) {
            result.result = streamsResponse.logStreams.map(stream => stream.logStreamName || 'invalid log stream');
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        return result;
    }
}
async function GetLogEvents(Region, LogGroupName, LogStreamName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const cloudwatchlogs = await GetCloudWatchClient(Region);
        const getLogEventsCommand = new client_cloudwatch_logs_1.GetLogEventsCommand({
            logGroupName: LogGroupName,
            logStreamName: LogStreamName,
            limit: 50,
            startFromHead: true,
        });
        const eventsResponse = await cloudwatchlogs.send(getLogEventsCommand);
        if (eventsResponse.events) {
            result.result = eventsResponse.events;
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        return result;
    }
}
async function TestAwsCredentials() {
    let result = new MethodResult_1.MethodResult();
    try {
        await GetCredentials();
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
        await sts.send(command);
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
function isJsonString(jsonString) {
    try {
        var json = JSON.parse(jsonString);
        return (typeof json === 'object');
    }
    catch (e) {
        return false;
    }
}
async function GetGlueJobRuns(region, jobName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const glue = await GetGlueClient(region);
        const cmd = new client_glue_1.GetJobRunsCommand({ JobName: jobName, MaxResults: 20 });
        const res = await glue.send(cmd);
        if (res.JobRuns) {
            result.result = res.JobRuns;
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.GetGlueJobRuns Error !!!", error);
        return result;
    }
}
async function GetGlueJobDescription(region, jobName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const glue = await GetGlueClient(region);
        const cmd = new client_glue_1.GetJobsCommand({}); // Glue doesn't have a simple DescribeJob, GetJobs works
        const res = await glue.send(cmd);
        const job = res.Jobs?.find(j => j.Name === jobName);
        result.result = job;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        return result;
    }
}
//# sourceMappingURL=API.js.map