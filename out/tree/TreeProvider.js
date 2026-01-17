"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeProvider = void 0;
class TreeProvider {
    context;
    constructor(context) {
        this.context = context;
    }
    getTreeItem(node) {
        return node;
    }
    async getChildren(node) {
        const result = [];
        return result;
    }
}
exports.TreeProvider = TreeProvider;
//# sourceMappingURL=TreeProvider.js.map