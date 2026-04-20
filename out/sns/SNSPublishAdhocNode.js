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
exports.SNSPublishAdhocNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
class SNSPublishAdhocNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "edit";
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        // Attach event handlers
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.SetContextValue();
    }
    async handleNodeRun() {
        ui.logToOutput('SNSPublishAdhocNode.handleNodeRun Started');
        const topicNode = this.GetAwsResourceNode();
        if (!topicNode || !topicNode.TopicArn || !topicNode.Region) {
            ui.showWarningMessage('Topic ARN or region is not set.');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        // Prompt for message
        const message = await vscode.window.showInputBox({
            placeHolder: 'Enter message to publish',
            prompt: 'Message content to publish to SNS topic',
            ignoreFocusOut: true
        });
        if (message === undefined || message.trim().length === 0) {
            return;
        }
        // Optional: prompt for subject (useful for email subscriptions)
        const subject = await vscode.window.showInputBox({
            placeHolder: 'Enter subject (optional, press Enter to skip)',
            prompt: 'Subject for email subscriptions (optional)'
        });
        this.StartWorking();
        try {
            const result = await api.PublishMessage(topicNode.Region, topicNode.TopicArn, message, subject && subject.trim().length > 0 ? subject : undefined);
            if (!result.isSuccessful) {
                ui.logToOutput('api.PublishMessage Error !!!', result.error);
                ui.showErrorMessage('Publish Message Error !!!', result.error);
                return;
            }
            ui.logToOutput('api.PublishMessage Success - MessageId: ' + result.result?.MessageId);
            ui.showInfoMessage('Message published successfully. MessageId: ' + result.result?.MessageId);
        }
        catch (error) {
            ui.logToOutput('SNSPublishAdhocNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Publish Message Error !!!', error);
        }
        finally {
            this.StopWorking();
        }
    }
}
exports.SNSPublishAdhocNode = SNSPublishAdhocNode;
//# sourceMappingURL=SNSPublishAdhocNode.js.map