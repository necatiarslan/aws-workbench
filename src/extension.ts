import * as vscode from 'vscode';

import { TreeProvider } from './tree/TreeProvider';
import { Session } from './common/Session';
import * as ui from './common/UI';
import { TreeView } from './tree/TreeView';

/**
 * Activates the AWS Workbench extension.
 * This is the entry point for the extension.
 */
export function activate(context: vscode.ExtensionContext): void {
    ui.logToOutput('Activating AWS Workbench...');

    try {
        new Session(context); // Initialize session management

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
