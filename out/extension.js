"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const WorkbenchTreeProvider_1 = require("./tree/WorkbenchTreeProvider");
const Session_1 = require("./common/Session");
/**
 * Activates the AWS Workbench extension.
 * This is the entry point for the extension.
 */
function activate(context) {
    console.log('Activating AWS Workbench...');
    try {
        new Session_1.Session(context); // Initialize session management
        // 1. Initialize the Unified "Aws Workbench" Tree Provider
        const treeProvider = new WorkbenchTreeProvider_1.WorkbenchTreeProvider(context);
        const treeView = vscode.window.createTreeView('AwsWorkbenchTree', {
            treeDataProvider: treeProvider,
            showCollapseAll: true
        });
        context.subscriptions.push(treeView);
        console.log('AWS Workbench activated successfully.');
    }
    catch (error) {
        console.error('Fatal error activating AWS Workbench:', error);
        vscode.window.showErrorMessage('AWS Workbench failed to activate. Check debug console for details.');
    }
}
function deactivate() {
    // Cleanup is handled by context.subscriptions
}
//# sourceMappingURL=extension.js.map