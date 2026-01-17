import * as vscode from 'vscode';
import * as ui from './common/UI';
import { Session } from './common/Session';
import { TreeView } from './tree/TreeView';
import { ServiceHub } from './tree/ServiceHub';

/**
 * Activates the AWS Workbench extension.
 * This is the entry point for the extension.
 */
export function activate(context: vscode.ExtensionContext): void {
    ui.logToOutput('Activating AWS Workbench...');

    try {
        new Session(context); // Initialize session management
        new ServiceHub();    // Initialize service hub
        // 1. Initialize the Unified "Aws Workbench" Tree Provider
        new TreeView(context);


        ui.logToOutput('AWS Workbench activated successfully.');
    } catch (error) {
        ui.logToOutput('Fatal error activating AWS Workbench:', error as Error);
        ui.showInfoMessage('AWS Workbench failed to activate. Check debug console for details.');
    }
}



export function deactivate(): void {
    // Cleanup is handled by context.subscriptions
}
