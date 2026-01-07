"use strict";
/**
 * Handles messages received from the Workflow Studio webview
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessage = handleMessage;
const types_1 = require("./types");
const ui = require("../../common/UI");
/**
 * Handles messages from the webview
 * @param message The message received from the webview
 * @param context The webview context
 */
async function handleMessage(message, context) {
    const { command, messageType } = message;
    if (messageType === types_1.MessageType.REQUEST) {
        switch (command) {
            case types_1.Command.INIT:
                handleInitMessage(context);
                break;
            case types_1.Command.CLOSE:
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
function handleInitMessage(context) {
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
function handleCloseMessage(context) {
    ui.logToOutput('StepFuncStudioView: CLOSE message received');
    context.panel.dispose();
}
//# sourceMappingURL=handleMessage.js.map