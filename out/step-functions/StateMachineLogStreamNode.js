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
exports.StateMachineLogStreamNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
const cloudwatchApi = __importStar(require("../cloudwatch-logs/API"));
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