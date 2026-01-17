import * as vscode from 'vscode';

import { WorkbenchTreeProvider } from './tree/WorkbenchTreeProvider';
import { Session } from './common/Session';

/**
 * Activates the AWS Workbench extension.
 * This is the entry point for the extension.
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('Activating AWS Workbench...');

    try {
        new Session(context); // Initialize session management

        // 1. Initialize the Unified "Aws Workbench" Tree Provider
        const treeProvider = new WorkbenchTreeProvider(context);
        const treeView = vscode.window.createTreeView('AwsWorkbenchTree', { 
            treeDataProvider: treeProvider,
            showCollapseAll: true 
        });
        context.subscriptions.push(treeView);

        console.log('AWS Workbench activated successfully.');
    } catch (error) {
        console.error('Fatal error activating AWS Workbench:', error);
        vscode.window.showErrorMessage('AWS Workbench failed to activate. Check debug console for details.');
    }
}



export function deactivate(): void {
    // Cleanup is handled by context.subscriptions
}
