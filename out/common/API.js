"use strict";
/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Common AWS API utilities
 *
 * This file contains AWS credential management and general AWS operations.
 * Service-specific operations (S3, Lambda, etc.) are in their respective service folders.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFilepath = exports.getCredentialsFilepath = exports.getHomeDir = exports.ENV_CREDENTIALS_PATH = void 0;
exports.GetCredentials = GetCredentials;
exports.StartConnection = StartConnection;
exports.StopConnection = StopConnection;
exports.GetIAMClient = GetIAMClient;
exports.TestAwsCredentials = TestAwsCredentials;
exports.TestAwsConnection = TestAwsConnection;
exports.GetAwsProfileList = GetAwsProfileList;
exports.getIniProfileData = getIniProfileData;
const ui = require("./UI");
const MethodResult_1 = require("./MethodResult");
const os_1 = require("os");
const path_1 = require("path");
const path_2 = require("path");
const parseKnownFiles_1 = require("../aws-sdk/parseKnownFiles");
const credential_providers_1 = require("@aws-sdk/credential-providers");
const client_iam_1 = require("@aws-sdk/client-iam");
const client_sts_1 = require("@aws-sdk/client-sts");
let CurrentCredentials;
/**
 * Get AWS credentials using the default provider chain
 * Caches credentials for reuse
 */
async function GetCredentials() {
    let credentials;
    if (CurrentCredentials !== undefined) {
        ui.logToOutput("Aws credentials From Pool AccessKeyId=" + CurrentCredentials.accessKeyId);
        return CurrentCredentials;
    }
    try {
        // Get credentials using the default provider chain.
        const provider = (0, credential_providers_1.fromNodeProviderChain)({ ignoreCache: true });
        credentials = await provider();
        if (!credentials) {
            throw new Error("Aws credentials not found !!!");
        }
        CurrentCredentials = credentials;
        ui.logToOutput("Aws credentials AccessKeyId=" + credentials.accessKeyId);
        return credentials;
    }
    catch (error) {
        ui.showErrorMessage("Aws Credentials Not Found !!!", error);
        ui.logToOutput("GetCredentials Error !!!", error);
        return credentials;
    }
}
/**
 * Start AWS connection (loads credentials)
 */
async function StartConnection() {
    ui.logToOutput("Starting Connection");
    CurrentCredentials = await GetCredentials();
    ui.logToOutput("Connection Started");
}
/**
 * Stop AWS connection (clears cached credentials)
 */
async function StopConnection() {
    ui.logToOutput("Stopping Connection");
    CurrentCredentials = undefined;
    ui.logToOutput("Connection Stopped");
}
/**
 * Get IAM client instance
 */
async function GetIAMClient() {
    let credentials = await GetCredentials();
    return new client_iam_1.IAMClient({ credentials: credentials });
}
/**
 * Get STS client instance with specific region
 */
async function GetSTSClient(region) {
    const credentials = await GetCredentials();
    const stsClient = new client_sts_1.STSClient({
        region,
        credentials,
    });
    return stsClient;
}
/**
 * Test if AWS credentials are available
 */
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
/**
 * Test AWS connection by making an STS call
 */
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
/**
 * Get list of AWS profiles from credentials file
 */
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
/**
 * Get INI profile data from AWS credentials files
 */
async function getIniProfileData(init = {}) {
    const profiles = await (0, parseKnownFiles_1.parseKnownFiles)(init);
    return profiles;
}
/**
 * Environment variable for AWS credentials file path
 */
exports.ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";
/**
 * Get home directory path
 */
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
/**
 * Get AWS credentials file path
 */
const getCredentialsFilepath = () => process.env[exports.ENV_CREDENTIALS_PATH] || (0, path_2.join)((0, exports.getHomeDir)(), ".aws", "credentials");
exports.getCredentialsFilepath = getCredentialsFilepath;
/**
 * Get AWS config file path
 */
const getConfigFilepath = () => process.env[exports.ENV_CREDENTIALS_PATH] || (0, path_2.join)((0, exports.getHomeDir)(), ".aws", "config");
exports.getConfigFilepath = getConfigFilepath;
//# sourceMappingURL=API.js.map