"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSPolicyNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
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