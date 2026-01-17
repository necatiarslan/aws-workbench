"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeProvider = void 0;
class TreeProvider {
    context;
    constructor(context) {
        this.context = context;
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        const result = [];
        return result;
    }
}
exports.TreeProvider = TreeProvider;
//# sourceMappingURL=TreeProvider.js.map