import { 
    GlueClient, 
    GetJobCommand, 
    GetJobsCommand, 
    StartJobRunCommand, 
    GetJobRunCommand, 
    GetJobRunsCommand, 
    BatchStopJobRunCommand,
    Job,
    JobRun
} from "@aws-sdk/client-glue";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { 
    CloudWatchLogsClient, 
    OutputLogEvent, 
    DescribeLogStreamsCommand, 
    GetLogEventsCommand 
} from "@aws-sdk/client-cloudwatch-logs";
import * as ui from "../common/UI";
import { MethodResult } from '../common/MethodResult';
import { Session } from '../common/Session';

export async function GetGlueClient(region: string): Promise<GlueClient> {
    const credentials = await Session.Current.GetCredentials();
    const glueClient = new GlueClient({
        region,
        credentials,
        endpoint: Session.Current.AwsEndPoint,
    });
    return glueClient;
}

async function GetCloudWatchClient(region: string): Promise<CloudWatchLogsClient> {
    const credentials = await Session.Current.GetCredentials();
    const cloudwatchLogsClient = new CloudWatchLogsClient({
        region,
        credentials,
        endpoint: Session.Current.AwsEndPoint,
    });
    return cloudwatchLogsClient;
}

async function GetS3Client(region: string): Promise<S3Client> {
    const credentials = await Session.Current.GetCredentials();
    const s3Client = new S3Client({
        region,
        credentials,
        endpoint: Session.Current.AwsEndPoint,
        forcePathStyle: true,
    });
    return s3Client;
}

export async function GetGlueJobList(region: string, filter?: string): Promise<MethodResult<string[]>> {
    let result: MethodResult<string[]> = new MethodResult<string[]>();
    result.result = [];
    try {
        const glue = await GetGlueClient(region);
        let nextToken: string | undefined = undefined;
        do {
            const cmd: GetJobsCommand = new GetJobsCommand({ MaxResults: 100, NextToken: nextToken });
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
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetGlueJobList Error !!!", error);
        ui.logToOutput("api.GetGlueJobList Error !!!", error);
        return result;
    }
}

export async function GetGlueJob(region: string, jobName: string): Promise<MethodResult<Job>> {
    let result: MethodResult<Job> = new MethodResult<Job>();
    try {
        const glue = await GetGlueClient(region);
        const cmd = new GetJobCommand({ JobName: jobName });
        const res = await glue.send(cmd);
        if (res.Job) {
            result.result = res.Job;
        }
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetGlueJob Error !!!", error);
        ui.logToOutput("api.GetGlueJob Error !!!", error);
        return result;
    }
}

export async function StartGlueJob(region: string, jobName: string, parameters?: Record<string, string>): Promise<MethodResult<string>> {
    let result: MethodResult<string> = new MethodResult<string>();
    try {
        const glue = await GetGlueClient(region);
        const cmd = new StartJobRunCommand({ JobName: jobName, Arguments: parameters });
        const res = await glue.send(cmd);
        result.result = res.JobRunId ?? "";
        result.isSuccessful = true;
        ui.logToOutput(`api.StartGlueJob Success - RunId: ${result.result}`);
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.StartGlueJob Error !!!", error);
        ui.logToOutput("api.StartGlueJob Error !!!", error);
        return result;
    }
}

export async function StopGlueJob(region: string, jobName: string, jobRunId: string): Promise<MethodResult<string[]>> {
    let result: MethodResult<string[]> = new MethodResult<string[]>();
    result.result = [];
    try {
        const glue = await GetGlueClient(region);
        const cmd = new BatchStopJobRunCommand({ JobName: jobName, JobRunIds: [jobRunId] });
        const res = await glue.send(cmd);
        const stopped = res.SuccessfulSubmissions?.map(s => s?.JobRunId ?? '')?.filter(id => id) ?? [];
        result.result = stopped;
        result.isSuccessful = true;
        ui.logToOutput(`api.StopGlueJob Success - Stopped: ${stopped.join(', ')}`);
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.StopGlueJob Error !!!", error);
        ui.logToOutput("api.StopGlueJob Error !!!", error);
        return result;
    }
}

export async function GetGlueJobRuns(region: string, jobName: string): Promise<MethodResult<JobRun[]>> {
    let result: MethodResult<JobRun[]> = new MethodResult<JobRun[]>();
    result.result = [];
    try {
        const glue = await GetGlueClient(region);
        let nextToken: string | undefined = undefined;
        do {
            const cmd: GetJobRunsCommand = new GetJobRunsCommand({ JobName: jobName, MaxResults: 100, NextToken: nextToken });
            const res = await glue.send(cmd);
            if (res.JobRuns) {
                result.result.push(...res.JobRuns);
            }
            nextToken = res.NextToken as string | undefined;
        } while (nextToken);
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetGlueJobRuns Error !!!", error);
        ui.logToOutput("api.GetGlueJobRuns Error !!!", error);
        return result;
    }
}

export async function GetGlueJobRun(region: string, jobName: string, jobRunId: string): Promise<MethodResult<JobRun>> {
    let result: MethodResult<JobRun> = new MethodResult<JobRun>();
    try {
        const glue = await GetGlueClient(region);
        const cmd = new GetJobRunCommand({ JobName: jobName, RunId: jobRunId, PredecessorsIncluded: true });
        const res = await glue.send(cmd);
        if (res.JobRun) {
            result.result = res.JobRun;
        }
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetGlueJobRun Error !!!", error);
        ui.logToOutput("api.GetGlueJobRun Error !!!", error);
        return result;
    }
}

export async function GetLatestLogStreamList(region: string, logGroupName: string): Promise<MethodResult<string[]>> {
    let result: MethodResult<string[]> = new MethodResult<string[]>();
    result.result = [];
    try {
        const cloudwatchlogs = await GetCloudWatchClient(region);
        let nextToken: string | undefined = undefined;
        do {
            const describeLogStreamsCommand: DescribeLogStreamsCommand = new DescribeLogStreamsCommand({
                logGroupName: logGroupName,
                orderBy: "LastEventTime",
                descending: true,
                limit: 50,
                nextToken: nextToken,
            });
            const streamsResponse = await cloudwatchlogs.send(describeLogStreamsCommand);
            if (streamsResponse.logStreams) {
                result.result.push(...streamsResponse.logStreams.map((stream: any) => stream.logStreamName || 'invalid log stream'));
            }
            nextToken = streamsResponse.nextToken as string | undefined;
        } while (nextToken);
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.GetLatestLogStreamList Error !!!", error);
        return result;
    }
}

export async function GetLogEvents(region: string, logGroupName: string, logStreamName: string): Promise<MethodResult<OutputLogEvent[]>> {
    let result: MethodResult<OutputLogEvent[]> = new MethodResult<OutputLogEvent[]>();
    result.result = [];
    try {
        const cloudwatchlogs = await GetCloudWatchClient(region);
        let nextToken: string | undefined = undefined;
        do {
            const getLogEventsCommand: GetLogEventsCommand = new GetLogEventsCommand({
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
            const newToken = eventsResponse.nextForwardToken as string | undefined;
            if (newToken === nextToken) {
                break;
            }
            nextToken = newToken;
        } while (nextToken);
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.logToOutput("api.GetLogEvents Error !!!", error);
        return result;
    }
}

async function streamToBuffer(body: any): Promise<Uint8Array> {
    if (!body) { return new Uint8Array(); }
    if (typeof body.transformToByteArray === 'function') {
        return await body.transformToByteArray();
    }
    return await new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        body.on('data', (chunk: any) => chunks.push(Buffer.from(chunk)));
        body.on('end', () => resolve(Buffer.concat(chunks)));
        body.on('error', reject);
    });
}

export async function DownloadS3Object(region: string, bucket: string, key: string): Promise<MethodResult<Uint8Array>> {
    let result: MethodResult<Uint8Array> = new MethodResult<Uint8Array>();
    try {
        const s3 = await GetS3Client(region);
        const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        const data = await streamToBuffer(res.Body);
        result.result = data;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.DownloadS3Object Error !!!", error);
        ui.logToOutput("api.DownloadS3Object Error !!!", error);
        return result;
    }
}

export async function UploadS3Object(region: string, bucket: string, key: string, content: Uint8Array): Promise<MethodResult<void>> {
    let result: MethodResult<void> = new MethodResult<void>();
    try {
        const s3 = await GetS3Client(region);
        await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: content }));
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.UploadS3Object Error !!!", error);
        ui.logToOutput("api.UploadS3Object Error !!!", error);
        return result;
    }
}

export function ParseS3Uri(s3Uri: string): { bucket: string; key: string } | undefined {
    // Parse s3://bucket/key format
    const match = s3Uri.match(/^s3:\/\/([^/]+)\/(.+)$/);
    if (match) {
        return { bucket: match[1], key: match[2] };
    }
    return undefined;
}

export function GetGlueJobLogGroupName(jobName: string): string {
    return `/aws-glue/jobs/output`;
}

export function GetGlueJobErrorLogGroupName(jobName: string): string {
    return `/aws-glue/jobs/error`;
}
