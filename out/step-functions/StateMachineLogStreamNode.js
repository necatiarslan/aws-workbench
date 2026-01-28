"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineLogStreamNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const cloudwatchApi = require("../cloudwatch-logs/API");
class StateMachineLogStreamNode extends NodeBase_1.NodeBase {
    constructor(logStreamName, parent, logGroupName) {
        super(logStreamName, parent);
        this.Icon = "file";
        this.LogStreamName = logStreamName;
        if (logGroupName)
            this.LogGroupName = logGroupName;
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.SetContextValue();
    }
    LogStreamName = "";
    LogGroupName = "";
    async handleNodeView() {
        const logsGroupNode = this.Parent;
        const stateMachineNode = logsGroupNode?.Parent;
        if (!stateMachineNode)
            return;
        this.StartWorking();
        try {
            const eventsResult = await cloudwatchApi.GetLogEvents(stateMachineNode.Region, this.LogGroupName, this.LogStreamName);
            if (eventsResult.isSuccessful && eventsResult.result) {
                const logMessages = eventsResult.result
                    .map(event => event.message)
                    .filter(msg => msg)
                    .join('\n');
                if (logMessages) {
                    const document = await vscode.workspace.openTextDocument({
                        content: logMessages,
                        language: 'log'
                    });
                    await vscode.window.showTextDocument(document);
                }
                else {
                    ui.showInfoMessage('No log events found');
                }
            }
        }
        catch (error) {
            ui.logToOutput('StateMachineLogStreamNode.handleNodeView Error !!!', error);
            ui.showErrorMessage('Failed to view log stream', error);
        }
        this.StopWorking();
    }
}
exports.StateMachineLogStreamNode = StateMachineLogStreamNode;
//# sourceMappingURL=StateMachineLogStreamNode.js.map