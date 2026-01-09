"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFilepath = exports.getCredentialsFilepath = exports.getHomeDir = exports.ENV_CREDENTIALS_PATH = void 0;
exports.GetCredentials = GetCredentials;
exports.GetSqsQueueList = GetSqsQueueList;
exports.GetQueueDetails = GetQueueDetails;
exports.isJsonString = isJsonString;
exports.ParseJson = ParseJson;
exports.SendMessage = SendMessage;
exports.ReceiveMessage = ReceiveMessage;
exports.PurgeQueue = PurgeQueue;
exports.DeleteMessage = DeleteMessage;
exports.DeleteAllMessages = DeleteAllMessages;
exports.GetQueuePolicy = GetQueuePolicy;
exports.GetMessageCount = GetMessageCount;
exports.ZipTextFile = ZipTextFile;
exports.TestAwsCredentials = TestAwsCredentials;
exports.TestAwsConnection = TestAwsConnection;
exports.GetAwsProfileList = GetAwsProfileList;
exports.getIniProfileData = getIniProfileData;
/* eslint-disable @typescript-eslint/naming-convention */
const Session_1 = require("../../common/Session");
const client_sqs_1 = require("@aws-sdk/client-sqs");
const ui = require("../../common/UI");
const MethodResult_1 = require("../../common/MethodResult");
const os_1 = require("os");
const path_1 = require("path");
const path_2 = require("path");
const parseKnownFiles_1 = require("../../aws-sdk/parseKnownFiles");
const fs = require("fs");
const archiver = require("archiver");
async function GetCredentials() {
    try {
        const credentials = await Session_1.Session.Current?.GetCredentials();
        if (!credentials) {
            throw new Error("Aws credentials not found !!!");
        }
        return credentials;
    }
    catch (error) {
        ui.showErrorMessage("Aws Credentials Not Found !!!", error);
        ui.logToOutput("GetCredentials Error !!!", error);
        return undefined;
    }
}
async function GetSQSClient(region) {
    const credentials = await GetCredentials();
    const sqs = new client_sqs_1.SQSClient({
        region,
        credentials,
        endpoint: Session_1.Session.Current?.AwsEndPoint,
    });
    return sqs;
}
async function GetSqsQueueList(region, QueName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const snd = await GetSQSClient(region);
        let allQues = [];
        let marker = undefined;
        // Continue fetching pages until no NextMarker is returned
        do {
            const command = new client_sqs_1.ListQueuesCommand({ NextToken: marker, });
            const queList = await snd.send(command);
            if (queList.QueueUrls) {
                allQues.push(...queList.QueueUrls);
            }
            // Update marker to the next page (if present)
            marker = queList.NextToken;
        } while (marker);
        let matchingQueues;
        if (QueName) {
            matchingQueues = allQues.filter((que) => que.includes(QueName) || QueName.length === 0);
        }
        else {
            matchingQueues = allQues;
        }
        // Extract the function names into the result
        if (matchingQueues && matchingQueues.length > 0) {
            matchingQueues.forEach((que) => {
                if (que)
                    result.result.push(que);
            });
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetSqsQueueList Error !!!", error);
        ui.logToOutput("api.GetSqsQueueList Error !!!", error);
        return result;
    }
}
const client_sqs_2 = require("@aws-sdk/client-sqs");
async function GetQueueDetails(region, queueUrl) {
    const sqs = new client_sqs_1.SQSClient({ region });
    const command = new client_sqs_2.GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: [
            "QueueArn",
            "CreatedTimestamp",
            "LastModifiedTimestamp",
            "MaximumMessageSize",
            "RedrivePolicy", // Dead-letter queue info
            "All" // To get all attributes
        ]
    });
    const response = await sqs.send(command);
    // Extract details
    return {
        QueueUrl: queueUrl,
        QueueArn: response.Attributes?.QueueArn,
        CreatedDate: response.Attributes?.CreatedTimestamp,
        LastUpdatedDate: response.Attributes?.LastModifiedTimestamp,
        MaxMessageSize: response.Attributes?.MaximumMessageSize,
        DeadLetterQueueEnabled: !!response.Attributes?.RedrivePolicy,
        // Queue Name and Type are not direct attributes, but you can parse the name from the URL
        QueueName: queueUrl.split("/").pop(),
        Type: response.Attributes?.FifoQueue === "true" ? "FIFO" : "Standard"
    };
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
const client_sqs_3 = require("@aws-sdk/client-sqs");
async function SendMessage(Region, QueueUrl, Message) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sqs = await GetSQSClient(Region);
        const param = {
            QueueUrl: QueueUrl,
            MessageBody: Message
        };
        const command = new client_sqs_3.SendMessageCommand(param);
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
const client_sqs_4 = require("@aws-sdk/client-sqs");
async function ReceiveMessage(Region, QueueUrl, MaxNumberOfMessages = 1, WaitTimeSeconds = 0) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sqs = await GetSQSClient(Region);
        const params = {
            QueueUrl,
            MaxNumberOfMessages,
            WaitTimeSeconds,
        };
        const command = new client_sqs_4.ReceiveMessageCommand(params);
        const response = await sqs.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.ReceiveMessage Error !!!", error);
        ui.logToOutput("api.ReceiveMessage Error !!!", error);
        return result;
    }
}
const client_sqs_5 = require("@aws-sdk/client-sqs");
async function PurgeQueue(Region, QueueUrl) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sqs = await GetSQSClient(Region);
        const command = new client_sqs_5.PurgeQueueCommand({ QueueUrl });
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
const client_sqs_6 = require("@aws-sdk/client-sqs");
async function DeleteMessage(Region, QueueUrl, ReceiptHandle) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sqs = await GetSQSClient(Region);
        const params = {
            QueueUrl,
            ReceiptHandle,
        };
        const command = new client_sqs_6.DeleteMessageCommand(params);
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
async function DeleteAllMessages(Region, QueueUrl, MaxBatch = 10) {
    let result = new MethodResult_1.MethodResult();
    let deletedCount = 0;
    try {
        const sqs = await GetSQSClient(Region);
        while (true) {
            // Receive up to MaxBatch messages
            const receiveParams = {
                QueueUrl,
                MaxNumberOfMessages: MaxBatch,
                WaitTimeSeconds: 0,
            };
            const receiveCommand = new client_sqs_4.ReceiveMessageCommand(receiveParams);
            const receiveResponse = await sqs.send(receiveCommand);
            const messages = receiveResponse.Messages || [];
            if (messages.length === 0) {
                break;
            }
            for (const msg of messages) {
                if (msg.ReceiptHandle) {
                    const deleteParams = {
                        QueueUrl,
                        ReceiptHandle: msg.ReceiptHandle,
                    };
                    const deleteCommand = new client_sqs_6.DeleteMessageCommand(deleteParams);
                    await sqs.send(deleteCommand);
                    deletedCount++;
                }
            }
        }
        result.result = deletedCount;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.DeleteAllMessages Error !!!", error);
        ui.logToOutput("api.DeleteAllMessages Error !!!", error);
        return result;
    }
}
async function GetQueuePolicy(region, queueUrl) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sqs = await GetSQSClient(region);
        const command = new client_sqs_2.GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: ["Policy"]
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
async function GetMessageCount(Region, QueueUrl) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sqs = await GetSQSClient(Region);
        const command = new client_sqs_2.GetQueueAttributesCommand({
            QueueUrl,
            AttributeNames: ["ApproximateNumberOfMessages"]
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
        const archive = archiver('zip', {
            zlib: { level: 9 } // Set compression level
        });
        archive.pipe(output);
        if (fs.lstatSync(inputPath).isDirectory()) {
            archive.directory(inputPath, false);
        }
        else {
            archive.file(inputPath, { name: (0, path_2.basename)(inputPath) });
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
const client_sts_1 = require("@aws-sdk/client-sts");
async function GetSTSClient(region) {
    const credentials = await GetCredentials();
    const iamClient = new client_sts_1.STSClient({
        region,
        credentials,
        endpoint: Session_1.Session.Current?.AwsEndPoint,
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
//# sourceMappingURL=API.js.map