/**
 * Base API for AWS Services
 * 
 * Provides common AWS client management and operations
 */

import * as ui from '../common/UI';
import { MethodResult } from '../common/MethodResult';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

export interface AWSClientConfig {
	region?: string;
	endpoint?: string;
	credentials?: AwsCredentialIdentity;
}

/**
 * Base class for all AWS service APIs
 */
export abstract class BaseAPI {
	protected currentCredentials?: AwsCredentialIdentity;
	protected currentRegion?: string;
	protected currentEndpoint?: string;

	/**
	 * Get AWS credentials using the standard credential chain
	 */
	protected async getCredentials(): Promise<AwsCredentialIdentity | undefined> {
		if (this.currentCredentials) {
			return this.currentCredentials;
		}

		try {
			ui.logToOutput('Loading AWS credentials...');
			
			const credentialProvider = fromNodeProviderChain();
			this.currentCredentials = await credentialProvider();
			
			ui.logToOutput('AWS credentials loaded successfully');
			return this.currentCredentials;
		} catch (error) {
			ui.logToOutput('Failed to load AWS credentials', error as Error);
			ui.showErrorMessage('Failed to load AWS credentials', error as Error);
			return undefined;
		}
	}

	/**
	 * Set custom endpoint (e.g., for LocalStack)
	 */
	public setEndpoint(endpoint?: string): void {
		this.currentEndpoint = endpoint;
		ui.logToOutput(`Endpoint set to: ${endpoint || 'default'}`);
		this.invalidateClients();
	}

	/**
	 * Get current endpoint
	 */
	public getEndpoint(): string | undefined {
		return this.currentEndpoint;
	}

	/**
	 * Set AWS region
	 */
	public setRegion(region: string): void {
		this.currentRegion = region;
		ui.logToOutput(`Region set to: ${region}`);
		this.invalidateClients();
	}

	/**
	 * Get current region
	 */
	public getRegion(): string {
		return this.currentRegion || process.env.AWS_REGION || 'us-east-1';
	}

	/**
	 * Get client configuration
	 */
	protected async getClientConfig(): Promise<AWSClientConfig> {
		const credentials = await this.getCredentials();
		
		const config: AWSClientConfig = {
			region: this.getRegion(),
			credentials,
		};

		if (this.currentEndpoint) {
			config.endpoint = this.currentEndpoint;
		}

		return config;
	}

	/**
	 * Invalidate all cached clients (to be implemented by subclasses)
	 */
	protected abstract invalidateClients(): void;

	/**
	 * Test connection to AWS (to be implemented by subclasses)
	 */
	public abstract testConnection(): Promise<MethodResult<boolean>>;

	/**
	 * Reset credentials and clients
	 */
	public reset(): void {
		this.currentCredentials = undefined;
		this.invalidateClients();
		ui.logToOutput('AWS API reset');
	}

	/**
	 * Parse AWS ARN
	 */
	protected parseArn(arn: string): {
		partition: string;
		service: string;
		region: string;
		accountId: string;
		resourceType?: string;
		resource: string;
	} | null {
		// ARN format: arn:partition:service:region:account-id:resource-type/resource-id
		// or: arn:partition:service:region:account-id:resource-type:resource-id
		const arnPattern = /^arn:([^:]+):([^:]+):([^:]*):([^:]*):(.+)$/;
		const match = arn.match(arnPattern);

		if (!match) {
			return null;
		}

		const [, partition, service, region, accountId, resourcePart] = match;

		// Parse resource part (can be resource-type/resource-id or resource-type:resource-id)
		const resourceMatch = resourcePart.match(/^([^:\/]+)[:\/](.+)$/) || resourcePart.match(/^(.+)$/);
		
		if (!resourceMatch) {
			return null;
		}

		return {
			partition,
			service,
			region,
			accountId,
			resourceType: resourceMatch[2] ? resourceMatch[1] : undefined,
			resource: resourceMatch[2] || resourceMatch[1],
		};
	}

	/**
	 * Build AWS ARN
	 */
	protected buildArn(
		service: string,
		resource: string,
		resourceType?: string,
		region?: string,
		accountId?: string
	): string {
		const partition = 'aws';
		const arnRegion = region || this.getRegion();
		const arnAccountId = accountId || '';

		if (resourceType) {
			return `arn:${partition}:${service}:${arnRegion}:${arnAccountId}:${resourceType}/${resource}`;
		} else {
			return `arn:${partition}:${service}:${arnRegion}:${arnAccountId}:${resource}`;
		}
	}
}
