"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const ui = require("./common/UI");
const Session_1 = require("./common/Session");
const TreeView_1 = require("./tree/TreeView");
const ConnectionView_1 = require("./tree/ConnectionView");
const ServiceHub_1 = require("./tree/ServiceHub");
const TreeState_1 = require("./tree/TreeState");
const License_1 = require("./common/License");
/**
 * Activates the AWS Workbench extension.
 * This is the entry point for the extension.
 */
function activate(context) {
    ui.logToOutput('Activating AWS Workbench...');
    try {
        (0, License_1.initializeLicense)(context);
        const session = new Session_1.Session(context); // Initialize session management
        session.IsProVersion = (0, License_1.isLicenseValid)();
        new ServiceHub_1.ServiceHub(context); // Initialize service hub
        // 1. Initialize the Unified "Aws Workbench" Tree Provider
        new TreeView_1.TreeView(context);
        // 1.1 Initialize Aws Connection Tree Provider
        new ConnectionView_1.ConnectionView(context);
        // 2. Load saved tree state after TreeView is initialized
        TreeState_1.TreeState.load();
        // 3. Refresh tree to display loaded nodes
        TreeView_1.TreeView.Current.Refresh();
        // 4. Register commands after TreeView is ready
        (0, License_1.RegisterLicenseManagementCommands)();
        ui.logToOutput('AWS Workbench activated successfully.');
    }
    catch (error) {
        ui.logToOutput('Fatal error activating AWS Workbench:', error);
        ui.showInfoMessage('AWS Workbench failed to activate. Check debug console for details.');
    }
}
function deactivate() {
    // Save tree state immediately before deactivation
    TreeState_1.TreeState.saveImmediate();
}
//# sourceMappingURL=extension.js.map