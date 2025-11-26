"use strict";
/**
 * Service Registry for AWS Workbench
 *
 * Central registry for all AWS service implementations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRegistry = void 0;
/**
 * Registry for AWS services
 */
class ServiceRegistry {
    static services = new Map();
    /**
     * Register a service
     */
    static register(serviceConstructor) {
        const { id } = serviceConstructor.metadata;
        if (this.services.has(id)) {
            throw new Error(`Service "${id}" is already registered`);
        }
        this.services.set(id, serviceConstructor);
    }
    /**
     * Unregister a service
     */
    static unregister(serviceId) {
        return this.services.delete(serviceId);
    }
    /**
     * Get a service constructor
     */
    static get(serviceId) {
        return this.services.get(serviceId);
    }
    /**
     * Get all registered services
     */
    static getAll() {
        return Array.from(this.services.values());
    }
    /**
     * Get all enabled services
     */
    static getEnabled() {
        return Array.from(this.services.values())
            .filter(service => service.metadata.enabled);
    }
    /**
     * Get service metadata
     */
    static getMetadata(serviceId) {
        const service = this.services.get(serviceId);
        return service?.metadata;
    }
    /**
     * Get all service metadata
     */
    static getAllMetadata() {
        return Array.from(this.services.values())
            .map(service => service.metadata);
    }
    /**
     * Check if a service is registered
     */
    static has(serviceId) {
        return this.services.has(serviceId);
    }
    /**
     * Get service by resource type
     */
    static getByResourceType(resourceType) {
        return Array.from(this.services.values())
            .find(service => service.metadata.resourceType === resourceType);
    }
    /**
     * Clear all services (useful for testing)
     */
    static clear() {
        this.services.clear();
    }
    /**
     * Get service count
     */
    static count() {
        return this.services.size;
    }
}
exports.ServiceRegistry = ServiceRegistry;
//# sourceMappingURL=ServiceRegistry.js.map