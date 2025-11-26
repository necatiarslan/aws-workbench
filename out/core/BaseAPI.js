"use strict";
/**
 * Base API for AWS Services
 *
 * Provides common AWS client management and operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAPI = void 0;
const ui = require("../common/UI");
const credential_providers_1 = require("@aws-sdk/credential-providers");
/**
 * Base class for all AWS service APIs
 */
class BaseAPI {
    currentCredentials;
    currentRegion;
    currentEndpoint;
    /**
     * Get AWS credentials using the standard credential chain
     */
    async getCredentials() {
        if (this.currentCredentials) {
            return this.currentCredentials;
        }
        try {
            ui.logToOutput('Loading AWS credentials...');
            const credentialProvider = (0, credential_providers_1.fromNodeProviderChain)();
            this.currentCredentials = await credentialProvider();
            ui.logToOutput('AWS credentials loaded successfully');
            return this.currentCredentials;
        }
        catch (error) {
            ui.logToOutput('Failed to load AWS credentials', error);
            ui.showErrorMessage('Failed to load AWS credentials', error);
            return undefined;
        }
    }
    /**
     * Set custom endpoint (e.g., for LocalStack)
     */
    setEndpoint(endpoint) {
        this.currentEndpoint = endpoint;
        ui.logToOutput(`Endpoint set to: ${endpoint || 'default'}`);
        this.invalidateClients();
    }
    /**
     * Get current endpoint
     */
    getEndpoint() {
        return this.currentEndpoint;
    }
    /**
     * Set AWS region
     */
    setRegion(region) {
        this.currentRegion = region;
        ui.logToOutput(`Region set to: ${region}`);
        this.invalidateClients();
    }
    /**
     * Get current region
     */
    getRegion() {
        return this.currentRegion || process.env.AWS_REGION || 'us-east-1';
    }
    /**
     * Get client configuration
     */
    async getClientConfig() {
        const credentials = await this.getCredentials();
        const config = {
            region: this.getRegion(),
            credentials,
        };
        if (this.currentEndpoint) {
            config.endpoint = this.currentEndpoint;
        }
        return config;
    }
    /**
     * Reset credentials and clients
     */
    reset() {
        this.currentCredentials = undefined;
        this.invalidateClients();
        ui.logToOutput('AWS API reset');
    }
    /**
     * Parse AWS ARN
     */
    parseArn(arn) {
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
    buildArn(service, resource, resourceType, region, accountId) {
        const partition = 'aws';
        const arnRegion = region || this.getRegion();
        const arnAccountId = accountId || '';
        if (resourceType) {
            return `arn:${partition}:${service}:${arnRegion}:${arnAccountId}:${resourceType}/${resource}`;
        }
        else {
            return `arn:${partition}:${service}:${arnRegion}:${arnAccountId}:${resource}`;
        }
    }
}
exports.BaseAPI = BaseAPI;
//# sourceMappingURL=BaseAPI.js.map