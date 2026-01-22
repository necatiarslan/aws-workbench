"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLambdaClient = GetLambdaClient;
exports.GetLambdaList = GetLambdaList;
exports.TriggerLambda = TriggerLambda;
exports.GetLatestLambdaLogStreamName = GetLatestLambdaLogStreamName;
exports.GetLambdaLogGroupName = GetLambdaLogGroupName;
exports.GetLatestLambdaLogs = GetLatestLambdaLogs;
exports.GetLatestLambdaLogStreams = GetLatestLambdaLogStreams;
exports.GetLambdaLogs = GetLambdaLogs;
exports.GetLogEvents = GetLogEvents;
exports.GetLambda = GetLambda;
exports.GetLambdaConfiguration = GetLambdaConfiguration;
exports.UpdateLambdaCode = UpdateLambdaCode;
exports.ZipTextFile = ZipTextFile;
exports.UpdateLambdaEnvironmentVariable = UpdateLambdaEnvironmentVariable;
exports.AddLambdaEnvironmentVariable = AddLambdaEnvironmentVariable;
exports.RemoveLambdaEnvironmentVariable = RemoveLambdaEnvironmentVariable;
exports.GetLambdaTags = GetLambdaTags;
exports.AddLambdaTag = AddLambdaTag;
exports.RemoveLambdaTag = RemoveLambdaTag;
exports.UpdateLambdaTag = UpdateLambdaTag;
exports.DownloadLambdaCode = DownloadLambdaCode;
const client_lambda_1 = require("@aws-sdk/client-lambda");
const ui = require("../common/UI");
const MethodResult_1 = require("../common/MethodResult");
const path_1 = require("path");
const Session_1 = require("../common/Session");
const fs = require("fs");
const archiver = require("archiver");
const API_1 = require("../cloudwatch-logs/API");
async function GetLambdaClient(region) {
    const credentials = await Session_1.Session.Current.GetCredentials();
    const lambdaClient = new client_lambda_1.LambdaClient({
        region,
        credentials,
        endpoint: Session_1.Session.Current.AwsEndPoint,
    });
    return lambdaClient;
}
async function GetLambdaList(region, LambdaName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        // Get the Lambda client (v3 client)
        const lambda = await GetLambdaClient(region);
        let allFunctions = [];
        let marker = undefined;
        // Continue fetching pages until no NextMarker is returned
        do {
            const command = new client_lambda_1.ListFunctionsCommand({ Marker: marker });
            const functionsList = await lambda.send(command);
            if (functionsList.Functions) {
                allFunctions.push(...functionsList.Functions);
            }
            // Update marker to the next page (if present)
            marker = functionsList.NextMarker;
        } while (marker);
        // Filter functions if a LambdaName filter is provided
        let matchingFunctions;
        if (LambdaName) {
            matchingFunctions = allFunctions.filter((func) => func.FunctionName?.includes(LambdaName) || LambdaName.length === 0);
        }
        else {
            matchingFunctions = allFunctions;
        }
        // Extract the function names into the result
        if (matchingFunctions && matchingFunctions.length > 0) {
            matchingFunctions.forEach((func) => {
                if (func.FunctionName)
                    result.result.push(func.FunctionName);
            });
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLambdaList Error !!!", error);
        ui.logToOutput("api.GetLambdaList Error !!!", error);
        return result;
    }
}
const client_lambda_2 = require("@aws-sdk/client-lambda");
async function TriggerLambda(Region, LambdaName, Parameters) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        // Specify the parameters for invoking the Lambda function
        const param = {
            FunctionName: LambdaName,
            // Explicitly cast the literal so that its type is the exact union type expected
            InvocationType: "RequestResponse",
            Payload: JSON.stringify(Parameters),
        };
        const command = new client_lambda_2.InvokeCommand(param);
        const response = await lambda.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.TriggerLambda Error !!!", error);
        ui.logToOutput("api.TriggerLambda Error !!!", error);
        return result;
    }
}
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
async function GetLatestLambdaLogStreamName(Region, Lambda) {
    ui.logToOutput("GetLatestLambdaLogStreamName for Lambda function: " + Lambda);
    let result = new MethodResult_1.MethodResult();
    try {
        // Get the log group name
        const logGroupName = GetLambdaLogGroupName(Lambda);
        const cloudwatchlogs = await (0, API_1.GetCloudWatchLogsClient)(Region);
        // Get the streams sorted by the latest event time
        const describeLogStreamsCommand = new client_cloudwatch_logs_1.DescribeLogStreamsCommand({
            logGroupName,
            orderBy: "LastEventTime",
            descending: true,
            limit: 1,
        });
        const streamsResponse = await cloudwatchlogs.send(describeLogStreamsCommand);
        if (!streamsResponse.logStreams || streamsResponse.logStreams.length === 0) {
            result.isSuccessful = false;
            result.error = new Error("No log streams found for this Lambda function.");
            ui.showErrorMessage("No log streams found for this Lambda function.", result.error);
            ui.logToOutput("No log streams found for this Lambda function.");
            return result;
        }
        // Get the latest log events from the first stream
        const logStreamName = streamsResponse.logStreams[0].logStreamName;
        if (!logStreamName) {
            result.isSuccessful = false;
            result.error = new Error("No log stream name found for this Lambda function.");
            ui.showErrorMessage("No log stream name found for this Lambda function.", result.error);
            ui.logToOutput("No log stream name found for this Lambda function.");
            return result;
        }
        result.result = logStreamName;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLatestLambdaLogStreamName Error !!!", error);
        ui.logToOutput("api.GetLatestLambdaLogStreamName Error !!!", error);
        return result;
    }
}
function GetLambdaLogGroupName(Lambda) {
    return `/aws/lambda/${Lambda}`;
}
async function GetLatestLambdaLogs(Region, Lambda) {
    ui.logToOutput("Getting logs for Lambda function: " + Lambda);
    let result = new MethodResult_1.MethodResult();
    try {
        // Get the log group name
        const logGroupName = GetLambdaLogGroupName(Lambda);
        const cloudwatchlogs = await (0, API_1.GetCloudWatchLogsClient)(Region);
        // Get the streams sorted by the latest event time
        const describeLogStreamsCommand = new client_cloudwatch_logs_1.DescribeLogStreamsCommand({
            logGroupName,
            orderBy: "LastEventTime",
            descending: true,
            limit: 1,
        });
        const streamsResponse = await cloudwatchlogs.send(describeLogStreamsCommand);
        if (!streamsResponse.logStreams || streamsResponse.logStreams.length === 0) {
            result.isSuccessful = false;
            result.error = new Error("No log streams found for this Lambda function.");
            ui.showErrorMessage("No log streams found for this Lambda function.", result.error);
            ui.logToOutput("No log streams found for this Lambda function.");
            return result;
        }
        // Get the latest log events from the first stream
        const logStreamName = streamsResponse.logStreams[0].logStreamName;
        if (!logStreamName) {
            result.isSuccessful = false;
            result.error = new Error("No log stream name found for this Lambda function.");
            ui.showErrorMessage("No log stream name found for this Lambda function.", result.error);
            ui.logToOutput("No log stream name found for this Lambda function.");
            return result;
        }
        const getLogEventsCommand = new client_cloudwatch_logs_1.GetLogEventsCommand({
            logGroupName: logGroupName,
            logStreamName: logStreamName,
            limit: 50, // Adjust the limit as needed
            startFromHead: true, // Start from the beginning of the log stream
        });
        const eventsResponse = await cloudwatchlogs.send(getLogEventsCommand);
        if (!eventsResponse.events || eventsResponse.events.length === 0) {
            result.isSuccessful = false;
            result.error = new Error("No log events found for this Lambda function.");
            ui.showErrorMessage("No log events found for this Lambda function.", result.error);
            ui.logToOutput("No log events found for this Lambda function.");
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
        ui.showErrorMessage("api.GetLatestLambdaLogs Error !!!", error);
        ui.logToOutput("api.GetLatestLambdaLogs Error !!!", error);
        return result;
    }
}
async function GetLatestLambdaLogStreams(Region, Lambda) {
    ui.logToOutput("Getting log streams for Lambda function: " + Lambda);
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        // Get the log group name
        const logGroupName = GetLambdaLogGroupName(Lambda);
        const cloudwatchlogs = await (0, API_1.GetCloudWatchLogsClient)(Region);
        // Get the streams sorted by the latest event time
        const describeLogStreamsCommand = new client_cloudwatch_logs_1.DescribeLogStreamsCommand({
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
        ui.showErrorMessage("api.GetLatestLambdaLogStreams Error !!!", error);
        ui.logToOutput("api.GetLatestLambdaLogStreams Error !!!", error);
        return result;
    }
}
async function GetLambdaLogs(Region, Lambda, LogStreamName) {
    ui.logToOutput("Getting logs for Lambda function: " + Lambda + " LogStream " + LogStreamName);
    let result = new MethodResult_1.MethodResult();
    try {
        // Get the log group name
        const logGroupName = GetLambdaLogGroupName(Lambda);
        const cloudwatchlogs = await (0, API_1.GetCloudWatchLogsClient)(Region);
        const getLogEventsCommand = new client_cloudwatch_logs_1.GetLogEventsCommand({
            logGroupName: logGroupName,
            logStreamName: LogStreamName,
            limit: 50, // Adjust the limit as needed
            startFromHead: true, // Start from the beginning of the log stream
        });
        const eventsResponse = await cloudwatchlogs.send(getLogEventsCommand);
        if (!eventsResponse.events || eventsResponse.events.length === 0) {
            result.isSuccessful = false;
            result.error = new Error("No log events found for this Lambda function." + Lambda + " LogStream " + LogStreamName);
            ui.showErrorMessage("No log events found for this Lambda function." + Lambda + " LogStream " + LogStreamName, result.error);
            ui.logToOutput("No log events found for this Lambda function." + Lambda + " LogStream " + LogStreamName);
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
        ui.showErrorMessage("api.GetLatestLambdaLogs Error !!!", error);
        ui.logToOutput("api.GetLatestLambdaLogs Error !!!", error);
        return result;
    }
}
async function GetLogEvents(Region, LogGroupName, LogStreamName) {
    ui.logToOutput("Getting logs from LogGroupName: " + LogGroupName + " LogStreamName: " + LogStreamName);
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        // Get the log group name
        const cloudwatchlogs = await (0, API_1.GetCloudWatchLogsClient)(Region);
        const getLogEventsCommand = new client_cloudwatch_logs_1.GetLogEventsCommand({
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
const client_lambda_3 = require("@aws-sdk/client-lambda");
async function GetLambda(Region, LambdaName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        const command = new client_lambda_3.GetFunctionCommand({
            FunctionName: LambdaName,
        });
        const response = await lambda.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLambda Error !!!", error);
        ui.logToOutput("api.GetLambda Error !!!", error);
        return result;
    }
}
const client_lambda_4 = require("@aws-sdk/client-lambda");
async function GetLambdaConfiguration(Region, LambdaName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        const command = new client_lambda_4.GetFunctionConfigurationCommand({
            FunctionName: LambdaName,
        });
        const response = await lambda.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLambdaConfiguration Error !!!", error);
        ui.logToOutput("api.GetLambdaConfiguration Error !!!", error);
        return result;
    }
}
const client_lambda_5 = require("@aws-sdk/client-lambda");
async function UpdateLambdaCode(Region, LambdaName, CodeFilePath) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        let zipresponse = await ZipTextFile(CodeFilePath);
        //wait for the zip file to be created
        while (!fs.existsSync(zipresponse.result)) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        const zipFileContents = fs.readFileSync(zipresponse.result);
        const command = new client_lambda_5.UpdateFunctionCodeCommand({
            FunctionName: LambdaName,
            ZipFile: zipFileContents,
        });
        const response = await lambda.send(command);
        // Delete the zip file
        fs.unlinkSync(zipresponse.result);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.UpdateLambdaCode Error !!!", error);
        ui.logToOutput("api.UpdateLambdaCode Error !!!", error);
        return result;
    }
}
async function ZipTextFile(inputPath, outputZipPath) {
    let result = new MethodResult_1.MethodResult();
    try {
        if (!outputZipPath) {
            outputZipPath = (0, path_1.dirname)(inputPath) + "/" + (0, path_1.basename)(inputPath) + ".zip";
        }
        // Delete the output zip file if it already exists
        if (fs.existsSync(outputZipPath)) {
            fs.unlinkSync(outputZipPath);
        }
        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Set compression level
        });
        archive.pipe(output);
        if (fs.lstatSync(inputPath).isDirectory()) {
            archive.directory(inputPath, false);
        }
        else {
            archive.file(inputPath, { name: (0, path_1.basename)(inputPath) });
        }
        archive.finalize();
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
const client_lambda_6 = require("@aws-sdk/client-lambda");
async function UpdateLambdaEnvironmentVariable(Region, LambdaName, EnvironmentVariableName, EnvironmentVariableValue) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        // First get current configuration to retrieve current environment variables
        const getConfigCommand = new client_lambda_4.GetFunctionConfigurationCommand({
            FunctionName: LambdaName,
        });
        const currentConfig = await lambda.send(getConfigCommand);
        // Get current environment variables or create empty object
        let environmentVariables = currentConfig.Environment?.Variables || {};
        // Update the specific environment variable
        environmentVariables[EnvironmentVariableName] = EnvironmentVariableValue;
        // Update the function configuration
        const command = new client_lambda_6.UpdateFunctionConfigurationCommand({
            FunctionName: LambdaName,
            Environment: {
                Variables: environmentVariables
            }
        });
        const response = await lambda.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.UpdateLambdaEnvironmentVariable Error !!!", error);
        ui.logToOutput("api.UpdateLambdaEnvironmentVariable Error !!!", error);
        return result;
    }
}
async function AddLambdaEnvironmentVariable(Region, LambdaName, EnvironmentVariableName, EnvironmentVariableValue) {
    // Same implementation as update - AWS merges the variables
    return await UpdateLambdaEnvironmentVariable(Region, LambdaName, EnvironmentVariableName, EnvironmentVariableValue);
}
async function RemoveLambdaEnvironmentVariable(Region, LambdaName, EnvironmentVariableName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        // First get current configuration to retrieve current environment variables
        const getConfigCommand = new client_lambda_4.GetFunctionConfigurationCommand({
            FunctionName: LambdaName,
        });
        const currentConfig = await lambda.send(getConfigCommand);
        // Get current environment variables
        let environmentVariables = currentConfig.Environment?.Variables || {};
        // Remove the specific environment variable
        delete environmentVariables[EnvironmentVariableName];
        // Update the function configuration
        const command = new client_lambda_6.UpdateFunctionConfigurationCommand({
            FunctionName: LambdaName,
            Environment: {
                Variables: environmentVariables
            }
        });
        const response = await lambda.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.RemoveLambdaEnvironmentVariable Error !!!", error);
        ui.logToOutput("api.RemoveLambdaEnvironmentVariable Error !!!", error);
        return result;
    }
}
async function GetLambdaTags(Region, LambdaArn) {
    let result = new MethodResult_1.MethodResult();
    result.result = {};
    try {
        const lambda = await GetLambdaClient(Region);
        const command = new client_lambda_6.ListTagsCommand({
            Resource: LambdaArn,
        });
        const response = await lambda.send(command);
        if (response.Tags) {
            result.result = response.Tags;
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLambdaTags Error !!!", error);
        ui.logToOutput("api.GetLambdaTags Error !!!", error);
        return result;
    }
}
async function AddLambdaTag(Region, LambdaArn, TagKey, TagValue) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        const command = new client_lambda_6.TagResourceCommand({
            Resource: LambdaArn,
            Tags: {
                [TagKey]: TagValue
            }
        });
        await lambda.send(command);
        result.result = true;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.AddLambdaTag Error !!!", error);
        ui.logToOutput("api.AddLambdaTag Error !!!", error);
        return result;
    }
}
async function RemoveLambdaTag(Region, LambdaArn, TagKey) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        const command = new client_lambda_6.UntagResourceCommand({
            Resource: LambdaArn,
            TagKeys: [TagKey]
        });
        await lambda.send(command);
        result.result = true;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.RemoveLambdaTag Error !!!", error);
        ui.logToOutput("api.RemoveLambdaTag Error !!!", error);
        return result;
    }
}
async function UpdateLambdaTag(Region, LambdaArn, TagKey, TagValue) {
    // Update is same as add - AWS will overwrite existing tags
    return await AddLambdaTag(Region, LambdaArn, TagKey, TagValue);
}
async function DownloadLambdaCode(Region, LambdaName, DownloadPath) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        // Get the Lambda function details which includes the code location
        const command = new client_lambda_3.GetFunctionCommand({
            FunctionName: LambdaName,
        });
        const response = await lambda.send(command);
        if (!response.Code?.Location) {
            result.isSuccessful = false;
            result.error = new Error("No code location found for this Lambda function");
            ui.showErrorMessage("No code location found for this Lambda function", result.error);
            ui.logToOutput("api.DownloadLambdaCode Error: No code location");
            return result;
        }
        const codeUrl = response.Code.Location;
        // Download the zip file from the URL
        const https = require('https');
        const http = require('http');
        const path = require('path');
        const fileName = `${LambdaName}.zip`;
        const fullPath = path.join(DownloadPath, fileName);
        // Determine if we need https or http
        const client = codeUrl.startsWith('https') ? https : http;
        return new Promise((resolve) => {
            client.get(codeUrl, (response) => {
                if (response.statusCode !== 200) {
                    result.isSuccessful = false;
                    result.error = new Error(`Failed to download: ${response.statusCode}`);
                    ui.showErrorMessage("Failed to download Lambda code", result.error);
                    ui.logToOutput("api.DownloadLambdaCode Error: Download failed");
                    resolve(result);
                    return;
                }
                const fileStream = fs.createWriteStream(fullPath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    result.result = fullPath;
                    result.isSuccessful = true;
                    ui.logToOutput("api.DownloadLambdaCode Success: " + fullPath);
                    resolve(result);
                });
                fileStream.on('error', (err) => {
                    fs.unlink(fullPath, () => { }); // Delete the file on error
                    result.isSuccessful = false;
                    result.error = err;
                    ui.showErrorMessage("Failed to save Lambda code", err);
                    ui.logToOutput("api.DownloadLambdaCode Error: File write failed", err);
                    resolve(result);
                });
            }).on('error', (err) => {
                result.isSuccessful = false;
                result.error = err;
                ui.showErrorMessage("Failed to download Lambda code", err);
                ui.logToOutput("api.DownloadLambdaCode Error: Network error", err);
                resolve(result);
            });
        });
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.DownloadLambdaCode Error !!!", error);
        ui.logToOutput("api.DownloadLambdaCode Error !!!", error);
        return result;
    }
}
//# sourceMappingURL=API.js.map