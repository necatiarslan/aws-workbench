/**
 * S3 API Service
 * 
 * Handles all S3-specific API operations
 */

import { BaseAPI } from '../core/BaseAPI';
import { MethodResult } from '../common/MethodResult';
import * as ui from '../common/UI';
import * as s3_helper from './S3Helper';
import * as fs from 'fs';
import { join } from 'path';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';

import {
	S3Client,
	ListObjectsV2Command,
	ListObjectsV2CommandOutput,
	HeadObjectCommand,
	HeadObjectCommandOutput,
	_Object,
	PutObjectCommand,
	DeleteObjectCommand,
	CopyObjectCommand,
	GetObjectCommand,
	ListBucketsCommand,
	HeadBucketCommand,
} from '@aws-sdk/client-s3';

/**
 * S3 API class extending BaseAPI
 */
export class S3API extends BaseAPI {
	private s3Client?: S3Client;
	private awsProfile?: string;
	private awsEndpoint?: string;
	private awsRegion?: string;

	/**
	 * Get or create S3 client
	 */
	private async getS3Client(): Promise<S3Client> {
		if (this.s3Client) {
			return this.s3Client;
		}

		const credentials = await this.getCredentials();
		const config = await this.getClientConfig();

		this.s3Client = new S3Client({
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
	protected invalidateClients(): void {
		this.s3Client = undefined;
	}

	/**
	 * Set AWS profile
	 */
	public setProfile(profile: string): void {
		this.awsProfile = profile;
		process.env.AWS_PROFILE = profile;
		this.invalidateClients();
	}

	/**
	 * Override setEndpoint to also update local endpoint
	 */
	public override setEndpoint(endpoint?: string): void {
		super.setEndpoint(endpoint);
		this.awsEndpoint = endpoint;
	}

	/**
	 * Override setRegion to also update local region
	 */
	public override setRegion(region: string): void {
		super.setRegion(region);
		this.awsRegion = region;
	}

	/**
	 * Test S3 connection
	 */
	public async testConnection(): Promise<MethodResult<boolean>> {
		const result = new MethodResult<boolean>();

		try {
			const s3 = await this.getS3Client();
			const command = new ListBucketsCommand({});
			await s3.send(command);

			result.isSuccessful = true;
			result.result = true;
			ui.logToOutput('S3 connection test successful');
			return result;
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.logToOutput('S3 connection test failed', error as Error);
			return result;
		}
	}

	// ==================== Bucket Operations ====================

	/**
	 * Get list of S3 buckets
	 */
	public async getBucketList(bucketName?: string): Promise<MethodResult<string[]>> {
		const result = new MethodResult<string[]>();
		result.result = [];

		try {
			const s3 = await this.getS3Client();

			// If specific bucket name provided, check if it exists
			if (bucketName) {
				try {
					const command = new HeadBucketCommand({ Bucket: bucketName });
					await s3.send(command);
					result.result.push(bucketName);
					result.isSuccessful = true;
					return result;
				} catch {
					// Bucket doesn't exist, fall through to list all
				}
			}

			// List all buckets
			const command = new ListBucketsCommand({});
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
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.showErrorMessage('Failed to get bucket list', error as Error);
			ui.logToOutput('S3API.getBucketList Error', error as Error);
			return result;
		}
	}

	// ==================== Object Listing ====================

	/**
	 * Get folder listing from S3
	 */
	public async getFolderList(bucket: string, key: string): Promise<MethodResult<ListObjectsV2CommandOutput>> {
		const result = new MethodResult<ListObjectsV2CommandOutput>();

		try {
			const s3 = await this.getS3Client();

			const params = {
				Bucket: bucket,
				Prefix: key,
				Delimiter: '/',
			};

			const command = new ListObjectsV2Command(params);
			const response = await s3.send(command);

			result.isSuccessful = true;
			result.result = response;
			return result;
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.showErrorMessage('Failed to get folder list', error as Error);
			ui.logToOutput('S3API.getFolderList Error', error as Error);
			return result;
		}
	}

	/**
	 * Get all objects in a prefix
	 */
	public async getObjectList(bucket: string, key: string): Promise<MethodResult<string[]>> {
		const result = new MethodResult<string[]>();
		const keys: string[] = [];
		let continuationToken: string | undefined;

		try {
			const s3 = await this.getS3Client();

			do {
				const params = { Bucket: bucket, Prefix: key, ContinuationToken: continuationToken };
				const command = new ListObjectsV2Command(params);
				const response = await s3.send(command);
				continuationToken = response.NextContinuationToken;
				response.Contents?.forEach((file) => keys.push(file.Key!));
			} while (continuationToken);

			result.isSuccessful = true;
			result.result = keys;
			return result;
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.showErrorMessage('Failed to get object list', error as Error);
			ui.logToOutput('S3API.getObjectList Error', error as Error);
			return result;
		}
	}

	/**
	 * Get object properties
	 */
	public async getObjectProperties(bucket: string, key: string): Promise<MethodResult<HeadObjectCommandOutput>> {
		const result = new MethodResult<HeadObjectCommandOutput>();

		try {
			const s3 = await this.getS3Client();
			const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
			const response = await s3.send(command);
			result.isSuccessful = true;
			result.result = response;
			return result;
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.showErrorMessage('Failed to get object properties', error as Error);
			ui.logToOutput('S3API.getObjectProperties Error', error as Error);
			return result;
		}
	}

	// ==================== Search Operations ====================

	/**
	 * Search for objects in S3
	 */
	public async searchObject(
		bucket: string,
		prefixKey: string,
		fileName?: string,
		fileExtension?: string,
		folderName?: string,
		maxResultCount: number = 100
	): Promise<MethodResult<_Object[] | undefined>> {
		const result = new MethodResult<_Object[] | undefined>();
		result.result = [];

		const searchFileName = fileName?.toLowerCase();
		const searchExtension = fileExtension?.toLowerCase();
		const searchFolderName = folderName?.toLowerCase();

		try {
			const s3 = await this.getS3Client();
			let continuationToken: string | undefined;

			do {
				const params = {
					Bucket: bucket,
					Prefix: prefixKey,
					ContinuationToken: continuationToken,
					MaxKeys: 100,
				};

				const command = new ListObjectsV2Command(params);
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
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.showErrorMessage('Search failed', error as Error);
			ui.logToOutput('S3API.searchObject Error', error as Error);
			return result;
		}
	}

	// ==================== Create Operations ====================

	/**
	 * Create a folder in S3
	 */
	public async createFolder(bucket: string, key: string, folderName: string): Promise<MethodResult<string>> {
		const result = new MethodResult<string>();
		const targetKey = `${key}${folderName}/`;

		try {
			const s3 = await this.getS3Client();
			const param = { Bucket: bucket, Key: targetKey };
			const command = new PutObjectCommand(param);
			await s3.send(command);
			result.isSuccessful = true;
			result.result = targetKey;
			ui.logToOutput(`S3API.createFolder Success: ${targetKey}`);
			return result;
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.showErrorMessage('Failed to create folder', error as Error);
			ui.logToOutput('S3API.createFolder Error', error as Error);
			return result;
		}
	}

	// ==================== Delete Operations ====================

	/**
	 * Delete an object (file or folder)
	 */
	public async deleteObject(bucket: string, key: string): Promise<MethodResult<string[]>> {
		const result = new MethodResult<string[]>();
		result.result = [];

		try {
			if (s3_helper.IsFolder(key)) {
				return await this.deleteFolder(bucket, key);
			} else {
				return await this.deleteFile(bucket, key);
			}
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.showErrorMessage(`Failed to delete: ${key}`, error as Error);
			ui.logToOutput(`S3API.deleteObject Error: ${key}`, error as Error);
			return result;
		}
	}

	/**
	 * Delete a file from S3
	 */
	public async deleteFile(bucket: string, key: string): Promise<MethodResult<string[]>> {
		const result = new MethodResult<string[]>();
		result.result = [];

		try {
			const s3 = await this.getS3Client();
			const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
			await s3.send(command);
			result.result.push(key);
			result.isSuccessful = true;
			ui.logToOutput(`S3API.deleteFile Success: ${key}`);
			return result;
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.showErrorMessage(`Failed to delete file: ${key}`, error as Error);
			ui.logToOutput(`S3API.deleteFile Error: ${key}`, error as Error);
			return result;
		}
	}

	/**
	 * Delete a folder from S3
	 */
	public async deleteFolder(bucket: string, key: string): Promise<MethodResult<string[]>> {
		const result = new MethodResult<string[]>();
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
					} else {
						throw deleteResult.error;
					}
				}
			}

			result.isSuccessful = true;
			ui.logToOutput(`S3API.deleteFolder Success: ${key}`);
			return result;
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.showErrorMessage(`Failed to delete folder: ${key}`, error as Error);
			ui.logToOutput(`S3API.deleteFolder Error: ${key}`, error as Error);
			return result;
		}
	}

	// ==================== Upload Operations ====================

	/**
	 * Upload a file to a folder
	 */
	public async uploadFileToFolder(bucket: string, folderKey: string, sourcePath: string): Promise<MethodResult<string>> {
		const targetKey = `${folderKey}${s3_helper.GetFileNameWithExtension(sourcePath)}`;
		return this.uploadFile(bucket, targetKey, sourcePath);
	}

	/**
	 * Upload a file to S3
	 */
	public async uploadFile(bucket: string, targetKey: string, sourcePath: string): Promise<MethodResult<string>> {
		const result = new MethodResult<string>();

		try {
			const s3 = await this.getS3Client();
			const stream = fs.createReadStream(sourcePath);

			const param = {
				Bucket: bucket,
				Key: targetKey,
				Body: stream,
			};

			const command = new PutObjectCommand(param);
			await s3.send(command);

			result.result = targetKey;
			result.isSuccessful = true;
			ui.logToOutput(`S3API.uploadFile Success: ${targetKey}`);
			return result;
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.showErrorMessage(`Failed to upload file: ${sourcePath}`, error as Error);
			ui.logToOutput(`S3API.uploadFile Error: ${sourcePath}`, error as Error);
			return result;
		}
	}

	// ==================== Copy Operations ====================

	/**
	 * Copy an object (file or folder)
	 */
	public async copyObject(bucket: string, sourceKey: string, targetKey: string): Promise<MethodResult<string[]>> {
		const result = new MethodResult<string[]>();
		result.result = [];

		try {
			if (s3_helper.IsFolder(sourceKey)) {
				return await this.copyFolder(bucket, sourceKey, targetKey);
			} else {
				return await this.copyFile(bucket, sourceKey, targetKey);
			}
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.showErrorMessage(`Failed to copy: ${sourceKey}`, error as Error);
			ui.logToOutput(`S3API.copyObject Error: ${sourceKey}`, error as Error);
			return result;
		}
	}

	/**
	 * Copy a file
	 */
	public async copyFile(bucket: string, sourceKey: string, targetKey: string): Promise<MethodResult<string[]>> {
		const result = new MethodResult<string[]>();
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

			const command = new CopyObjectCommand(params);
			await s3.send(command);

			ui.logToOutput(`S3API.copyFile: ${sourceKey} → ${finalTargetKey}`);
			result.result.push(finalTargetKey);
			result.isSuccessful = true;
			return result;
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.showErrorMessage(`Failed to copy file: ${sourceKey}`, error as Error);
			ui.logToOutput(`S3API.copyFile Error: ${sourceKey}`, error as Error);
			return result;
		}
	}

	/**
	 * Copy a folder
	 */
	public async copyFolder(bucket: string, sourceKey: string, targetKey: string): Promise<MethodResult<string[]>> {
		const result = new MethodResult<string[]>();
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
					} else {
						throw copyResult.error;
					}
				}
			}

			result.isSuccessful = true;
			return result;
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.showErrorMessage(`Failed to copy folder: ${sourceKey}`, error as Error);
			ui.logToOutput(`S3API.copyFolder Error: ${sourceKey}`, error as Error);
			return result;
		}
	}

	// ==================== Move Operations ====================

	/**
	 * Move an object (file or folder)
	 */
	public async moveObject(bucket: string, sourceKey: string, targetKey: string): Promise<MethodResult<string[]>> {
		const result = new MethodResult<string[]>();
		result.result = [];

		try {
			if (sourceKey === targetKey) {
				result.isSuccessful = false;
				result.error = new Error(`Source and target are the same: ${sourceKey}`);
				return result;
			}

			if (s3_helper.IsFolder(sourceKey)) {
				return await this.moveFolder(bucket, sourceKey, targetKey);
			} else {
				return await this.moveFile(bucket, sourceKey, targetKey);
			}
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.showErrorMessage(`Failed to move: ${sourceKey}`, error as Error);
			ui.logToOutput(`S3API.moveObject Error: ${sourceKey}`, error as Error);
			return result;
		}
	}

	/**
	 * Move a file
	 */
	public async moveFile(bucket: string, sourceKey: string, targetKey: string): Promise<MethodResult<string[]>> {
		const result = new MethodResult<string[]>();
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
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			return result;
		}
	}

	/**
	 * Move a folder
	 */
	public async moveFolder(bucket: string, sourceKey: string, targetKey: string): Promise<MethodResult<string[]>> {
		const result = new MethodResult<string[]>();
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
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			return result;
		}
	}

	// ==================== Rename Operations ====================

	/**
	 * Rename an object (file or folder)
	 */
	public async renameObject(bucket: string, sourceKey: string, targetName: string): Promise<MethodResult<string[]>> {
		if (s3_helper.IsFolder(sourceKey)) {
			return await this.renameFolder(bucket, sourceKey, targetName);
		} else {
			return await this.renameFile(bucket, sourceKey, targetName);
		}
	}

	/**
	 * Rename a file
	 */
	public async renameFile(bucket: string, sourceKey: string, targetName: string): Promise<MethodResult<string[]>> {
		const result = new MethodResult<string[]>();
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
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			return result;
		}
	}

	/**
	 * Rename a folder
	 */
	public async renameFolder(bucket: string, sourceKey: string, targetName: string): Promise<MethodResult<string[]>> {
		const result = new MethodResult<string[]>();
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
					} else {
						result.error = moveResult.error;
						result.isSuccessful = false;
						return result;
					}
				}
			}

			result.isSuccessful = true;
			ui.logToOutput(`S3API.renameFolder Success: ${sourceKey} → ${targetFolderKey}`);
			return result;
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			return result;
		}
	}

	// ==================== Download Operations ====================

	/**
	 * Download an object (file or folder)
	 */
	public async downloadObject(bucket: string, key: string, targetPath: string): Promise<MethodResult<string>> {
		if (s3_helper.IsFolder(key)) {
			return await this.downloadFolder(bucket, key, targetPath);
		} else {
			return await this.downloadFile(bucket, key, targetPath);
		}
	}

	/**
	 * Download a folder from S3
	 */
	public async downloadFolder(bucket: string, key: string, targetPath: string): Promise<MethodResult<string>> {
		const result = new MethodResult<string>();

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
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.showErrorMessage(`Failed to download folder: ${key}`, error as Error);
			ui.logToOutput(`S3API.downloadFolder Error: ${key}`, error as Error);
			return result;
		}
	}

	/**
	 * Download a file from S3
	 */
	public async downloadFile(bucket: string, key: string, targetPath: string): Promise<MethodResult<string>> {
		const result = new MethodResult<string>();
		let fileName = s3_helper.GetFileNameWithExtension(key);
		fileName = ui.SanitizeFileName(fileName);
		const targetFilePath = join(targetPath, fileName);

		try {
			const s3 = await this.getS3Client();

			const params = {
				Bucket: bucket,
				Key: key,
			};

			const command = new GetObjectCommand(params);
			const data = await s3.send(command);

			const readStream: Readable = data.Body as Readable;
			const writeStream = createWriteStream(targetFilePath);
			readStream.pipe(writeStream);

			await new Promise<void>((resolve, reject) => {
				writeStream.on('finish', resolve);
				writeStream.on('error', reject);
				readStream.on('error', reject);
			});

			ui.logToOutput(`S3API.downloadFile: ${key} → ${targetFilePath}`);
			result.result = targetFilePath;
			result.isSuccessful = true;
			return result;
		} catch (error) {
			result.isSuccessful = false;
			result.error = error as Error;
			ui.showErrorMessage(`Failed to download file: ${key}`, error as Error);
			ui.logToOutput(`S3API.downloadFile Error: ${key}`, error as Error);
			return result;
		}
	}
}

