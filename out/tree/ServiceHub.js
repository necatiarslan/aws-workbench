"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceHub = void 0;
const FileSystemService_1 = require("../services/filesystem/FileSystemService");
class ServiceHub {
    static Current;
    FileSystemService = new FileSystemService_1.FileSystemService();
    constructor() {
        ServiceHub.Current = this;
    }
}
exports.ServiceHub = ServiceHub;
//# sourceMappingURL=ServiceHub.js.map