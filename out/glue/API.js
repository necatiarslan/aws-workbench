"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetGlueClient = GetGlueClient;
exports.GetGlueJobList = GetGlueJobList;
exports.GetGlueJob = GetGlueJob;
exports.StartGlueJob = StartGlueJob;
exports.StopGlueJob = StopGlueJob;
exports.GetGlueJobRuns = GetGlueJobRuns;
exports.GetGlueJobRun = GetGlueJobRun;
exports.GetLatestLogStreamList = GetLatestLogStreamList;
exports.GetLogEvents = GetLogEvents;
exports.DownloadS3Object = DownloadS3Object;
exports.UploadS3Object = UploadS3Object;
exports.ParseS3Uri = ParseS3Uri;
exports.GetGlueJobLogGroupName = GetGlueJobLogGroupName;
exports.GetGlueJobErrorLogGroupName = GetGlueJobErrorLogGroupName;
const client_glue_1 = require("@aws-sdk/client-glue");
const client_s3_1 = require("@aws-sdk/client-s3");
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
const ui = require("../common/UI");
const MethodResult_1 = require("../common/MethodResult");
const Session_1 = require("../common/Session");
async function GetGlueClient(region) {
    const credentials = await Session_1.Session.Current.GetCredentials();
    const glueClient = new client_glue_1.GlueClient({
        region,
        credentials,
        endpoint: Session_1.Session.Current.AwsEndPoint,
    });
    return glueClient;
}
async function GetCloudWatchClient(region) {
    const credentials = await Session_1.Session.Current.GetCredentials();
    const cloudwatchLogsClient = new client_cloudwatch_logs_1.CloudWatchLogsClient({
        region,
        credentials,
        endpoint: Session_1.Session.Current.AwsEndPoint,
    });
    return cloudwatchLogsClient;
}
async function GetS3Client(region) {
    const credentials = await Session_1.Session.Current.GetCredentials();
    const s3Client = new client_s3_1.S3Client({
        region,
        credentials,
        endpoint: Session_1.Session.Current.AwsEndPoint,
        forcePathStyle: true,
    });
    return s3Client;
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
        ui.showErrorMessage("api.GetGlueJobList Error !!!", error);
        ui.logToOutput("api.GetGlueJobList Error !!!", error);
        return result;
    }
}
async function GetGlueJob(region, jobName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const glue = await GetGlueClient(region);
        const cmd = new client_glue_1.GetJobCommand({ JobName: jobName });
        const res = await glue.send(cmd);
        if (res.Job) {
            result.result = res.Job;
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetGlueJob Error !!!", error);
        ui.logToOutput("api.GetGlueJob Error !!!", error);
        return result;
    }
}
async function StartGlueJob(region, jobName, parameters) {
    let result = new MethodResult_1.MethodResult();
    try {
        const glue = await GetGlueClient(region);
        const cmd = new client_glue_1.StartJobRunCommand({ JobName: jobName, Arguments: parameters });
        const res = await glue.send(cmd);
        result.result = res.JobRunId ?? "";
        result.isSuccessful = true;
        ui.logToOutput(`api.StartGlueJob Success - RunId: ${result.result}`);
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.StartGlueJob Error !!!", error);
        ui.logToOutput("api.StartGlueJob Error !!!", error);
        return result;
    }
}
async function StopGlueJob(region, jobName, jobRunId) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const glue = await GetGlueClient(region);
        const cmd = new client_glue_1.BatchStopJobRunCommand({ JobName: jobName, JobRunIds: [jobRunId] });
        const res = await glue.send(cmd);
        const stopped = res.SuccessfulSubmissions?.map(s => s?.JobRunId ?? '')?.filter(id => id) ?? [];
        result.result = stopped;
        result.isSuccessful = true;
        ui.logToOutput(`api.StopGlueJob Success - Stopped: ${stopped.join(', ')}`);
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.StopGlueJob Error !!!", error);
        ui.logToOutput("api.StopGlueJob Error !!!", error);
        return result;
    }
}
async function GetGlueJobRuns(region, jobName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const glue = await GetGlueClient(region);
        let nextToken = undefined;
        do {
            const cmd = new client_glue_1.GetJobRunsCommand({ JobName: jobName, MaxResults: 100, NextToken: nextToken });
            const res = await glue.send(cmd);
            if (res.JobRuns) {
                result.result.push(...res.JobRuns);
            }
            nextToken = res.NextToken;
        } while (nextToken);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetGlueJobRuns Error !!!", error);
        ui.logToOutput("api.GetGlueJobRuns Error !!!", error);
        return result;
    }
}
async function GetGlueJobRun(region, jobName, jobRunId) {
    let result = new MethodResult_1.MethodResult();
    try {
        const glue = await GetGlueClient(region);
        const cmd = new client_glue_1.GetJobRunCommand({ JobName: jobName, RunId: jobRunId, PredecessorsIncluded: true });
        const res = await glue.send(cmd);
        if (res.JobRun) {
            result.result = res.JobRun;
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetGlueJobRun Error !!!", error);
        ui.logToOutput("api.GetGlueJobRun Error !!!", error);
        return result;
    }
}
async function GetLatestLogStreamList(region, logGroupName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const cloudwatchlogs = await GetCloudWatchClient(region);
        let nextToken = undefined;
        do {
            const describeLogStreamsCommand = new client_cloudwatch_logs_1.DescribeLogStreamsCommand({
                logGroupName: logGroupName,
                orderBy: "LastEventTime",
                descending: true,
                limit: 50,
                nextToken: nextToken,
            });
            const streamsResponse = await cloudwatchlogs.send(describeLogStreamsCommand);
            if (streamsResponse.logStreams) {
                result.result.push(...streamsResponse.logStreams.map((stream) => stream.logStreamName || 'invalid log stream'));
            }
            nextToken = streamsResponse.nextToken;
        } while (nextToken);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.GetLatestLogStreamList Error !!!", error);
        return result;
    }
}
async function GetLogEvents(region, logGroupName, logStreamName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const cloudwatchlogs = await GetCloudWatchClient(region);
        let nextToken = undefined;
        do {
            const getLogEventsCommand = new client_cloudwatch_logs_1.GetLogEventsCommand({
                logGroupName: logGroupName,
                logStreamName: logStreamName,
                limit: 50,
                startFromHead: true,
                nextToken: nextToken,
            });
            const eventsResponse = await cloudwatchlogs.send(getLogEventsCommand);
            if (eventsResponse.events) {
                result.result.push(...eventsResponse.events);
            }
            // Avoid infinite loop - CloudWatch returns same token when no more events
            const newToken = eventsResponse.nextForwardToken;
            if (newToken === nextToken) {
                break;
            }
            nextToken = newToken;
        } while (nextToken);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.GetLogEvents Error !!!", error);
        return result;
    }
}
async function streamToBuffer(body) {
    if (!body) {
        return new Uint8Array();
    }
    if (typeof body.transformToByteArray === 'function') {
        return await body.transformToByteArray();
    }
    return await new Promise((resolve, reject) => {
        const chunks = [];
        body.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        body.on('end', () => resolve(Buffer.concat(chunks)));
        body.on('error', reject);
    });
}
async function DownloadS3Object(region, bucket, key) {
    let result = new MethodResult_1.MethodResult();
    try {
        const s3 = await GetS3Client(region);
        const res = await s3.send(new client_s3_1.GetObjectCommand({ Bucket: bucket, Key: key }));
        const data = await streamToBuffer(res.Body);
        result.result = data;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.DownloadS3Object Error !!!", error);
        ui.logToOutput("api.DownloadS3Object Error !!!", error);
        return result;
    }
}
async function UploadS3Object(region, bucket, key, content) {
    let result = new MethodResult_1.MethodResult();
    try {
        const s3 = await GetS3Client(region);
        await s3.send(new client_s3_1.PutObjectCommand({ Bucket: bucket, Key: key, Body: content }));
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.UploadS3Object Error !!!", error);
        ui.logToOutput("api.UploadS3Object Error !!!", error);
        return result;
    }
}
function ParseS3Uri(s3Uri) {
    // Parse s3://bucket/key format
    const match = s3Uri.match(/^s3:\/\/([^/]+)\/(.+)$/);
    if (match) {
        return { bucket: match[1], key: match[2] };
    }
    return undefined;
}
function GetGlueJobLogGroupName(jobName) {
    return `/aws-glue/jobs/output`;
}
function GetGlueJobErrorLogGroupName(jobName) {
    return `/aws-glue/jobs/error`;
}
//# sourceMappingURL=API.js.map