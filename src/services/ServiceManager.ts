import * as vscode from 'vscode';
import { IService } from './IService';

export class ServiceManager {
    private static _instance: ServiceManager;
    private services: Map<string, IService> = new Map();

    private constructor() {}

    public static get Instance(): ServiceManager {
        if (!this._instance) {
            this._instance = new ServiceManager();
        }
        return this._instance;
    }

    public registerService(service: IService) {
        this.services.set(service.serviceId, service);
    }

    public getService(serviceId: string): IService | undefined {
        return this.services.get(serviceId);
    }

    public getAllServices(): IService[] {
        return Array.from(this.services.values());
    }
}
