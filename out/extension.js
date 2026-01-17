"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const ui = require("./common/UI");
const Session_1 = require("./common/Session");
const TreeView_1 = require("./tree/TreeView");
const ServiceHub_1 = require("./tree/ServiceHub");
/**
 * Activates the AWS Workbench extension.
 * This is the entry point for the extension.
 */
function activate(context) {
    ui.logToOutput('Activating AWS Workbench...');
    try {
        new Session_1.Session(context); // Initialize session management
        new ServiceHub_1.ServiceHub(context); // Initialize service hub
        // 1. Initialize the Unified "Aws Workbench" Tree Provider
        new TreeView_1.TreeView(context);
        ui.logToOutput('AWS Workbench activated successfully.');
    }
    catch (error) {
        ui.logToOutput('Fatal error activating AWS Workbench:', error);
        ui.showInfoMessage('AWS Workbench failed to activate. Check debug console for details.');
    }
}
function deactivate() {
    // Cleanup is handled by context.subscriptions
}
//# sourceMappingURL=extension.js.map