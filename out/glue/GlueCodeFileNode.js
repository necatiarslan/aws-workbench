"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueCodeFileNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const GlueJobNode_1 = require("./GlueJobNode");
const TreeState_1 = require("../tree/TreeState");
const ui = require("../common/UI");
class GlueCodeFileNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "file-code";
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.OnNodeLoaded.subscribe(() => this.handleNodeLoaded());
        this.SetContextValue();
    }
    getParentJob() {
        let current = this.Parent;
        while (current) {
            if (current instanceof GlueJobNode_1.GlueJobNode) {
                return current;
            }
            current = current.Parent;
        }
        return undefined;
    }
    async handleNodeLoaded() {
        const glueJobNode = this.GetAwsResourceNode();
        if (glueJobNode && glueJobNode.CodePath) {
            this.label = glueJobNode.CodePath;
        }
    }
    async handleNodeOpen() {
        ui.logToOutput('GlueCodeFileNode.handleNodeOpen Started');
        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }
        const fileUris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select Code File',
            filters: {
                'Python files': ['py'],
                'Scala files': ['scala'],
                'All files': ['*']
            }
        });
        if (!fileUris || fileUris.length === 0) {
            return;
        }
        job.CodePath = fileUris[0].fsPath;
        this.description = job.CodePath;
        TreeState_1.TreeState.save();
        ui.showInfoMessage(`Code file set to: ${job.CodePath}`);
        ui.logToOutput(`GlueCodeFileNode: Code path set to ${job.CodePath}`);
    }
}
exports.GlueCodeFileNode = GlueCodeFileNode;
//# sourceMappingURL=GlueCodeFileNode.js.map