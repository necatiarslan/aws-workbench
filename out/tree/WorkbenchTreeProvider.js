"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkbenchTreeProvider = void 0;
const vscode = require("vscode");
const Session_1 = require("../common/Session");
class WorkbenchTreeProvider {
    context;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    folderFilter;
    resourceNameFilter;
    constructor(context) {
        this.context = context;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    setFolderFilter(folderId) {
        this.folderFilter = folderId;
        if (Session_1.Session.Current) {
            Session_1.Session.Current.folderFilter = folderId;
            Session_1.Session.Current.SaveState();
        }
        this.refresh();
    }
    setResourceNameFilter(pattern) {
        this.resourceNameFilter = pattern;
        if (Session_1.Session.Current) {
            Session_1.Session.Current.resourceNameFilter = pattern;
            Session_1.Session.Current.SaveState();
        }
        this.refresh();
    }
    clearFilters() {
        this.folderFilter = undefined;
        this.resourceNameFilter = undefined;
        if (Session_1.Session.Current) {
            Session_1.Session.Current.folderFilter = undefined;
            Session_1.Session.Current.resourceNameFilter = undefined;
            Session_1.Session.Current.SaveState();
        }
        this.refresh();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        // If no element is provided, return root-level folders and resources
        const result = [];
        return result;
    }
}
exports.WorkbenchTreeProvider = WorkbenchTreeProvider;
//# sourceMappingURL=WorkbenchTreeProvider.js.map