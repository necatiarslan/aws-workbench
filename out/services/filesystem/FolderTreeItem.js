"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderTreeItem = void 0;
const TreeItemBase_1 = require("../../tree/TreeItemBase");
class FolderTreeItem extends TreeItemBase_1.TreeItemBase {
    constructor(FolderName, parent) {
        super(FolderName, parent);
        this.Icon = "folder";
        this.FolderName = FolderName;
    }
    FolderName = "";
}
exports.FolderTreeItem = FolderTreeItem;
//# sourceMappingURL=FolderTreeItem.js.map