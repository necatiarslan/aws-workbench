"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderNode = void 0;
const NodeBase_1 = require("../../tree/NodeBase");
class FolderNode extends NodeBase_1.NodeBase {
    constructor(FolderName, parent) {
        super(FolderName, parent);
        this.Icon = "folder";
        this.FolderName = FolderName;
    }
    FolderName = "";
}
exports.FolderNode = FolderNode;
//# sourceMappingURL=FolderNode%20copy.js.map