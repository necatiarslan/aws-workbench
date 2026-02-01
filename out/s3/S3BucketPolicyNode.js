"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3BucketPolicyNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const S3BucketNode_1 = require("./S3BucketNode");
class S3BucketPolicyNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = 'shield';
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.SetContextValue();
    }
    GetBucketNode() {
        if (this.Parent instanceof S3BucketNode_1.S3BucketNode) {
            return this.Parent;
        }
        return undefined;
    }
    async handleNodeView() {
        ui.logToOutput('S3BucketPolicyNode.handleNodeView Started');
        const bucketNode = this.GetBucketNode();
        if (!bucketNode || !bucketNode.BucketName) {
            ui.showWarningMessage('Bucket information is not available.');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            const result = await api.GetBucketPolicy(bucketNode.BucketName);
            if (!result.isSuccessful) {
                ui.logToOutput('api.GetBucketPolicy Error !!!', result.error);
                ui.showErrorMessage('Get Bucket Policy Error !!!', result.error);
                return;
            }
            if (!result.result) {
                ui.showInfoMessage('No policy configured for this bucket.');
                return;
            }
            let policyContent;
            try {
                const policyObj = JSON.parse(result.result);
                policyContent = JSON.stringify(policyObj, null, 2);
            }
            catch {
                policyContent = result.result;
            }
            const document = await vscode.workspace.openTextDocument({
                content: policyContent,
                language: 'json'
            });
            await vscode.window.showTextDocument(document);
        }
        catch (error) {
            ui.logToOutput('S3BucketPolicyNode.handleNodeView Error !!!', error);
            ui.showErrorMessage('Get Bucket Policy Error !!!', error);
        }
        finally {
            this.StopWorking();
        }
    }
}
exports.S3BucketPolicyNode = S3BucketPolicyNode;
//# sourceMappingURL=S3BucketPolicyNode.js.map