/**
 * Service Factory for AWS Workbench
 * 
 * Factory for creating and managing service instances
 */

import * as vscode from 'vscode';
import { BaseTreeView } from './tree/BaseTreeView';
import { ServiceRegistry } from './ServiceRegistry';
import * as ui from '../common/UI';

/**
 * Factory for creating service instances
 */
export class ServiceFactory {
	private static instances: Map<string, BaseTreeView> = new Map();
	private static context: vscode.ExtensionContext;

	/**
	 * Initialize the factory with extension context
	 */
	public static initialize(context: vscode.ExtensionContext): void {
		this.context = context;
		ui.logToOutput('Service Factory initialized');
	}

	/**
	 * Create or get a service instance
	 */
	public static getOrCreate(serviceId: string): BaseTreeView | undefined {
		// Check if instance already exists
		if (this.instances.has(serviceId)) {
			return this.instances.get(serviceId);
		}

		// Get service constructor from registry
		const serviceConstructor = ServiceRegistry.get(serviceId);
		if (!serviceConstructor) {
			ui.logToOutput(`Service "${serviceId}" not found in registry`);
			return undefined;
		}

		// Check if service is enabled
		if (!serviceConstructor.metadata.enabled) {
			ui.logToOutput(`Service "${serviceId}" is disabled`);
			return undefined;
		}

		try {
			// Create new instance
			ui.logToOutput(`Creating service instance: ${serviceId}`);
			const instance = serviceConstructor.create(this.context);
			this.instances.set(serviceId, instance);
			
			ui.logToOutput(`Service instance created: ${serviceId}`);
			return instance;
		} catch (error) {
			ui.logToOutput(`Failed to create service "${serviceId}": ${error}`, error as Error);
			return undefined;
		}
	}

	/**
	 * Get a service instance (without creating)
	 */
	public static get(serviceId: string): BaseTreeView | undefined {
		return this.instances.get(serviceId);
	}

	/**
	 * Get all service instances
	 */
	public static getAll(): BaseTreeView[] {
		return Array.from(this.instances.values());
	}

	/**
	 * Create all registered enabled services
	 */
	public static createAll(): BaseTreeView[] {
		const services: BaseTreeView[] = [];
		const enabledServices = ServiceRegistry.getEnabled();

		for (const serviceConstructor of enabledServices) {
			const instance = this.getOrCreate(serviceConstructor.metadata.id);
			if (instance) {
				services.push(instance);
			}
		}

		ui.logToOutput(`Created ${services.length} service instances`);
		return services;
	}

	/**
	 * Destroy a service instance
	 */
	public static destroy(serviceId: string): boolean {
		const instance = this.instances.get(serviceId);
		if (instance) {
			instance.dispose();
			this.instances.delete(serviceId);
			ui.logToOutput(`Service instance destroyed: ${serviceId}`);
			return true;
		}
		return false;
	}

	/**
	 * Destroy all service instances
	 */
	public static destroyAll(): void {
		for (const [serviceId, instance] of this.instances) {
			instance.dispose();
			ui.logToOutput(`Service instance destroyed: ${serviceId}`);
		}
		this.instances.clear();
		ui.logToOutput('All service instances destroyed');
	}

	/**
	 * Check if a service instance exists
	 */
	public static has(serviceId: string): boolean {
		return this.instances.has(serviceId);
	}

	/**
	 * Get instance count
	 */
	public static count(): number {
		return this.instances.size;
	}

	/**
	 * Refresh all service instances
	 */
	public static refreshAll(): void {
		for (const instance of this.instances.values()) {
			instance.refresh();
		}
		ui.logToOutput('All service instances refreshed');
	}
}
