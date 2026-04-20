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
exports.StateMachineLogsGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
const cloudwatchApi = __importStar(require("../cloudwatch-logs/API"));
const StateMachineLogStreamNode_1 = require("./StateMachineLogStreamNode");
class StateMachineLogsGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "output";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        this.SetContextValue();
    }
    async handleLoadChildren() {
        const parent = this.Parent;
        if (!parent)
            return;
        this.StartWorking();
        try {
            // Get log group name
            let logGroupName = parent.LogGroupName;
            if (!logGroupName) {
                const definition = await parent.GetDefinition();
                if (definition?.loggingConfiguration?.destinations) {
                    const logArn = definition.loggingConfiguration.destinations[0]?.cloudWatchLogsLogGroup?.logGroupArn;
                    if (logArn) {
                        const parts = logArn.split(':');
                        if (parts.length >= 7) {
                            logGroupName = parts[6];
                            parent.LogGroupName = logGroupName;
                        }
                    }
                }
            }
            if (!logGroupName) {
                ui.logToOutput('No log group configured for this state machine');
                this.StopWorking();
                return;
            }
            // List log streams
            const result = await cloudwatchApi.GetLogStreamList(parent.Region, logGroupName);
            if (result.isSuccessful && result.result) {
                // Clear existing children
                this.Children = [];
                // Add log stream nodes (limit to 20 most recent)
                const streams = result.result.slice(0, 20);
                for (const stream of streams) {
                    if (stream) {
                        new StateMachineLogStreamNode_1.StateMachineLogStreamNode(stream, this, logGroupName);
                    }
                }
                if (streams.length === 0) {
                    ui.logToOutput('No log streams found');
                }
            }
        }
        catch (error) {
            ui.logToOutput('StateMachineLogsGroupNode.handleLoadChildren Error !!!', error);
            ui.showErrorMessage('Failed to load log streams', error);
        }
        this.StopWorking();
    }
    async handleNodeRefresh() {
        this.Children = [];
        this.IsOnNodeLoadChildrenCalled = false;
        await this.handleLoadChildren();
    }
    async handleNodeView() {
        const parent = this.Parent;
        if (!parent)
            return;
        this.StartWorking();
        try {
            let logGroupName = parent.LogGroupName;
            if (!logGroupName) {
                const definition = await parent.GetDefinition();
                if (definition?.loggingConfiguration?.destinations) {
                    const logArn = definition.loggingConfiguration.destinations[0]?.cloudWatchLogsLogGroup?.logGroupArn;
                    if (logArn) {
                        const parts = logArn.split(':');
                        if (parts.length >= 7) {
                            logGroupName = parts[6];
                        }
                    }
                }
            }
            if (!logGroupName) {
                ui.showWarningMessage('No log group configured for this state machine');
                this.StopWorking();
                return;
            }
            // Get latest log stream
            const streamListResult = await cloudwatchApi.GetLogStreamList(parent.Region, logGroupName);
            if (!streamListResult.isSuccessful || !streamListResult.result || streamListResult.result.length === 0) {
                ui.showWarningMessage('No log streams found');
                this.StopWorking();
                return;
            }
            const latestStream = streamListResult.result[0];
            // Get log events
            const eventsResult = await cloudwatchApi.GetLogEvents(parent.Region, logGroupName, latestStream);
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
            ui.logToOutput('StateMachineLogsGroupNode.handleNodeView Error !!!', error);
            ui.showErrorMessage('Failed to view logs', error);
        }
        this.StopWorking();
    }
}
exports.StateMachineLogsGroupNode = StateMachineLogsGroupNode;
//# sourceMappingURL=StateMachineLogsGroupNode.js.map