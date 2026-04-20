"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const ui = __importStar(require("./common/UI"));
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