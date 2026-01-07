/**
 * Handles messages received from the Workflow Studio webview
 */

import * as vscode from 'vscode';
import { Message, Command, MessageType, WebviewContext } from './types';
import * as ui from '../../common/UI';

/**
 * Handles messages from the webview
 * @param message The message received from the webview
 * @param context The webview context
 */
export async function handleMessage(message: Message, context: WebviewContext): Promise<void> {
    const { command, messageType } = message;

    if (messageType === MessageType.REQUEST) {
        switch (command) {
            case Command.INIT:
                handleInitMessage(context);
                break;
            case Command.CLOSE:
                handleCloseMessage(context);
                break;
            default:
                ui.logToOutput(`Unknown command: ${command}`);
                break;
        }
    }
}

/**
 * Handle initialization message from webview
 */
function handleInitMessage(context: WebviewContext): void {
    ui.logToOutput('StepFuncStudioView: INIT message received');
    // Send the ASL definition to the webview
    context.panel.webview.postMessage({
        command: 'ASL_DEFINITION',
        definition: context.aslDefinition,
    });
}

/**
 * Handle close message from webview
 */
function handleCloseMessage(context: WebviewContext): void {
    ui.logToOutput('StepFuncStudioView: CLOSE message received');
    context.panel.dispose();
}
