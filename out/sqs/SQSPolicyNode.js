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
exports.SQSPolicyNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const SQSQueueNode_1 = require("./SQSQueueNode");
class SQSPolicyNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "shield";
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        // Attach event handlers
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.SetContextValue();
    }
    GetQueueNode() {
        if (this.Parent instanceof SQSQueueNode_1.SQSQueueNode) {
            return this.Parent;
        }
        return undefined;
    }
    async handleNodeView() {
        ui.logToOutput('SQSPolicyNode.handleNodeView Started');
        const queueNode = this.GetQueueNode();
        if (!queueNode || !queueNode.QueueUrl || !queueNode.Region) {
            ui.showWarningMessage('Queue information is not available.');
            return;
        }
        this.StartWorking();
        try {
            const result = await api.GetQueuePolicy(queueNode.Region, queueNode.QueueUrl);
            if (!result.isSuccessful) {
                ui.logToOutput('api.GetQueuePolicy Error !!!', result.error);
                ui.showErrorMessage('Get Queue Policy Error !!!', result.error);
                this.StopWorking();
                return;
            }
            let policyContent;
            if (result.result) {
                // Try to format the policy JSON
                try {
                    const policyObj = JSON.parse(result.result);
                    policyContent = JSON.stringify(policyObj, null, 2);
                }
                catch {
                    policyContent = result.result;
                }
            }
            else {
                policyContent = JSON.stringify({
                    message: "No policy configured for this queue"
                }, null, 2);
            }
            const document = await vscode.workspace.openTextDocument({
                content: policyContent,
                language: 'json'
            });
            await vscode.window.showTextDocument(document);
        }
        catch (error) {
            ui.logToOutput('SQSPolicyNode.handleNodeView Error !!!', error);
            ui.showErrorMessage('Get Queue Policy Error !!!', error);
        }
        this.StopWorking();
    }
}
exports.SQSPolicyNode = SQSPolicyNode;
//# sourceMappingURL=SQSPolicyNode.js.map