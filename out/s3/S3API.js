"use strict";
/**
 * S3 API Service
 *
 * Handles all S3-specific API operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3API = void 0;
const BaseAPI_1 = require("../core/BaseAPI");
const MethodResult_1 = require("../common/MethodResult");
const ui = require("../common/UI");
const s3_helper = require("./S3Helper");
const fs = require("fs");
const path_1 = require("path");
const fs_1 = require("fs");
const client_s3_1 = require("@aws-sdk/client-s3");
/**
 * S3 API class extending BaseAPI
 */
class S3API extends BaseAPI_1.BaseAPI {
    s3Client;
    awsProfile;
    awsEndpoint;
    awsRegion;
    /**
     * Get or create S3 client
     */
    async getS3Client() {
        if (this.s3Client) {
            return this.s3Client;
        }
        const credentials = await this.getCredentials();
        const config = await this.getClientConfig();
        this.s3Client = new client_s3_1.S3Client({
            credentials: credentials,
            endpoint: this.awsEndpoint || config.endpoint,
            forcePathStyle: true,
            region: this.awsRegion || config.region,
        });
        return this.s3Client;
    }
    /**
     * Invalidate cached S3 client
     */
    invalidateClients() {
        this.s3Client = undefined;
    }
    /**
     * Set AWS profile
     */
    setProfile(profile) {
        this.awsProfile = profile;
        process.env.AWS_PROFILE = profile;
        this.invalidateClients();
    }
    /**
     * Override setEndpoint to also update local endpoint
     */
    setEndpoint(endpoint) {
        super.setEndpoint(endpoint);
        this.awsEndpoint = endpoint;
    }
    /**
     * Override setRegion to also update local region
     */
    setRegion(region) {
        super.setRegion(region);
        this.awsRegion = region;
    }
    /**
     * Test S3 connection
     */
    async testConnection() {
        const result = new MethodResult_1.MethodResult();
        try {
            const s3 = await this.getS3Client();
            const command = new client_s3_1.ListBucketsCommand({});
            await s3.send(command);
            result.isSuccessful = true;
            result.result = true;
            ui.logToOutput('S3 connection test successful');
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.logToOutput('S3 connection test failed', error);
            return result;
        }
    }
    // ==================== Bucket Operations ====================
    /**
     * Get list of S3 buckets
     */
    async getBucketList(bucketName) {
        const result = new MethodResult_1.MethodResult();
        result.result = [];
        try {
            const s3 = await this.getS3Client();
            // If specific bucket name provided, check if it exists
            if (bucketName) {
                try {
                    const command = new client_s3_1.HeadBucketCommand({ Bucket: bucketName });
                    await s3.send(command);
                    result.result.push(bucketName);
                    result.isSuccessful = true;
                    return result;
                }
                catch {
                    // Bucket doesn't exist, fall through to list all
                }
            }
            // List all buckets
            const command = new client_s3_1.ListBucketsCommand({});
            const response = await s3.send(command);
            result.isSuccessful = true;
            if (response.Buckets) {
                for (const bucket of response.Buckets) {
                    if (bucket.Name && (bucketName === undefined || bucketName === '' || bucket.Name.includes(bucketName))) {
                        result.result.push(bucket.Name);
                    }
                }
            }
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage('Failed to get bucket list', error);
            ui.logToOutput('S3API.getBucketList Error', error);
            return result;
        }
    }
    // ==================== Object Listing ====================
    /**
     * Get folder listing from S3
     */
    async getFolderList(bucket, key) {
        const result = new MethodResult_1.MethodResult();
        try {
            const s3 = await this.getS3Client();
            const params = {
                Bucket: bucket,
                Prefix: key,
                Delimiter: '/',
            };
            const command = new client_s3_1.ListObjectsV2Command(params);
            const response = await s3.send(command);
            result.isSuccessful = true;
            result.result = response;
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage('Failed to get folder list', error);
            ui.logToOutput('S3API.getFolderList Error', error);
            return result;
        }
    }
    /**
     * Get all objects in a prefix
     */
    async getObjectList(bucket, key) {
        const result = new MethodResult_1.MethodResult();
        const keys = [];
        let continuationToken;
        try {
            const s3 = await this.getS3Client();
            do {
                const params = { Bucket: bucket, Prefix: key, ContinuationToken: continuationToken };
                const command = new client_s3_1.ListObjectsV2Command(params);
                const response = await s3.send(command);
                continuationToken = response.NextContinuationToken;
                response.Contents?.forEach((file) => keys.push(file.Key));
            } while (continuationToken);
            result.isSuccessful = true;
            result.result = keys;
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage('Failed to get object list', error);
            ui.logToOutput('S3API.getObjectList Error', error);
            return result;
        }
    }
    /**
     * Get object properties
     */
    async getObjectProperties(bucket, key) {
        const result = new MethodResult_1.MethodResult();
        try {
            const s3 = await this.getS3Client();
            const command = new client_s3_1.HeadObjectCommand({ Bucket: bucket, Key: key });
            const response = await s3.send(command);
            result.isSuccessful = true;
            result.result = response;
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage('Failed to get object properties', error);
            ui.logToOutput('S3API.getObjectProperties Error', error);
            return result;
        }
    }
    // ==================== Search Operations ====================
    /**
     * Search for objects in S3
     */
    async searchObject(bucket, prefixKey, fileName, fileExtension, folderName, maxResultCount = 100) {
        const result = new MethodResult_1.MethodResult();
        result.result = [];
        const searchFileName = fileName?.toLowerCase();
        const searchExtension = fileExtension?.toLowerCase();
        const searchFolderName = folderName?.toLowerCase();
        try {
            const s3 = await this.getS3Client();
            let continuationToken;
            do {
                const params = {
                    Bucket: bucket,
                    Prefix: prefixKey,
                    ContinuationToken: continuationToken,
                    MaxKeys: 100,
                };
                const command = new client_s3_1.ListObjectsV2Command(params);
                const response = await s3.send(command);
                continuationToken = response.NextContinuationToken;
                if (response.Contents) {
                    for (const file of response.Contents) {
                        const fileKey = file.Key?.toLowerCase();
                        const currentFileName = s3_helper.GetFileNameWithExtension(fileKey);
                        const matchesFolder = !searchFolderName || !fileKey || fileKey.includes(searchFolderName);
                        const matchesFileName = !searchFileName || currentFileName.includes(searchFileName);
                        const matchesExtension = !searchExtension || s3_helper.GetFileExtension(currentFileName) === searchExtension;
                        if (matchesFolder && matchesFileName && matchesExtension) {
                            result.result.push(file);
                        }
                        if (maxResultCount > 0 && result.result.length >= maxResultCount) {
                            break;
                        }
                    }
                }
                if (maxResultCount > 0 && result.result.length >= maxResultCount) {
                    break;
                }
            } while (continuationToken);
            result.isSuccessful = true;
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage('Search failed', error);
            ui.logToOutput('S3API.searchObject Error', error);
            return result;
        }
    }
    // ==================== Create Operations ====================
    /**
     * Create a folder in S3
     */
    async createFolder(bucket, key, folderName) {
        const result = new MethodResult_1.MethodResult();
        const targetKey = `${key}${folderName}/`;
        try {
            const s3 = await this.getS3Client();
            const param = { Bucket: bucket, Key: targetKey };
            const command = new client_s3_1.PutObjectCommand(param);
            await s3.send(command);
            result.isSuccessful = true;
            result.result = targetKey;
            ui.logToOutput(`S3API.createFolder Success: ${targetKey}`);
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage('Failed to create folder', error);
            ui.logToOutput('S3API.createFolder Error', error);
            return result;
        }
    }
    // ==================== Delete Operations ====================
    /**
     * Delete an object (file or folder)
     */
    async deleteObject(bucket, key) {
        const result = new MethodResult_1.MethodResult();
        result.result = [];
        try {
            if (s3_helper.IsFolder(key)) {
                return await this.deleteFolder(bucket, key);
            }
            else {
                return await this.deleteFile(bucket, key);
            }
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage(`Failed to delete: ${key}`, error);
            ui.logToOutput(`S3API.deleteObject Error: ${key}`, error);
            return result;
        }
    }
    /**
     * Delete a file from S3
     */
    async deleteFile(bucket, key) {
        const result = new MethodResult_1.MethodResult();
        result.result = [];
        try {
            const s3 = await this.getS3Client();
            const command = new client_s3_1.DeleteObjectCommand({ Bucket: bucket, Key: key });
            await s3.send(command);
            result.result.push(key);
            result.isSuccessful = true;
            ui.logToOutput(`S3API.deleteFile Success: ${key}`);
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage(`Failed to delete file: ${key}`, error);
            ui.logToOutput(`S3API.deleteFile Error: ${key}`, error);
            return result;
        }
    }
    /**
     * Delete a folder from S3
     */
    async deleteFolder(bucket, key) {
        const result = new MethodResult_1.MethodResult();
        result.result = [];
        try {
            if (!s3_helper.IsFolder(key)) {
                throw new Error(`Not a folder: ${key}`);
            }
            const objectsResult = await this.getObjectList(bucket, key);
            if (objectsResult.isSuccessful && objectsResult.result) {
                for (const fileKey of objectsResult.result) {
                    const deleteResult = await this.deleteFile(bucket, fileKey);
                    if (deleteResult.isSuccessful) {
                        result.result.push(fileKey);
                    }
                    else {
                        throw deleteResult.error;
                    }
                }
            }
            result.isSuccessful = true;
            ui.logToOutput(`S3API.deleteFolder Success: ${key}`);
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage(`Failed to delete folder: ${key}`, error);
            ui.logToOutput(`S3API.deleteFolder Error: ${key}`, error);
            return result;
        }
    }
    // ==================== Upload Operations ====================
    /**
     * Upload a file to a folder
     */
    async uploadFileToFolder(bucket, folderKey, sourcePath) {
        const targetKey = `${folderKey}${s3_helper.GetFileNameWithExtension(sourcePath)}`;
        return this.uploadFile(bucket, targetKey, sourcePath);
    }
    /**
     * Upload a file to S3
     */
    async uploadFile(bucket, targetKey, sourcePath) {
        const result = new MethodResult_1.MethodResult();
        try {
            const s3 = await this.getS3Client();
            const stream = fs.createReadStream(sourcePath);
            const param = {
                Bucket: bucket,
                Key: targetKey,
                Body: stream,
            };
            const command = new client_s3_1.PutObjectCommand(param);
            await s3.send(command);
            result.result = targetKey;
            result.isSuccessful = true;
            ui.logToOutput(`S3API.uploadFile Success: ${targetKey}`);
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage(`Failed to upload file: ${sourcePath}`, error);
            ui.logToOutput(`S3API.uploadFile Error: ${sourcePath}`, error);
            return result;
        }
    }
    // ==================== Copy Operations ====================
    /**
     * Copy an object (file or folder)
     */
    async copyObject(bucket, sourceKey, targetKey) {
        const result = new MethodResult_1.MethodResult();
        result.result = [];
        try {
            if (s3_helper.IsFolder(sourceKey)) {
                return await this.copyFolder(bucket, sourceKey, targetKey);
            }
            else {
                return await this.copyFile(bucket, sourceKey, targetKey);
            }
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage(`Failed to copy: ${sourceKey}`, error);
            ui.logToOutput(`S3API.copyObject Error: ${sourceKey}`, error);
            return result;
        }
    }
    /**
     * Copy a file
     */
    async copyFile(bucket, sourceKey, targetKey) {
        const result = new MethodResult_1.MethodResult();
        result.result = [];
        try {
            let finalTargetKey = targetKey;
            // If target is a folder, append source filename
            if (s3_helper.IsFolder(targetKey)) {
                finalTargetKey = targetKey === '/' ? '' : targetKey;
                if (s3_helper.IsFile(sourceKey)) {
                    finalTargetKey = finalTargetKey + s3_helper.GetFileNameWithExtension(sourceKey);
                }
            }
            // Check if source and target are the same
            if (sourceKey === finalTargetKey) {
                result.isSuccessful = false;
                result.error = new Error(`Source and target are the same: ${sourceKey}`);
                return result;
            }
            const s3 = await this.getS3Client();
            const params = {
                Bucket: bucket,
                CopySource: `/${bucket}/${sourceKey}`,
                Key: finalTargetKey,
            };
            const command = new client_s3_1.CopyObjectCommand(params);
            await s3.send(command);
            ui.logToOutput(`S3API.copyFile: ${sourceKey} → ${finalTargetKey}`);
            result.result.push(finalTargetKey);
            result.isSuccessful = true;
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage(`Failed to copy file: ${sourceKey}`, error);
            ui.logToOutput(`S3API.copyFile Error: ${sourceKey}`, error);
            return result;
        }
    }
    /**
     * Copy a folder
     */
    async copyFolder(bucket, sourceKey, targetKey) {
        const result = new MethodResult_1.MethodResult();
        result.result = [];
        try {
            if (s3_helper.IsFile(sourceKey)) {
                result.isSuccessful = false;
                result.error = new Error(`Source is a file: ${sourceKey}`);
                return result;
            }
            if (s3_helper.IsFile(targetKey)) {
                result.isSuccessful = false;
                result.error = new Error(`Target is a file: ${targetKey}`);
                return result;
            }
            let finalTargetKey = targetKey === '/' ? '' : targetKey;
            const objectsResult = await this.getObjectList(bucket, sourceKey);
            if (objectsResult.isSuccessful && objectsResult.result) {
                for (const fileKey of objectsResult.result) {
                    const parentFolder = s3_helper.GetParentFolderKey(sourceKey);
                    const relativeFilePath = fileKey.replace(parentFolder, '');
                    const targetFileKey = finalTargetKey + relativeFilePath;
                    const copyResult = await this.copyFile(bucket, fileKey, targetFileKey);
                    if (copyResult.isSuccessful) {
                        result.result.push(fileKey);
                    }
                    else {
                        throw copyResult.error;
                    }
                }
            }
            result.isSuccessful = true;
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage(`Failed to copy folder: ${sourceKey}`, error);
            ui.logToOutput(`S3API.copyFolder Error: ${sourceKey}`, error);
            return result;
        }
    }
    // ==================== Move Operations ====================
    /**
     * Move an object (file or folder)
     */
    async moveObject(bucket, sourceKey, targetKey) {
        const result = new MethodResult_1.MethodResult();
        result.result = [];
        try {
            if (sourceKey === targetKey) {
                result.isSuccessful = false;
                result.error = new Error(`Source and target are the same: ${sourceKey}`);
                return result;
            }
            if (s3_helper.IsFolder(sourceKey)) {
                return await this.moveFolder(bucket, sourceKey, targetKey);
            }
            else {
                return await this.moveFile(bucket, sourceKey, targetKey);
            }
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage(`Failed to move: ${sourceKey}`, error);
            ui.logToOutput(`S3API.moveObject Error: ${sourceKey}`, error);
            return result;
        }
    }
    /**
     * Move a file
     */
    async moveFile(bucket, sourceKey, targetKey) {
        const result = new MethodResult_1.MethodResult();
        result.result = [];
        try {
            if (sourceKey === targetKey) {
                result.isSuccessful = false;
                result.error = new Error(`Source and target are the same: ${sourceKey}`);
                return result;
            }
            // Copy file
            const copyResult = await this.copyFile(bucket, sourceKey, targetKey);
            if (!copyResult.isSuccessful) {
                result.error = copyResult.error;
                result.isSuccessful = false;
                return result;
            }
            // Delete source file
            const deleteResult = await this.deleteFile(bucket, sourceKey);
            if (!deleteResult.isSuccessful) {
                result.error = deleteResult.error;
                result.isSuccessful = false;
                return result;
            }
            result.result = copyResult.result;
            result.isSuccessful = true;
            ui.logToOutput(`S3API.moveFile Success: ${sourceKey} → ${targetKey}`);
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            return result;
        }
    }
    /**
     * Move a folder
     */
    async moveFolder(bucket, sourceKey, targetKey) {
        const result = new MethodResult_1.MethodResult();
        result.result = [];
        try {
            if (sourceKey === targetKey) {
                result.isSuccessful = false;
                result.error = new Error(`Source and target are the same: ${sourceKey}`);
                return result;
            }
            if (!s3_helper.IsFolder(sourceKey)) {
                result.error = new Error(`Source is a file: ${sourceKey}`);
                result.isSuccessful = false;
                return result;
            }
            if (!s3_helper.IsFolder(targetKey)) {
                result.error = new Error(`Target is a file: ${targetKey}`);
                result.isSuccessful = false;
                return result;
            }
            // Copy folder
            const copyResult = await this.copyFolder(bucket, sourceKey, targetKey);
            if (!copyResult.isSuccessful) {
                result.error = copyResult.error;
                result.isSuccessful = false;
                return result;
            }
            // Delete source folder
            const deleteResult = await this.deleteFolder(bucket, sourceKey);
            if (!deleteResult.isSuccessful) {
                result.error = deleteResult.error;
                result.isSuccessful = false;
                return result;
            }
            result.result = copyResult.result;
            result.isSuccessful = true;
            ui.logToOutput(`S3API.moveFolder Success: ${sourceKey} → ${targetKey}`);
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            return result;
        }
    }
    // ==================== Rename Operations ====================
    /**
     * Rename an object (file or folder)
     */
    async renameObject(bucket, sourceKey, targetName) {
        if (s3_helper.IsFolder(sourceKey)) {
            return await this.renameFolder(bucket, sourceKey, targetName);
        }
        else {
            return await this.renameFile(bucket, sourceKey, targetName);
        }
    }
    /**
     * Rename a file
     */
    async renameFile(bucket, sourceKey, targetName) {
        const result = new MethodResult_1.MethodResult();
        result.result = [];
        try {
            if (s3_helper.IsFolder(sourceKey)) {
                result.error = new Error(`Source is a folder: ${sourceKey}`);
                result.isSuccessful = false;
                return result;
            }
            const targetKey = s3_helper.GetParentFolderKey(sourceKey) + targetName + '.' + s3_helper.GetFileExtension(sourceKey);
            const moveResult = await this.moveObject(bucket, sourceKey, targetKey);
            result.result = moveResult.result;
            result.isSuccessful = moveResult.isSuccessful;
            result.error = moveResult.error;
            ui.logToOutput(`S3API.renameFile Success: ${sourceKey} → ${targetKey}`);
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            return result;
        }
    }
    /**
     * Rename a folder
     */
    async renameFolder(bucket, sourceKey, targetName) {
        const result = new MethodResult_1.MethodResult();
        result.result = [];
        try {
            if (s3_helper.IsFile(sourceKey)) {
                result.error = new Error(`Source is a file: ${sourceKey}`);
                result.isSuccessful = false;
                return result;
            }
            const targetFolderKey = s3_helper.GetParentFolderKey(sourceKey) + targetName + '/';
            const objectsResult = await this.getObjectList(bucket, sourceKey);
            if (objectsResult.isSuccessful && objectsResult.result) {
                for (const objectKey of objectsResult.result) {
                    const targetKey = objectKey.replace(sourceKey, targetFolderKey);
                    const moveResult = await this.moveFile(bucket, objectKey, targetKey);
                    if (moveResult.isSuccessful) {
                        result.result.push(targetKey);
                    }
                    else {
                        result.error = moveResult.error;
                        result.isSuccessful = false;
                        return result;
                    }
                }
            }
            result.isSuccessful = true;
            ui.logToOutput(`S3API.renameFolder Success: ${sourceKey} → ${targetFolderKey}`);
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            return result;
        }
    }
    // ==================== Download Operations ====================
    /**
     * Download an object (file or folder)
     */
    async downloadObject(bucket, key, targetPath) {
        if (s3_helper.IsFolder(key)) {
            return await this.downloadFolder(bucket, key, targetPath);
        }
        else {
            return await this.downloadFile(bucket, key, targetPath);
        }
    }
    /**
     * Download a folder from S3
     */
    async downloadFolder(bucket, key, targetPath) {
        const result = new MethodResult_1.MethodResult();
        try {
            const objectsResult = await this.getObjectList(bucket, key);
            if (objectsResult.isSuccessful && objectsResult.result) {
                for (const objectKey of objectsResult.result) {
                    if (s3_helper.IsFile(objectKey)) {
                        const downloadResult = await this.downloadFile(bucket, objectKey, targetPath);
                        if (!downloadResult.isSuccessful) {
                            throw downloadResult.error;
                        }
                    }
                }
            }
            result.result = targetPath;
            result.isSuccessful = true;
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage(`Failed to download folder: ${key}`, error);
            ui.logToOutput(`S3API.downloadFolder Error: ${key}`, error);
            return result;
        }
    }
    /**
     * Download a file from S3
     */
    async downloadFile(bucket, key, targetPath) {
        const result = new MethodResult_1.MethodResult();
        let fileName = s3_helper.GetFileNameWithExtension(key);
        fileName = ui.SanitizeFileName(fileName);
        const targetFilePath = (0, path_1.join)(targetPath, fileName);
        try {
            const s3 = await this.getS3Client();
            const params = {
                Bucket: bucket,
                Key: key,
            };
            const command = new client_s3_1.GetObjectCommand(params);
            const data = await s3.send(command);
            const readStream = data.Body;
            const writeStream = (0, fs_1.createWriteStream)(targetFilePath);
            readStream.pipe(writeStream);
            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
                readStream.on('error', reject);
            });
            ui.logToOutput(`S3API.downloadFile: ${key} → ${targetFilePath}`);
            result.result = targetFilePath;
            result.isSuccessful = true;
            return result;
        }
        catch (error) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage(`Failed to download file: ${key}`, error);
            ui.logToOutput(`S3API.downloadFile Error: ${key}`, error);
            return result;
        }
    }
}
exports.S3API = S3API;
//# sourceMappingURL=S3API.js.map