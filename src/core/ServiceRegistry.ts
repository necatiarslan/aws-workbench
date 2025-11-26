/**
 * Service Registry for AWS Workbench
 * 
 * Central registry for all AWS service implementations
 */

import * as vscode from 'vscode';
import { BaseTreeView } from './tree/BaseTreeView';
import { ResourceType } from './tree/BaseTreeItem';

export interface ServiceMetadata {
	id: string;
	name: string;
	displayName: string;
	description: string;
	resourceType: ResourceType;
	icon: vscode.ThemeIcon | string;
	enabled: boolean;
}

export interface ServiceConstructor {
	create(context: vscode.ExtensionContext): BaseTreeView;
	metadata: ServiceMetadata;
}

/**
 * Registry for AWS services
 */
export class ServiceRegistry {
	private static services: Map<string, ServiceConstructor> = new Map();

	/**
	 * Register a service
	 */
	public static register(serviceConstructor: ServiceConstructor): void {
		const { id } = serviceConstructor.metadata;
		
		if (this.services.has(id)) {
			throw new Error(`Service "${id}" is already registered`);
		}

		this.services.set(id, serviceConstructor);
	}

	/**
	 * Unregister a service
	 */
	public static unregister(serviceId: string): boolean {
		return this.services.delete(serviceId);
	}

	/**
	 * Get a service constructor
	 */
	public static get(serviceId: string): ServiceConstructor | undefined {
		return this.services.get(serviceId);
	}

	/**
	 * Get all registered services
	 */
	public static getAll(): ServiceConstructor[] {
		return Array.from(this.services.values());
	}

	/**
	 * Get all enabled services
	 */
	public static getEnabled(): ServiceConstructor[] {
		return Array.from(this.services.values())
			.filter(service => service.metadata.enabled);
	}

	/**
	 * Get service metadata
	 */
	public static getMetadata(serviceId: string): ServiceMetadata | undefined {
		const service = this.services.get(serviceId);
		return service?.metadata;
	}

	/**
	 * Get all service metadata
	 */
	public static getAllMetadata(): ServiceMetadata[] {
		return Array.from(this.services.values())
			.map(service => service.metadata);
	}

	/**
	 * Check if a service is registered
	 */
	public static has(serviceId: string): boolean {
		return this.services.has(serviceId);
	}

	/**
	 * Get service by resource type
	 */
	public static getByResourceType(resourceType: ResourceType): ServiceConstructor | undefined {
		return Array.from(this.services.values())
			.find(service => service.metadata.resourceType === resourceType);
	}

	/**
	 * Clear all services (useful for testing)
	 */
	public static clear(): void {
		this.services.clear();
	}

	/**
	 * Get service count
	 */
	public static count(): number {
		return this.services.size;
	}
}
