"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const ui = require("./common/UI");
const Session_1 = require("./common/Session");
const TreeView_1 = require("./tree/TreeView");
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
        // 2. Load saved tree state after TreeView is initialized
        TreeState_1.TreeState.load();
        // 3. Refresh tree to display loaded nodes
        TreeView_1.TreeView.Current.Refresh();
        vscode.commands.registerCommand('AwsWorkbench.ActivatePro', () => {
            if (Session_1.Session.Current?.IsProVersion) {
                ui.showInfoMessage('You already have an active Pro license!');
                return;
            }
            let buyUrl = 'https://necatiarslan.lemonsqueezy.com/checkout/buy/0aa33140-6754-4a23-bc21-72b2d72ec9ad';
            if (Session_1.Session.Current?.IsDebugMode()) {
                buyUrl = 'https://necatiarslan.lemonsqueezy.com/checkout/buy/8289ec8d-2343-4e8a-9a03-f398e54881ad';
            }
            vscode.env.openExternal(vscode.Uri.parse(buyUrl));
            vscode.commands.executeCommand('AwsWorkbench.EnterLicenseKey');
        }),
            vscode.commands.registerCommand('AwsWorkbench.EnterLicenseKey', async () => {
                if (Session_1.Session.Current?.IsProVersion) {
                    ui.showInfoMessage('You already have an active Pro license!');
                    return;
                }
                await (0, License_1.promptForLicense)(context);
                if (Session_1.Session.Current) {
                    Session_1.Session.Current.IsProVersion = (0, License_1.isLicenseValid)();
                }
            }),
            vscode.commands.registerCommand('AwsWorkbench.ResetLicenseKey', async () => {
                await (0, License_1.clearLicense)();
                ui.showInfoMessage('License key has been reset. Please enter a new license key to activate Pro features.');
                if (Session_1.Session.Current) {
                    Session_1.Session.Current.IsProVersion = false;
                }
            }),
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