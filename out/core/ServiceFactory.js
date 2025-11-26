"use strict";
/**
 * Service Factory for AWS Workbench
 *
 * Factory for creating and managing service instances
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceFactory = void 0;
const ServiceRegistry_1 = require("./ServiceRegistry");
const ui = require("../common/UI");
/**
 * Factory for creating service instances
 */
class ServiceFactory {
    static instances = new Map();
    static context;
    /**
     * Initialize the factory with extension context
     */
    static initialize(context) {
        this.context = context;
        ui.logToOutput('Service Factory initialized');
    }
    /**
     * Create or get a service instance
     */
    static getOrCreate(serviceId) {
        // Check if instance already exists
        if (this.instances.has(serviceId)) {
            return this.instances.get(serviceId);
        }
        // Get service constructor from registry
        const serviceConstructor = ServiceRegistry_1.ServiceRegistry.get(serviceId);
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
        }
        catch (error) {
            ui.logToOutput(`Failed to create service "${serviceId}": ${error}`, error);
            return undefined;
        }
    }
    /**
     * Get a service instance (without creating)
     */
    static get(serviceId) {
        return this.instances.get(serviceId);
    }
    /**
     * Get all service instances
     */
    static getAll() {
        return Array.from(this.instances.values());
    }
    /**
     * Create all registered enabled services
     */
    static createAll() {
        const services = [];
        const enabledServices = ServiceRegistry_1.ServiceRegistry.getEnabled();
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
    static destroy(serviceId) {
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
    static destroyAll() {
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
    static has(serviceId) {
        return this.instances.has(serviceId);
    }
    /**
     * Get instance count
     */
    static count() {
        return this.instances.size;
    }
    /**
     * Refresh all service instances
     */
    static refreshAll() {
        for (const instance of this.instances.values()) {
            instance.refresh();
        }
        ui.logToOutput('All service instances refreshed');
    }
}
exports.ServiceFactory = ServiceFactory;
//# sourceMappingURL=ServiceFactory.js.map