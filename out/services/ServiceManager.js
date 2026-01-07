"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceManager = void 0;
class ServiceManager {
    static _instance;
    services = new Map();
    constructor() { }
    static get Instance() {
        if (!this._instance) {
            this._instance = new ServiceManager();
        }
        return this._instance;
    }
    registerService(service) {
        this.services.set(service.serviceId, service);
    }
    getService(serviceId) {
        return this.services.get(serviceId);
    }
    getAllServices() {
        return Array.from(this.services.values());
    }
}
exports.ServiceManager = ServiceManager;
//# sourceMappingURL=ServiceManager.js.map