"use strict";
/* eslint-disable @typescript-eslint/naming-convention */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeItemType = void 0;
/**
 * Consolidated TreeItemType enum for all AWS services in the workbench.
 * Each type is prefixed with the service name for clarity and to avoid conflicts.
 */
var TreeItemType;
(function (TreeItemType) {
    // S3 Service
    TreeItemType[TreeItemType["S3Bucket"] = 1] = "S3Bucket";
    TreeItemType[TreeItemType["S3Shortcut"] = 2] = "S3Shortcut";
})(TreeItemType || (exports.TreeItemType = TreeItemType = {}));
//# sourceMappingURL=TreeItemType.js.map