"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaCodeFileNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const ui = require("../common/UI");
const TreeProvider_1 = require("../tree/TreeProvider");
const TreeState_1 = require("../tree/TreeState");
class LambdaCodeFileNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "file-code";
        this.ShouldBeSaved = false;
        this.EnableNodeAdd = true;
        this.EnableNodeRemove = true;
        this.EnableNodeEdit = true;
        this.SetContextValue();
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
    }
    async handleNodeAdd() {
        ui.logToOutput('LambdaCodeFileNode.NodeAdd Started');
        const selectedPath = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select Code File or Folder',
            canSelectFiles: true,
            canSelectFolders: true,
            filters: {
                'All Files': ['*'],
                'ZIP Files': ['zip'],
                'Python Files': ['py'],
                'JavaScript Files': ['js'],
                'TypeScript Files': ['ts']
            }
        });
        if (!selectedPath || selectedPath.length === 0) {
            return;
        }
        const lambdaNode = this.GetAwsResourceNode();
        lambdaNode.CodePath = selectedPath[0].fsPath;
        this.label = `Code Path: ${lambdaNode.CodePath}`;
        TreeState_1.TreeState.save();
        ui.logToOutput('Code Path: ' + lambdaNode.CodePath);
        ui.showInfoMessage('Code Path Set Successfully');
        TreeProvider_1.TreeProvider.Current.Refresh(this);
    }
    async handleNodeRemove() {
        ui.logToOutput('LambdaCodeFileNode.handleNodeRemove Started');
        const lambdaNode = this.GetAwsResourceNode();
        lambdaNode.CodePath = '';
        this.label = 'Select File';
        TreeState_1.TreeState.save();
        ui.logToOutput('Code Path: ' + lambdaNode.CodePath);
        ui.showInfoMessage('Code Path Removed Successfully');
        TreeProvider_1.TreeProvider.Current.Refresh(this);
    }
    async handleNodeEdit() {
        ui.logToOutput('LambdaCodeFileNode.NodeEdit Started');
        const lambdaNode = this.GetAwsResourceNode();
        if (!lambdaNode.CodePath || lambdaNode.CodePath.trim().length === 0) {
            ui.showWarningMessage('No file path set. Please add a code path first.');
            return;
        }
        try {
            const fileUri = vscode.Uri.file(lambdaNode.CodePath);
            const document = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(document);
            ui.logToOutput('Opened file for editing: ' + lambdaNode.CodePath);
        }
        catch (error) {
            ui.logToOutput('LambdaCodeFileNode.NodeEdit Error !!!', error);
            ui.showErrorMessage('Failed to open file for editing', error);
        }
    }
    async NodeLoaded() {
        const lambdaNode = this.GetAwsResourceNode();
        if (lambdaNode.CodePath && lambdaNode.CodePath.trim().length > 0) {
            this.label = `Code Path: ${lambdaNode.CodePath}`;
        }
        else {
            this.label = 'Select File';
        }
    }
}
exports.LambdaCodeFileNode = LambdaCodeFileNode;
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaCodeFileNode', LambdaCodeFileNode);
//# sourceMappingURL=LambdaCodeFileNode.js.map