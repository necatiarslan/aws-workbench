"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFilepath = exports.getCredentialsFilepath = exports.getHomeDir = exports.ENV_CREDENTIALS_PATH = void 0;
exports.GetCredentials = GetCredentials;
exports.GetSnsTopicList = GetSnsTopicList;
exports.isJsonString = isJsonString;
exports.ParseJson = ParseJson;
exports.PublishMessage = PublishMessage;
exports.GetTopicAttributes = GetTopicAttributes;
exports.GetSubscriptions = GetSubscriptions;
exports.ZipTextFile = ZipTextFile;
exports.TestAwsCredentials = TestAwsCredentials;
exports.TestAwsConnection = TestAwsConnection;
exports.GetAwsProfileList = GetAwsProfileList;
exports.getIniProfileData = getIniProfileData;
/* eslint-disable @typescript-eslint/naming-convention */
const credential_providers_1 = require("@aws-sdk/credential-providers");
const client_sns_1 = require("@aws-sdk/client-sns");
const ui = require("../../common/UI");
const MethodResult_1 = require("../../common/MethodResult");
const os_1 = require("os");
const path_1 = require("path");
const path_2 = require("path");
const parseKnownFiles_1 = require("../../common/aws-sdk/parseKnownFiles");
const SnsService_1 = require("./SnsService");
const fs = require("fs");
const archiver = require("archiver");
async function GetCredentials() {
    let credentials;
    try {
        if (SnsService_1.SnsService.Instance) {
            process.env.AWS_PROFILE = SnsService_1.SnsService.Instance.AwsProfile;
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
async function GetSNSClient(region) {
    const credentials = await GetCredentials();
    const sns = new client_sns_1.SNSClient({
        region,
        credentials,
        endpoint: SnsService_1.SnsService.Instance?.AwsEndPoint,
    });
    return sns;
}
async function GetSnsTopicList(region, TopicName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const snd = await GetSNSClient(region);
        let allTopics = [];
        let marker = undefined;
        // Continue fetching pages until no NextMarker is returned
        do {
            const command = new client_sns_1.ListTopicsCommand({ NextToken: marker, });
            const topicList = await snd.send(command);
            if (topicList.Topics) {
                allTopics.push(...topicList.Topics);
            }
            // Update marker to the next page (if present)
            marker = topicList.NextToken;
        } while (marker);
        let matchingTopics;
        if (TopicName) {
            matchingTopics = allTopics.filter((topic) => topic.TopicArn?.includes(TopicName) || TopicName.length === 0);
        }
        else {
            matchingTopics = allTopics;
        }
        // Extract the function names into the result
        if (matchingTopics && matchingTopics.length > 0) {
            matchingTopics.forEach((topic) => {
                if (topic.TopicArn)
                    result.result.push(topic.TopicArn);
            });
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetSnsTopicList Error !!!", error);
        ui.logToOutput("api.GetSnsTopicList Error !!!", error);
        return result;
    }
}
const client_sns_2 = require("@aws-sdk/client-sns");
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
async function PublishMessage(Region, TopicArn, Message) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sns = await GetSNSClient(Region);
        const param = {
            TopicArn: TopicArn,
            Message: Message
        };
        const command = new client_sns_2.PublishCommand(param);
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
const client_sns_3 = require("@aws-sdk/client-sns");
async function GetTopicAttributes(Region, TopicArn) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sns = await GetSNSClient(Region);
        const command = new client_sns_3.GetTopicAttributesCommand({
            TopicArn: TopicArn,
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
const client_sns_4 = require("@aws-sdk/client-sns");
async function GetSubscriptions(Region, TopicArn) {
    let result = new MethodResult_1.MethodResult();
    try {
        const sns = await GetSNSClient(Region);
        const command = new client_sns_4.ListSubscriptionsByTopicCommand({ TopicArn: TopicArn });
        const response = await sns.send(command);
        result.result = response;
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
        endpoint: SnsService_1.SnsService.Instance?.AwsEndPoint,
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