import * as vscode from 'vscode';
import * as ui from './common/UI';
import { Session } from './common/Session';
import { TreeView } from './tree/TreeView';
import { ServiceHub } from './tree/ServiceHub';
import { TreeState } from './tree/TreeState';
import { initializeLicense, isLicenseValid, promptForLicense, clearLicense } from "./common/License";


/**
 * Activates the AWS Workbench extension.
 * This is the entry point for the extension.
 */
export function activate(context: vscode.ExtensionContext): void {
    ui.logToOutput('Activating AWS Workbench...');

    try {
        initializeLicense(context);
        const session = new Session(context); // Initialize session management
        session.IsProVersion = isLicenseValid();
        new ServiceHub(context);    // Initialize service hub
        
        // 1. Initialize the Unified "Aws Workbench" Tree Provider
        new TreeView(context);

        // 2. Load saved tree state after TreeView is initialized
        TreeState.load();
        
        // 3. Refresh tree to display loaded nodes
        TreeView.Current.Refresh();

		vscode.commands.registerCommand('AwsWorkbench.ActivatePro', () => {
			if (Session.Current?.IsProVersion) {
				ui.showInfoMessage('You already have an active Pro license!');
				return;
			}

			let buyUrl = 'https://necatiarslan.lemonsqueezy.com/checkout/buy/0aa33140-6754-4a23-bc21-72b2d72ec9ad';
			if (Session.Current?.IsDebugMode()) {
				buyUrl = 'https://necatiarslan.lemonsqueezy.com/checkout/buy/8289ec8d-2343-4e8a-9a03-f398e54881ad';
			}

			vscode.env.openExternal(vscode.Uri.parse(buyUrl));
			vscode.commands.executeCommand('AwsWorkbench.EnterLicenseKey');
		}),

		vscode.commands.registerCommand('AwsWorkbench.EnterLicenseKey', async () => {
			if (Session.Current?.IsProVersion) {
				ui.showInfoMessage('You already have an active Pro license!');
				return;
			}

			await promptForLicense(context);
			if (Session.Current) {
				Session.Current.IsProVersion = isLicenseValid();
			}
		}),

		vscode.commands.registerCommand('AwsWorkbench.ResetLicenseKey', async () => {
			await clearLicense();
			ui.showInfoMessage('License key has been reset. Please enter a new license key to activate Pro features.');
			if (Session.Current) {
				Session.Current.IsProVersion = false;
			}
		}),

        ui.logToOutput('AWS Workbench activated successfully.');
    } catch (error) {
        ui.logToOutput('Fatal error activating AWS Workbench:', error as Error);
        ui.showInfoMessage('AWS Workbench failed to activate. Check debug console for details.');
    }
}



export function deactivate(): void {
    // Save tree state immediately before deactivation
    TreeState.saveImmediate();
}
