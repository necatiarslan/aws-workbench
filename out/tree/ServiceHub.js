"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceHub = void 0;
const FileSystemService_1 = require("../services/filesystem/FileSystemService");
class ServiceHub {
    static Current;
    Context;
    FileSystemService = new FileSystemService_1.FileSystemService();
    constructor(context) {
        this.Context = context;
        ServiceHub.Current = this;
        this.LoadNodesState();
    }
    async SaveNodesState() {
        // this.Context.globalState.update('Nodes', NodeBase.RootNodes);
    }
    LoadNodesState() {
        // const nodes: NodeBase[] | undefined = this.Context.globalState.get('Nodes');
        // // if (nodes) {
        // //     NodeBase.RootNodes = nodes;
        // // }
    }
}
exports.ServiceHub = ServiceHub;
//# sourceMappingURL=ServiceHub.js.map